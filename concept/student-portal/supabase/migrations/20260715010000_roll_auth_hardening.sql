-- Harden credential lifecycle concurrency and legacy-account cutover.
-- Every temporary-credential generation receives a new UUID. Password-change
-- completion must compare that exact generation before opening the data gate.

alter table app_private.user_accounts
  add column credential_version uuid not null default extensions.gen_random_uuid();

comment on column app_private.user_accounts.credential_version is
  'Opaque compare-and-swap token rotated whenever provisioning or reset issues a new temporary credential.';

-- These RPCs gain an output column, so PostgreSQL requires drop/recreate rather
-- than CREATE OR REPLACE. They remain callable only through service_role.
drop function api.complete_student_account_provision(uuid, uuid, uuid);

create function api.complete_student_account_provision(
  p_actor_id uuid,
  p_student_id uuid,
  p_user_id uuid
)
returns table (
  student_id uuid,
  login_id text,
  auth_email text,
  user_id uuid,
  already_provisioned boolean,
  credential_version uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_identity record;
  v_auth_email text;
  v_legacy_user_id uuid;
  v_legacy_login_id text;
  v_credential_version uuid;
begin
  if not app_private.has_any_role(p_actor_id, array['admin']) then
    raise exception using errcode = '42501', message = 'active admin role required';
  end if;

  if p_user_id is null then
    raise exception using errcode = '22023', message = 'Auth user id is required';
  end if;

  perform 1
  from app_private.students s
  where s.id = p_student_id and s.is_active
  for update;

  select * into v_identity
  from app_private.student_login_identity(p_student_id);

  if v_identity.already_provisioned then
    if v_identity.user_id <> p_user_id then
      raise exception using errcode = '23505', message = 'student already has a different login account';
    end if;

    select ua.credential_version
      into v_credential_version
    from app_private.user_accounts ua
    where ua.user_id = p_user_id;

    return query
      select
        p_student_id,
        v_identity.login_id,
        v_identity.auth_email,
        p_user_id,
        true,
        v_credential_version;
    return;
  end if;

  select lower(u.email)
    into v_auth_email
  from auth.users u
  where u.id = p_user_id
    and u.deleted_at is null;

  if not found then
    raise exception using errcode = 'P0002', message = 'Auth user not found';
  end if;

  if v_auth_email is distinct from v_identity.auth_email then
    raise exception using errcode = '22023', message = 'Auth user email does not match the derived student login';
  end if;

  perform 1
  from app_private.user_accounts ua
  where ua.user_id = p_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'portal account not found';
  end if;

  if exists (
    select 1
    from app_private.user_accounts ua
    where ua.login_id = v_identity.login_id
      and ua.user_id <> p_user_id
  ) then
    raise exception using errcode = '23505', message = 'login id is already assigned';
  end if;

  if exists (
    select 1
    from app_private.student_account_links l
    where l.user_id = p_user_id
      and l.student_id <> p_student_id
      and l.relationship = 'student'
      and l.is_active
  ) then
    raise exception using errcode = '23505', message = 'Auth user is already linked to another student';
  end if;

  select l.user_id, ua.login_id
    into v_legacy_user_id, v_legacy_login_id
  from app_private.student_account_links l
  join app_private.user_accounts ua on ua.user_id = l.user_id
  where l.student_id = p_student_id
    and l.relationship = 'student'
    and l.is_active
  for update of l, ua;

  if found and v_legacy_user_id <> p_user_id then
    if v_legacy_login_id is not null then
      raise exception using errcode = '23505', message = 'student already has a different login account';
    end if;

    -- Cut over only the selected primary-student link. The legacy Auth user may
    -- still be a guardian, another student, or a staff account.
    update app_private.student_account_links as l
    set is_active = false
    where l.user_id = v_legacy_user_id
      and l.student_id = p_student_id
      and l.relationship = 'student'
      and l.is_active;

    if not exists (
      select 1
      from app_private.student_account_links remaining_link
      where remaining_link.user_id = v_legacy_user_id
        and remaining_link.is_active
    ) and not exists (
      select 1
      from app_private.account_roles remaining_role
      where remaining_role.user_id = v_legacy_user_id
    ) then
      update app_private.user_accounts as ua
      set
        status = 'disabled',
        status_reason = 'Replaced by roll-number account',
        status_changed_by = p_actor_id,
        status_changed_at = statement_timestamp()
      where ua.user_id = v_legacy_user_id;
    end if;
  end if;

  update app_private.user_accounts ua
  set
    login_id = v_identity.login_id,
    must_change_password = true,
    temporary_password_issued_at = statement_timestamp(),
    password_changed_at = null,
    credential_changed_by = p_actor_id,
    credential_changed_at = statement_timestamp(),
    credential_version = extensions.gen_random_uuid()
  where ua.user_id = p_user_id
    and ua.status = 'active'
    and (ua.login_id is null or ua.login_id = v_identity.login_id)
  returning ua.credential_version into v_credential_version;

  if not found then
    raise exception using errcode = '55000', message = 'portal account cannot be provisioned';
  end if;

  insert into app_private.student_account_links (
    user_id,
    student_id,
    relationship,
    linked_by,
    is_active
  )
  values (p_user_id, p_student_id, 'student', p_actor_id, true)
  on conflict on constraint student_account_links_pkey do update
    set
      relationship = 'student',
      linked_by = excluded.linked_by,
      linked_at = statement_timestamp(),
      is_active = true;

  perform app_private.write_audit_event(
    p_actor_id,
    'credential.account_provisioned',
    'student',
    p_student_id,
    jsonb_build_object(
      'user_id', p_user_id,
      'credential_version', v_credential_version
    )
  );

  return query
    select
      p_student_id,
      v_identity.login_id,
      v_identity.auth_email,
      p_user_id,
      true,
      v_credential_version;
end;
$$;

drop function api.begin_student_credential_reset(uuid, uuid);

create function api.begin_student_credential_reset(
  p_actor_id uuid,
  p_student_id uuid
)
returns table (
  student_id uuid,
  user_id uuid,
  login_id text,
  auth_email text,
  must_change_password boolean,
  credential_version uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_login_id text;
  v_auth_email text;
  v_credential_version uuid;
begin
  if not app_private.has_any_role(p_actor_id, array['admin']) then
    raise exception using errcode = '42501', message = 'active admin role required';
  end if;

  select l.user_id, ua.login_id
    into v_user_id, v_login_id
  from app_private.student_account_links l
  join app_private.user_accounts ua on ua.user_id = l.user_id
  where l.student_id = p_student_id
    and l.relationship = 'student'
    and l.is_active
    and ua.status = 'active'
    and ua.login_id is not null
  for update of l, ua;

  if not found then
    raise exception using errcode = 'P0002', message = 'active student login account not found';
  end if;

  v_auth_email := 'student.' || lower(v_login_id) || '@login.concept.invalid';
  if not exists (
    select 1
    from auth.users u
    where u.id = v_user_id
      and lower(u.email) = v_auth_email
      and u.deleted_at is null
  ) then
    raise exception using errcode = '55000', message = 'student Auth identity does not match its login id';
  end if;

  update app_private.user_accounts as ua
  set
    must_change_password = true,
    temporary_password_issued_at = statement_timestamp(),
    password_changed_at = null,
    credential_changed_by = p_actor_id,
    credential_changed_at = statement_timestamp(),
    credential_version = extensions.gen_random_uuid()
  where ua.user_id = v_user_id
  returning ua.credential_version into v_credential_version;

  perform app_private.write_audit_event(
    p_actor_id,
    'credential.reset_required',
    'student',
    p_student_id,
    jsonb_build_object(
      'user_id', v_user_id,
      'credential_version', v_credential_version
    )
  );

  return query
    select
      p_student_id,
      v_user_id,
      v_login_id,
      v_auth_email,
      true,
      v_credential_version;
end;
$$;

drop function api.credential_state(uuid);

create function api.credential_state(p_user_id uuid)
returns table (
  user_id uuid,
  login_id text,
  must_change_password boolean,
  account_status text,
  password_changed_at timestamptz,
  credential_version uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
  select
    ua.user_id,
    ua.login_id,
    ua.must_change_password,
    ua.status::text,
    ua.password_changed_at,
    ua.credential_version
  from app_private.user_accounts ua
  where ua.user_id = p_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'portal account not found';
  end if;
end;
$$;

-- Remove the one-argument completion surface entirely: no caller, including a
-- service-role bug, can clear the gate without presenting the observed version.
drop function api.complete_initial_password_change(uuid);

create function api.complete_initial_password_change(
  p_user_id uuid,
  p_expected_credential_version uuid
)
returns table (
  user_id uuid,
  must_change_password boolean,
  password_changed_at timestamptz,
  credential_version uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_account app_private.user_accounts%rowtype;
begin
  if p_expected_credential_version is null then
    raise exception using errcode = '22023', message = 'expected credential version is required';
  end if;

  select * into v_account
  from app_private.user_accounts ua
  where ua.user_id = p_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'portal account not found';
  end if;

  if v_account.status <> 'active' then
    raise exception using errcode = '42501', message = 'account is not active';
  end if;

  if v_account.credential_version is distinct from p_expected_credential_version then
    raise exception using
      errcode = '40001',
      message = 'credential state changed; restart password change';
  end if;

  if not v_account.must_change_password then
    if v_account.password_changed_at is null then
      raise exception using errcode = '55000', message = 'account is not awaiting an initial password change';
    end if;

    return query
      select
        p_user_id,
        false,
        v_account.password_changed_at,
        v_account.credential_version;
    return;
  end if;

  update app_private.user_accounts as ua
  set
    must_change_password = false,
    password_changed_at = statement_timestamp(),
    credential_changed_by = p_user_id,
    credential_changed_at = statement_timestamp()
  where ua.user_id = p_user_id
    and ua.must_change_password
    and ua.credential_version = p_expected_credential_version
  returning ua.password_changed_at, ua.credential_version
    into v_account.password_changed_at, v_account.credential_version;

  if not found then
    raise exception using
      errcode = '40001',
      message = 'credential state changed; restart password change';
  end if;

  perform app_private.write_audit_event(
    p_user_id,
    'credential.password_changed',
    'user_account',
    p_user_id,
    jsonb_build_object('credential_version', v_account.credential_version)
  );

  return query
    select
      p_user_id,
      false,
      v_account.password_changed_at,
      v_account.credential_version;
end;
$$;

revoke execute on function api.complete_student_account_provision(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke execute on function api.begin_student_credential_reset(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function api.credential_state(uuid)
  from public, anon, authenticated;
revoke execute on function api.complete_initial_password_change(uuid, uuid)
  from public, anon, authenticated;

grant execute on function api.complete_student_account_provision(uuid, uuid, uuid)
  to service_role;
grant execute on function api.begin_student_credential_reset(uuid, uuid)
  to service_role;
grant execute on function api.credential_state(uuid)
  to service_role;
grant execute on function api.complete_initial_password_change(uuid, uuid)
  to service_role;

comment on function api.complete_student_account_provision(uuid, uuid, uuid) is
  'Service-only Auth binding. Rotates and returns a credential version when provisioning first succeeds.';
comment on function api.begin_student_credential_reset(uuid, uuid) is
  'Service-only fail-closed reset marker. Rotates and returns the credential version before Auth password replacement.';
comment on function api.credential_state(uuid) is
  'Service-only credential state including the current compare-and-swap version.';
comment on function api.complete_initial_password_change(uuid, uuid) is
  'Service-only credential gate completion requiring the exact version observed before Supabase Auth accepted the new password.';
