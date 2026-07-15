-- Serialize cross-service credential writes with short-lived operation leases.
-- Supabase Auth and Postgres cannot share one transaction, so every Auth write
-- first claims a DB nonce. Ten minutes exceeds Supabase's documented hosted
-- Edge Function wall-clock maximum (400 seconds) while remaining recoverable.

alter table app_private.user_accounts
  add column password_change_operation_id uuid,
  add column password_change_operation_state text,
  add column password_change_operation_started_at timestamptz,
  add column password_change_operation_completed_at timestamptz,
  add column password_change_operation_credential_version uuid,
  add constraint user_accounts_credential_operation_valid check (
    (
      password_change_operation_state is null
      and password_change_operation_id is null
      and password_change_operation_started_at is null
      and password_change_operation_completed_at is null
      and password_change_operation_credential_version is null
    )
    or (
      password_change_operation_state in (
        'provisioning',
        'provisioned',
        'changing',
        'completed',
        'compensating',
        'resetting',
        'reset-required',
        'reset-failed'
      )
      and password_change_operation_id is not null
      and password_change_operation_started_at is not null
      and password_change_operation_credential_version is not null
      and (
        (
          password_change_operation_state in (
            'provisioned', 'completed', 'reset-required', 'reset-failed'
          )
          and password_change_operation_completed_at is not null
        )
        or (
          password_change_operation_state in (
            'provisioning', 'changing', 'compensating', 'resetting'
          )
          and password_change_operation_completed_at is null
        )
      )
    )
  );

-- Strongly invalidate signed access JWTs whose Auth session was deleted by a
-- password reset/sign-out. Trusted service-role RPCs have no authenticated-user
-- JWT and therefore retain their existing actor checks.
create or replace function app_private.is_account_active(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from app_private.user_accounts ua
    where ua.user_id = p_user_id
      and ua.status = 'active'
      and not ua.must_change_password
      and case
        when auth.role() = 'authenticated' then
          auth.uid() = p_user_id
          and exists (
            select 1
            from auth.sessions session
            where session.user_id = p_user_id
              and session.id::text = auth.jwt()->>'session_id'
          )
        else true
      end
  );
$$;

-- Retain the already-tested binding/reset implementations as owner-only
-- primitives. Public service contracts below add operation serialization.
alter function api.complete_student_account_provision(uuid, uuid, uuid)
  set schema app_private;
alter function app_private.complete_student_account_provision(uuid, uuid, uuid)
  rename to complete_student_account_provision_without_lease;
revoke execute on function app_private.complete_student_account_provision_without_lease(uuid, uuid, uuid)
  from public, anon, authenticated, service_role;

alter function api.begin_student_credential_reset(uuid, uuid)
  set schema app_private;
alter function app_private.begin_student_credential_reset(uuid, uuid)
  rename to begin_student_credential_reset_without_lease;
revoke execute on function app_private.begin_student_credential_reset_without_lease(uuid, uuid)
  from public, anon, authenticated, service_role;

drop function api.complete_initial_password_change(uuid, uuid);

create function api.complete_student_account_provision(
  p_actor_id uuid,
  p_student_id uuid,
  p_user_id uuid,
  p_operation_id uuid
)
returns table (
  student_id uuid,
  login_id text,
  auth_email text,
  user_id uuid,
  already_provisioned boolean,
  credential_version uuid,
  operation_id uuid,
  provisioning_required boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_existing_user_id uuid;
  v_account app_private.user_accounts%rowtype;
  v_bound record;
begin
  if p_operation_id is null then
    raise exception using errcode = '22023', message = 'credential operation id is required';
  end if;
  if not app_private.has_any_role(p_actor_id, array['admin']) then
    raise exception using errcode = '42501', message = 'active admin role required';
  end if;

  perform 1
  from app_private.students s
  where s.id = p_student_id and s.is_active
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'active student not found';
  end if;

  select l.user_id
    into v_existing_user_id
  from app_private.student_account_links l
  join app_private.user_accounts ua on ua.user_id = l.user_id
  where l.student_id = p_student_id
    and l.relationship = 'student'
    and l.is_active
    and ua.login_id is not null;

  if found then
    if v_existing_user_id <> p_user_id then
      raise exception using errcode = '23505', message = 'student already has a different login account';
    end if;

    select * into v_account
    from app_private.user_accounts ua
    where ua.user_id = p_user_id
    for update;

    if v_account.password_change_operation_id = p_operation_id
       and v_account.password_change_operation_state in ('provisioning', 'provisioned')
       and v_account.password_change_operation_credential_version = v_account.credential_version then
      return query
      select
        p_student_id,
        v_account.login_id,
        'student.' || lower(v_account.login_id) || '@login.concept.invalid',
        p_user_id,
        true,
        v_account.credential_version,
        p_operation_id,
        v_account.password_change_operation_state = 'provisioning';
      return;
    end if;

    if v_account.password_change_operation_state in (
      'provisioning', 'changing', 'compensating', 'resetting'
    ) and v_account.password_change_operation_started_at
          > statement_timestamp() - interval '10 minutes' then
      raise exception using errcode = '55P03', message = 'credential change already in progress';
    end if;

    raise exception using errcode = '55000', message = 'student account is already provisioned';
  end if;

  select * into v_bound
  from app_private.complete_student_account_provision_without_lease(
    p_actor_id,
    p_student_id,
    p_user_id
  );

  update app_private.user_accounts as ua
  set
    password_change_operation_id = p_operation_id,
    password_change_operation_state = 'provisioning',
    password_change_operation_started_at = statement_timestamp(),
    password_change_operation_completed_at = null,
    password_change_operation_credential_version = ua.credential_version
  where ua.user_id = p_user_id
  returning * into v_account;

  return query
  select
    v_bound.student_id,
    v_bound.login_id,
    v_bound.auth_email,
    v_bound.user_id,
    v_bound.already_provisioned,
    v_account.credential_version,
    p_operation_id,
    true;
end;
$$;

create function api.complete_provisioning_credential(
  p_user_id uuid,
  p_expected_credential_version uuid,
  p_operation_id uuid
)
returns table (
  user_id uuid,
  must_change_password boolean,
  credential_version uuid,
  operation_id uuid,
  provisioning_complete boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
begin
  select * into v_account
  from app_private.user_accounts ua
  where ua.user_id = p_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'portal account not found';
  end if;

  if v_account.credential_version is distinct from p_expected_credential_version
     or v_account.password_change_operation_id is distinct from p_operation_id
     or v_account.password_change_operation_credential_version
          is distinct from p_expected_credential_version then
    raise exception using errcode = '40001', message = 'credential operation changed; restart provisioning';
  end if;

  if v_account.password_change_operation_state = 'provisioned' then
    return query select p_user_id, true, v_account.credential_version, p_operation_id, true;
    return;
  end if;
  if v_account.password_change_operation_state <> 'provisioning' then
    raise exception using errcode = '55000', message = 'account is not awaiting provisioning completion';
  end if;

  update app_private.user_accounts as ua
  set
    password_change_operation_state = 'provisioned',
    password_change_operation_completed_at = statement_timestamp()
  where ua.user_id = p_user_id;

  perform app_private.write_audit_event(
    p_user_id,
    'credential.provisioning_completed',
    'user_account',
    p_user_id,
    jsonb_build_object('credential_version', p_expected_credential_version, 'operation_id', p_operation_id)
  );
  return query select p_user_id, true, p_expected_credential_version, p_operation_id, true;
end;
$$;

create function api.cancel_provisioning_credential(
  p_user_id uuid,
  p_expected_credential_version uuid,
  p_operation_id uuid
)
returns table (
  user_id uuid,
  must_change_password boolean,
  credential_version uuid,
  operation_id uuid,
  cancelled boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
  v_cancelled boolean := false;
begin
  select * into v_account
  from app_private.user_accounts ua
  where ua.user_id = p_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'portal account not found';
  end if;

  if v_account.credential_version = p_expected_credential_version
     and v_account.password_change_operation_id = p_operation_id
     and v_account.password_change_operation_state = 'provisioning' then
    update app_private.user_accounts as ua
    set
      password_change_operation_id = null,
      password_change_operation_state = null,
      password_change_operation_started_at = null,
      password_change_operation_completed_at = null,
      password_change_operation_credential_version = null
    where ua.user_id = p_user_id;
    v_cancelled := true;
  end if;

  return query
    select p_user_id, v_account.must_change_password, v_account.credential_version, p_operation_id, v_cancelled;
end;
$$;

create function api.begin_student_credential_reset(
  p_actor_id uuid,
  p_student_id uuid,
  p_operation_id uuid
)
returns table (
  student_id uuid,
  user_id uuid,
  login_id text,
  auth_email text,
  must_change_password boolean,
  credential_version uuid,
  operation_id uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
  v_target record;
begin
  if p_operation_id is null then
    raise exception using errcode = '22023', message = 'credential operation id is required';
  end if;
  if not app_private.has_any_role(p_actor_id, array['admin']) then
    raise exception using errcode = '42501', message = 'active admin role required';
  end if;

  select ua.* into v_account
  from app_private.student_account_links l
  join app_private.user_accounts ua on ua.user_id = l.user_id
  where l.student_id = p_student_id
    and l.relationship = 'student'
    and l.is_active
    and ua.status = 'active'
    and ua.login_id is not null
  for update of ua;
  if not found then
    raise exception using errcode = 'P0002', message = 'active student login account not found';
  end if;

  if v_account.password_change_operation_id = p_operation_id
     and v_account.password_change_operation_state in ('resetting', 'reset-required')
     and v_account.password_change_operation_credential_version = v_account.credential_version then
    return query
      select p_student_id, v_account.user_id, v_account.login_id,
        'student.' || lower(v_account.login_id) || '@login.concept.invalid', true,
        v_account.credential_version, p_operation_id;
    return;
  end if;

  if v_account.password_change_operation_state in (
    'provisioning', 'changing', 'compensating', 'resetting'
  ) and v_account.password_change_operation_started_at
        > statement_timestamp() - interval '10 minutes' then
    raise exception using errcode = '55P03', message = 'credential change already in progress';
  end if;

  select * into v_target
  from app_private.begin_student_credential_reset_without_lease(p_actor_id, p_student_id);

  update app_private.user_accounts as ua
  set
    password_change_operation_id = p_operation_id,
    password_change_operation_state = 'resetting',
    password_change_operation_started_at = statement_timestamp(),
    password_change_operation_completed_at = null,
    password_change_operation_credential_version = ua.credential_version
  where ua.user_id = v_target.user_id;

  return query
  select v_target.student_id, v_target.user_id, v_target.login_id, v_target.auth_email,
    true, v_target.credential_version, p_operation_id;
end;
$$;

create function api.complete_student_credential_reset(
  p_user_id uuid,
  p_expected_credential_version uuid,
  p_operation_id uuid
)
returns table (
  user_id uuid,
  must_change_password boolean,
  credential_version uuid,
  operation_id uuid,
  reset_complete boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
begin
  select * into v_account from app_private.user_accounts ua
  where ua.user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'portal account not found'; end if;

  if v_account.credential_version is distinct from p_expected_credential_version
     or v_account.password_change_operation_id is distinct from p_operation_id
     or v_account.password_change_operation_credential_version is distinct from p_expected_credential_version then
    raise exception using errcode = '40001', message = 'credential operation changed; restart reset';
  end if;
  if v_account.password_change_operation_state = 'reset-required' then
    return query select p_user_id, true, v_account.credential_version, p_operation_id, true;
    return;
  end if;
  if v_account.password_change_operation_state <> 'resetting' then
    raise exception using errcode = '55000', message = 'account is not awaiting reset completion';
  end if;

  update app_private.user_accounts as ua
  set password_change_operation_state = 'reset-required',
      password_change_operation_completed_at = statement_timestamp()
  where ua.user_id = p_user_id;
  perform app_private.write_audit_event(
    p_user_id, 'credential.reset_completed', 'user_account', p_user_id,
    jsonb_build_object('credential_version', p_expected_credential_version, 'operation_id', p_operation_id)
  );
  return query select p_user_id, true, p_expected_credential_version, p_operation_id, true;
end;
$$;

create function api.fail_student_credential_reset(
  p_user_id uuid,
  p_expected_credential_version uuid,
  p_operation_id uuid
)
returns table (
  user_id uuid,
  must_change_password boolean,
  credential_version uuid,
  operation_id uuid,
  reset_failed boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
begin
  select * into v_account from app_private.user_accounts ua
  where ua.user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'portal account not found'; end if;

  if v_account.credential_version = p_expected_credential_version
     and v_account.password_change_operation_id = p_operation_id
     and v_account.password_change_operation_state in ('resetting', 'reset-failed') then
    update app_private.user_accounts as ua
    set password_change_operation_state = 'reset-failed',
        password_change_operation_completed_at = statement_timestamp()
    where ua.user_id = p_user_id;
    return query select p_user_id, true, p_expected_credential_version, p_operation_id, true;
    return;
  end if;
  return query select p_user_id, v_account.must_change_password, v_account.credential_version, p_operation_id, false;
end;
$$;

create function api.begin_initial_password_change(
  p_user_id uuid,
  p_expected_credential_version uuid,
  p_operation_id uuid
)
returns table (
  user_id uuid,
  credential_version uuid,
  operation_id uuid,
  operation_expires_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
begin
  if p_expected_credential_version is null or p_operation_id is null then
    raise exception using errcode = '22023', message = 'credential version and operation id are required';
  end if;
  select * into v_account from app_private.user_accounts ua
  where ua.user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'portal account not found'; end if;
  if v_account.status <> 'active' then raise exception using errcode = '42501', message = 'account is not active'; end if;
  if v_account.credential_version is distinct from p_expected_credential_version then
    raise exception using errcode = '40001', message = 'credential state changed; restart password change';
  end if;
  if not v_account.must_change_password then
    raise exception using errcode = '55000', message = 'account is not awaiting an initial password change';
  end if;

  if v_account.password_change_operation_id = p_operation_id
     and v_account.password_change_operation_state = 'changing'
     and v_account.password_change_operation_credential_version = p_expected_credential_version then
    return query select p_user_id, p_expected_credential_version, p_operation_id,
      v_account.password_change_operation_started_at + interval '10 minutes';
    return;
  end if;
  if v_account.password_change_operation_state in ('resetting', 'reset-failed') then
    raise exception using errcode = '55P03', message = 'credential reset recovery required';
  end if;
  if v_account.password_change_operation_state in ('provisioning', 'changing', 'compensating')
     and v_account.password_change_operation_started_at
          > statement_timestamp() - interval '10 minutes' then
    raise exception using errcode = '55P03', message = 'credential change already in progress';
  end if;

  update app_private.user_accounts as ua
  set password_change_operation_id = p_operation_id,
      password_change_operation_state = 'changing',
      password_change_operation_started_at = statement_timestamp(),
      password_change_operation_completed_at = null,
      password_change_operation_credential_version = p_expected_credential_version
  where ua.user_id = p_user_id;
  perform app_private.write_audit_event(
    p_user_id, 'credential.password_change_started', 'user_account', p_user_id,
    jsonb_build_object('credential_version', p_expected_credential_version, 'operation_id', p_operation_id)
  );
  return query select p_user_id, p_expected_credential_version, p_operation_id,
    statement_timestamp() + interval '10 minutes';
end;
$$;

create function api.cancel_initial_password_change(
  p_user_id uuid,
  p_expected_credential_version uuid,
  p_operation_id uuid
)
returns table (
  user_id uuid,
  must_change_password boolean,
  credential_version uuid,
  operation_id uuid,
  cancelled boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
  v_cancelled boolean := false;
begin
  select * into v_account from app_private.user_accounts ua
  where ua.user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'portal account not found'; end if;
  if v_account.credential_version = p_expected_credential_version
     and v_account.password_change_operation_id = p_operation_id
     and v_account.password_change_operation_state = 'changing' then
    update app_private.user_accounts as ua
    set password_change_operation_id = null, password_change_operation_state = null,
        password_change_operation_started_at = null, password_change_operation_completed_at = null,
        password_change_operation_credential_version = null
    where ua.user_id = p_user_id;
    v_cancelled := true;
  end if;
  return query select p_user_id, v_account.must_change_password, v_account.credential_version,
    p_operation_id, v_cancelled;
end;
$$;

create function api.complete_initial_password_change(
  p_user_id uuid,
  p_expected_credential_version uuid,
  p_operation_id uuid
)
returns table (
  user_id uuid,
  must_change_password boolean,
  password_changed_at timestamptz,
  credential_version uuid,
  operation_id uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
begin
  select * into v_account from app_private.user_accounts ua
  where ua.user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'portal account not found'; end if;
  if v_account.status <> 'active' then raise exception using errcode = '42501', message = 'account is not active'; end if;
  if v_account.credential_version is distinct from p_expected_credential_version then
    raise exception using errcode = '40001', message = 'credential state changed; restart password change';
  end if;
  if v_account.password_change_operation_id is distinct from p_operation_id
     or v_account.password_change_operation_credential_version is distinct from p_expected_credential_version then
    raise exception using errcode = '40001', message = 'credential operation changed; restart password change';
  end if;
  if v_account.password_change_operation_state = 'completed' and not v_account.must_change_password then
    return query select p_user_id, false, v_account.password_changed_at,
      v_account.credential_version, p_operation_id;
    return;
  end if;
  if v_account.password_change_operation_state <> 'changing' or not v_account.must_change_password then
    raise exception using errcode = '55000', message = 'account is not awaiting password completion';
  end if;

  update app_private.user_accounts as ua
  set must_change_password = false,
      password_changed_at = statement_timestamp(),
      credential_changed_by = p_user_id,
      credential_changed_at = statement_timestamp(),
      password_change_operation_state = 'completed',
      password_change_operation_completed_at = statement_timestamp()
  where ua.user_id = p_user_id
  returning ua.password_changed_at into v_account.password_changed_at;
  perform app_private.write_audit_event(
    p_user_id, 'credential.password_changed', 'user_account', p_user_id,
    jsonb_build_object('credential_version', p_expected_credential_version, 'operation_id', p_operation_id)
  );
  return query select p_user_id, false, v_account.password_changed_at,
    p_expected_credential_version, p_operation_id;
end;
$$;

create function api.begin_failed_password_change_compensation(
  p_user_id uuid,
  p_expected_credential_version uuid,
  p_operation_id uuid
)
returns table (
  user_id uuid,
  must_change_password boolean,
  credential_version uuid,
  operation_id uuid,
  auth_compensation_required boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
  v_new_version uuid;
begin
  select * into v_account from app_private.user_accounts ua
  where ua.user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'portal account not found'; end if;

  if v_account.password_change_operation_id = p_operation_id
     and v_account.password_change_operation_credential_version = p_expected_credential_version
     and v_account.password_change_operation_state = 'compensating' then
    return query select p_user_id, true, v_account.credential_version, p_operation_id, true;
    return;
  end if;
  if v_account.credential_version = p_expected_credential_version
     and v_account.password_change_operation_id = p_operation_id
     and v_account.password_change_operation_credential_version = p_expected_credential_version
     and v_account.password_change_operation_state in ('changing', 'completed') then
    v_new_version := extensions.gen_random_uuid();
    update app_private.user_accounts as ua
    set must_change_password = true,
        password_changed_at = null,
        temporary_password_issued_at = statement_timestamp(),
        credential_changed_by = p_user_id,
        credential_changed_at = statement_timestamp(),
        credential_version = v_new_version,
        password_change_operation_state = 'compensating',
        password_change_operation_started_at = statement_timestamp(),
        password_change_operation_completed_at = null
    where ua.user_id = p_user_id;
    perform app_private.write_audit_event(
      p_user_id, 'credential.password_change_compensation_started', 'user_account', p_user_id,
      jsonb_build_object('failed_credential_version', p_expected_credential_version,
                         'compensation_credential_version', v_new_version,
                         'operation_id', p_operation_id)
    );
    return query select p_user_id, true, v_new_version, p_operation_id, true;
    return;
  end if;
  return query select p_user_id, v_account.must_change_password, v_account.credential_version,
    p_operation_id, false;
end;
$$;

create function api.complete_failed_password_change_compensation(
  p_user_id uuid,
  p_compensation_credential_version uuid,
  p_operation_id uuid
)
returns table (
  user_id uuid,
  must_change_password boolean,
  credential_version uuid,
  operation_id uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
begin
  select * into v_account from app_private.user_accounts ua
  where ua.user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'portal account not found'; end if;
  if v_account.credential_version is distinct from p_compensation_credential_version
     or v_account.password_change_operation_id is distinct from p_operation_id
     or v_account.password_change_operation_state <> 'compensating' then
    raise exception using errcode = '40001', message = 'credential compensation changed';
  end if;
  update app_private.user_accounts as ua
  set password_change_operation_id = null, password_change_operation_state = null,
      password_change_operation_started_at = null, password_change_operation_completed_at = null,
      password_change_operation_credential_version = null
  where ua.user_id = p_user_id;
  perform app_private.write_audit_event(
    p_user_id, 'credential.password_change_compensation_completed', 'user_account', p_user_id,
    jsonb_build_object('credential_version', p_compensation_credential_version, 'operation_id', p_operation_id)
  );
  return query select p_user_id, true, p_compensation_credential_version, p_operation_id;
end;
$$;

-- All operation RPCs are server-only. Owner-only primitives remain unreachable
-- even to service_role except through the serialized public contracts.
revoke execute on function api.complete_student_account_provision(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.complete_provisioning_credential(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.cancel_provisioning_credential(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.begin_student_credential_reset(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.complete_student_credential_reset(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.fail_student_credential_reset(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.begin_initial_password_change(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.cancel_initial_password_change(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.complete_initial_password_change(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.begin_failed_password_change_compensation(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function api.complete_failed_password_change_compensation(uuid, uuid, uuid) from public, anon, authenticated;

grant execute on function api.complete_student_account_provision(uuid, uuid, uuid, uuid) to service_role;
grant execute on function api.complete_provisioning_credential(uuid, uuid, uuid) to service_role;
grant execute on function api.cancel_provisioning_credential(uuid, uuid, uuid) to service_role;
grant execute on function api.begin_student_credential_reset(uuid, uuid, uuid) to service_role;
grant execute on function api.complete_student_credential_reset(uuid, uuid, uuid) to service_role;
grant execute on function api.fail_student_credential_reset(uuid, uuid, uuid) to service_role;
grant execute on function api.begin_initial_password_change(uuid, uuid, uuid) to service_role;
grant execute on function api.cancel_initial_password_change(uuid, uuid, uuid) to service_role;
grant execute on function api.complete_initial_password_change(uuid, uuid, uuid) to service_role;
grant execute on function api.begin_failed_password_change_compensation(uuid, uuid, uuid) to service_role;
grant execute on function api.complete_failed_password_change_compensation(uuid, uuid, uuid) to service_role;

comment on column app_private.user_accounts.password_change_operation_state is
  'Cross-service credential operation state; live states are protected by a ten-minute lease.';
comment on function api.begin_initial_password_change(uuid, uuid, uuid) is
  'Claims an exact credential generation and operation nonce before an external Auth password write.';
comment on function app_private.is_account_active(uuid) is
  'Checks status and credential gate; authenticated user requests additionally require their JWT session_id to exist in auth.sessions.';
