-- Roll-number student authentication and a unified admin result workflow.
-- Password material remains exclusively in Supabase Auth. This migration stores
-- only a canonical login id, credential lifecycle state, and audit metadata.

alter table app_private.user_accounts
  add column login_id text,
  add column must_change_password boolean not null default false,
  add column temporary_password_issued_at timestamptz,
  add column password_changed_at timestamptz,
  add column credential_changed_by uuid references auth.users(id) on delete restrict,
  add column credential_changed_at timestamptz,
  add constraint user_accounts_login_id_valid check (
    login_id is null
    or (
      login_id = btrim(login_id)
      and login_id = lower(login_id)
      and length(login_id) between 1 and 64
      and login_id ~ '^[a-z0-9][a-z0-9_-]{0,63}$'
    )
  ),
  add constraint user_accounts_credential_audit_valid check (
    credential_changed_at is not null
    or (
      credential_changed_by is null
      and temporary_password_issued_at is null
      and password_changed_at is null
    )
  );

create unique index user_accounts_login_id_unique_idx
  on app_private.user_accounts(login_id)
  where login_id is not null;

-- Guardian links remain many-to-many. A student record has at most one active
-- primary student account; replacing a legacy email identity first deactivates
-- its primary link in the same transaction.
do $migration$
declare
  v_duplicate_students bigint;
  v_sample text;
begin
  select count(*)
    into v_duplicate_students
  from (
    select l.student_id
    from app_private.student_account_links l
    where l.is_active
      and l.relationship = 'student'
    group by l.student_id
    having count(*) > 1
  ) duplicates;

  if v_duplicate_students > 0 then
    select string_agg(
      format('%s (%s active links)', sample.student_id, sample.link_count),
      ', '
      order by sample.student_id
    )
      into v_sample
    from (
      select l.student_id, count(*) as link_count
      from app_private.student_account_links l
      where l.is_active
        and l.relationship = 'student'
      group by l.student_id
      having count(*) > 1
      order by l.student_id
      limit 5
    ) sample;

    raise exception using
      errcode = '23505',
      message = 'Cannot enforce one active primary account per student: legacy duplicate links exist',
      detail = format(
        '%s student record(s) have multiple active student links. Sample: %s',
        v_duplicate_students,
        coalesce(v_sample, 'unavailable')
      ),
      hint = 'Inspect with: SELECT student_id, array_agg(user_id ORDER BY user_id) AS active_user_ids FROM app_private.student_account_links WHERE is_active AND relationship = ''student'' GROUP BY student_id HAVING count(*) > 1; deactivate only superseded links, then rerun the migration.';
  end if;
end;
$migration$;

create unique index one_active_primary_account_per_student_idx
  on app_private.student_account_links(student_id)
  where is_active and relationship = 'student';

create or replace function app_private.canonical_login_part(p_value text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select nullif(
    btrim(
      regexp_replace(lower(btrim(coalesce(p_value, ''))), '[^a-z0-9_-]+', '-', 'g'),
      '-_'
    ),
    ''
  );
$$;

create or replace function app_private.student_login_identity(p_student_id uuid)
returns table (
  login_id text,
  auth_email text,
  user_id uuid,
  already_provisioned boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_existing_user_id uuid;
  v_existing_login_id text;
  v_roll_no text;
  v_batch_code text;
  v_academic_year text;
  v_roll_part text;
  v_batch_part text;
  v_candidate text;
  v_suffix text;
  v_roll_is_duplicated boolean;
begin
  if p_student_id is null then
    raise exception using errcode = '22023', message = 'student id is required';
  end if;

  if not exists (
    select 1
    from app_private.students s
    where s.id = p_student_id and s.is_active
  ) then
    raise exception using errcode = 'P0002', message = 'active student not found';
  end if;

  select l.user_id, ua.login_id
    into v_existing_user_id, v_existing_login_id
  from app_private.student_account_links l
  join app_private.user_accounts ua on ua.user_id = l.user_id
  where l.student_id = p_student_id
    and l.relationship = 'student'
    and l.is_active
    and ua.login_id is not null;

  if found then
    return query
      select
        v_existing_login_id,
        'student.' || lower(v_existing_login_id) || '@login.concept.invalid',
        v_existing_user_id,
        true;
    return;
  end if;

  select e.roll_no, b.code, b.academic_year
    into v_roll_no, v_batch_code, v_academic_year
  from app_private.enrollments e
  join app_private.batches b on b.id = e.batch_id
  where e.student_id = p_student_id
    and e.is_active
    and b.is_active
  order by e.starts_on desc nulls last, e.created_at desc, e.id
  limit 1;

  if not found then
    raise exception using errcode = 'P0002', message = 'student has no active enrollment';
  end if;

  v_roll_part := app_private.canonical_login_part(v_roll_no);
  if v_roll_part is null then
    raise exception using errcode = '22023', message = 'student roll number cannot form a login id';
  end if;
  v_roll_part := left(v_roll_part, 64);

  select count(distinct e.student_id) > 1
    into v_roll_is_duplicated
  from app_private.enrollments e
  join app_private.batches b on b.id = e.batch_id and b.is_active
  where e.is_active
    and app_private.canonical_login_part(e.roll_no) = v_roll_part;

  v_candidate := v_roll_part;
  if v_roll_is_duplicated
     or exists (
       select 1
       from app_private.user_accounts ua
       where ua.login_id = v_candidate
     ) then
    v_batch_part := coalesce(
      app_private.canonical_login_part(v_batch_code),
      app_private.canonical_login_part(v_academic_year),
      'batch'
    );
    v_candidate := left(v_batch_part, 31) || '-' || left(v_roll_part, 32);
  end if;

  if exists (
    select 1
    from app_private.user_accounts ua
    where ua.login_id = v_candidate
  ) then
    v_suffix := left(replace(p_student_id::text, '-', ''), 8);
    v_candidate := left(v_candidate, 55) || '-' || lower(v_suffix);
  end if;

  if exists (
    select 1
    from app_private.user_accounts ua
    where ua.login_id = v_candidate
  ) then
    raise exception using errcode = '23505', message = 'derived login id is already assigned';
  end if;

  return query
    select
      v_candidate,
      'student.' || lower(v_candidate) || '@login.concept.invalid',
      null::uuid,
      false;
end;
$$;

-- A temporary password is not portal-ready. Redefining this central helper
-- applies the gate to linked results, role checks, import RPCs, and Storage
-- policies, including JWTs issued before an administrator forced a reset.
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
  );
$$;

create or replace function api.my_portal_context()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'login_id', (
      select ua.login_id
      from app_private.user_accounts ua
      where ua.user_id = auth.uid()
    ),
    'must_change_password', coalesce(
      (
        select ua.must_change_password
        from app_private.user_accounts ua
        where ua.user_id = auth.uid()
          and ua.status = 'active'
      ),
      false
    ),
    'account_status', (
      select ua.status::text
      from app_private.user_accounts ua
      where ua.user_id = auth.uid()
    ),
    'roles', coalesce(
      (
        select jsonb_agg(ar.role::text order by ar.role::text)
        from app_private.account_roles ar
        where ar.user_id = auth.uid()
          and app_private.is_account_active(auth.uid())
      ),
      '[]'::jsonb
    ),
    'students', coalesce(
      (
        select jsonb_agg(to_jsonb(ms) order by ms.full_name, ms.roll_no)
        from api.my_students() ms
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function api.admin_student_accounts(p_actor_id uuid)
returns table (
  student_id uuid,
  full_name text,
  roll_no text,
  batch_code text,
  login_id text,
  must_change_password boolean,
  account_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app_private.has_any_role(p_actor_id, array['admin']) then
    raise exception using errcode = '42501', message = 'active admin role required';
  end if;

  return query
  select
    s.id,
    s.full_name,
    enrollment.roll_no,
    enrollment.batch_code,
    ua.login_id,
    coalesce(ua.must_change_password, false),
    case
      when ua.login_id is null then 'not-provisioned'
      else ua.status::text
    end
  from app_private.students s
  join lateral (
    select e.roll_no, b.code as batch_code
    from app_private.enrollments e
    join app_private.batches b on b.id = e.batch_id
    where e.student_id = s.id
      and e.is_active
      and b.is_active
    order by e.starts_on desc nulls last, e.created_at desc, e.id
    limit 1
  ) enrollment on true
  left join app_private.student_account_links l
    on l.student_id = s.id
   and l.relationship = 'student'
   and l.is_active
  left join app_private.user_accounts ua on ua.user_id = l.user_id
  where s.is_active
  order by enrollment.batch_code nulls last, enrollment.roll_no nulls last, s.full_name, s.id;
end;
$$;

create function api.prepare_student_account_provision(
  p_actor_id uuid,
  p_student_id uuid
)
returns table (
  student_id uuid,
  login_id text,
  auth_email text,
  user_id uuid,
  already_provisioned boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app_private.has_any_role(p_actor_id, array['admin']) then
    raise exception using errcode = '42501', message = 'active admin role required';
  end if;

  return query
  select
    p_student_id,
    identity.login_id,
    identity.auth_email,
    identity.user_id,
    identity.already_provisioned
  from app_private.student_login_identity(p_student_id) identity;
end;
$$;

create or replace function api.complete_student_account_provision(
  p_actor_id uuid,
  p_student_id uuid,
  p_user_id uuid
)
returns table (
  student_id uuid,
  login_id text,
  auth_email text,
  user_id uuid,
  already_provisioned boolean
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

    return query
      select p_student_id, v_identity.login_id, v_identity.auth_email, p_user_id, true;
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

    update app_private.student_account_links as l
    set is_active = false
    where l.user_id = v_legacy_user_id
      and l.student_id = p_student_id;

    update app_private.user_accounts as ua
    set
      status = 'disabled',
      status_reason = 'Replaced by roll-number account',
      status_changed_by = p_actor_id,
      status_changed_at = statement_timestamp()
    where ua.user_id = v_legacy_user_id;
  end if;

  update app_private.user_accounts ua
  set
    login_id = v_identity.login_id,
    must_change_password = true,
    temporary_password_issued_at = statement_timestamp(),
    password_changed_at = null,
    credential_changed_by = p_actor_id,
    credential_changed_at = statement_timestamp()
  where ua.user_id = p_user_id
    and ua.status = 'active'
    and (ua.login_id is null or ua.login_id = v_identity.login_id);

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
    jsonb_build_object('user_id', p_user_id)
  );

  return query
    select p_student_id, v_identity.login_id, v_identity.auth_email, p_user_id, true;
end;
$$;

create or replace function api.begin_student_credential_reset(
  p_actor_id uuid,
  p_student_id uuid
)
returns table (
  student_id uuid,
  user_id uuid,
  login_id text,
  auth_email text,
  must_change_password boolean
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
    credential_changed_at = statement_timestamp()
  where ua.user_id = v_user_id;

  perform app_private.write_audit_event(
    p_actor_id,
    'credential.reset_required',
    'student',
    p_student_id,
    jsonb_build_object('user_id', v_user_id)
  );

  return query select p_student_id, v_user_id, v_login_id, v_auth_email, true;
end;
$$;

create function api.credential_state(p_user_id uuid)
returns table (
  user_id uuid,
  login_id text,
  must_change_password boolean,
  account_status text,
  password_changed_at timestamptz
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
    ua.password_changed_at
  from app_private.user_accounts ua
  where ua.user_id = p_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'portal account not found';
  end if;
end;
$$;

create function api.complete_initial_password_change(p_user_id uuid)
returns table (
  user_id uuid,
  must_change_password boolean,
  password_changed_at timestamptz
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

  if v_account.status <> 'active' then
    raise exception using errcode = '42501', message = 'account is not active';
  end if;

  if not v_account.must_change_password then
    if v_account.password_changed_at is null then
      raise exception using errcode = '55000', message = 'account is not awaiting an initial password change';
    end if;

    return query select p_user_id, false, v_account.password_changed_at;
    return;
  end if;

  update app_private.user_accounts
  set
    must_change_password = false,
    password_changed_at = statement_timestamp(),
    credential_changed_by = p_user_id,
    credential_changed_at = statement_timestamp()
  where app_private.user_accounts.user_id = p_user_id
  returning app_private.user_accounts.password_changed_at
    into v_account.password_changed_at;

  perform app_private.write_audit_event(
    p_user_id,
    'credential.password_changed',
    'user_account',
    p_user_id,
    '{}'::jsonb
  );

  return query select p_user_id, false, v_account.password_changed_at;
end;
$$;

-- An administrator is intentionally allowed to upload, review, publish, and
-- restore in one account. Legacy uploader/publisher roles retain their
-- different-user separation.
create or replace function app_private.enforce_publication_separation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uploaded_by uuid;
begin
  select i.uploaded_by
    into v_uploaded_by
  from app_private.assessment_revisions r
  join app_private.imports i on i.id = r.import_id
  where r.id = new.revision_id;

  if v_uploaded_by is null then
    raise exception using errcode = '23503', message = 'revision import not found';
  end if;

  if new.published_by = v_uploaded_by
     and not app_private.has_any_role(new.published_by, array['admin']) then
    raise exception using
      errcode = '42501',
      message = 'uploader and publisher must be different users';
  end if;

  if not app_private.has_any_role(new.published_by, array['publisher', 'admin']) then
    raise exception using errcode = '42501', message = 'publisher role required';
  end if;

  return new;
end;
$$;

create or replace function api.pending_revisions()
returns table (
  revision_id uuid,
  import_id uuid,
  assessment_code text,
  display_title text,
  batch_code text,
  test_date date,
  revision_number integer,
  uploader_id uuid,
  original_filename text,
  parser_version text,
  staged_at timestamptz,
  row_count integer,
  active_revision_id uuid,
  is_latest_revision boolean,
  subject_summaries jsonb,
  status_counts jsonb,
  warnings jsonb,
  can_publish boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if not app_private.has_any_role(v_actor, array['publisher', 'admin']) then
    raise exception using errcode = '42501', message = 'publisher role required';
  end if;

  return query
  select
    r.id,
    i.id,
    a.assessment_code,
    a.display_title,
    b.code,
    a.test_date,
    r.revision_number,
    i.uploaded_by,
    i.original_filename,
    i.parser_version,
    i.staged_at,
    i.row_count,
    p.revision_id,
    not exists (
      select 1
      from app_private.assessment_revisions newer
      where newer.assessment_id = r.assessment_id
        and newer.revision_number > r.revision_number
    ),
    case
      when jsonb_typeof(i.validation_summary->'subjects') = 'array'
        then i.validation_summary->'subjects'
      else '[]'::jsonb
    end,
    case
      when jsonb_typeof(i.validation_summary->'status_counts') = 'object'
        then i.validation_summary->'status_counts'
      else '{}'::jsonb
    end,
    case
      when jsonb_typeof(i.validation_summary->'warnings') = 'array'
        then i.validation_summary->'warnings'
      else '[]'::jsonb
    end,
    (
      i.uploaded_by <> v_actor
      or app_private.has_any_role(v_actor, array['admin'])
    )
      and not exists (
        select 1
        from app_private.assessment_revisions newer
        where newer.assessment_id = r.assessment_id
          and newer.revision_number > r.revision_number
      )
  from app_private.assessment_revisions r
  join app_private.assessments a on a.id = r.assessment_id
  join app_private.batches b on b.id = a.batch_id
  join app_private.imports i on i.id = r.import_id
  left join app_private.publications p
    on p.assessment_id = r.assessment_id
   and p.superseded_at is null
  where r.status = 'staged'
    and i.status = 'staged'
  order by i.staged_at, a.test_date, a.qpt_number;
end;
$$;

create or replace function api.publish_revision(
  p_revision_id uuid,
  p_expected_active_revision_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_revision app_private.assessment_revisions%rowtype;
  v_import app_private.imports%rowtype;
  v_assessment_id uuid;
  v_active_revision_id uuid;
  v_latest_revision_id uuid;
  v_publication_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if not app_private.has_any_role(v_actor, array['publisher', 'admin']) then
    raise exception using errcode = '42501', message = 'publisher role required';
  end if;

  select r.assessment_id into v_assessment_id
  from app_private.assessment_revisions r
  where r.id = p_revision_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'revision not found';
  end if;

  perform 1
  from app_private.assessments
  where id = v_assessment_id
  for update;

  select * into v_revision
  from app_private.assessment_revisions
  where id = p_revision_id
  for update;

  if v_revision.status <> 'staged' then
    raise exception using errcode = '55000', message = 'revision is not in staged state';
  end if;

  select * into v_import
  from app_private.imports
  where id = v_revision.import_id
  for update;

  if v_import.uploaded_by = v_actor
     and not app_private.has_any_role(v_actor, array['admin']) then
    raise exception using
      errcode = '42501',
      message = 'uploader and publisher must be different users';
  end if;

  select r.id into v_latest_revision_id
  from app_private.assessment_revisions r
  where r.assessment_id = v_revision.assessment_id
  order by r.revision_number desc
  limit 1;

  if v_latest_revision_id is distinct from v_revision.id then
    raise exception using
      errcode = '55000',
      message = 'only the latest staged revision can be published';
  end if;

  select p.revision_id into v_active_revision_id
  from app_private.publications p
  where p.assessment_id = v_revision.assessment_id
    and p.superseded_at is null;

  if v_active_revision_id is distinct from p_expected_active_revision_id then
    raise exception using
      errcode = '55000',
      message = 'active publication changed; refresh before publishing';
  end if;

  update app_private.publications
  set superseded_at = statement_timestamp(), superseded_by = v_actor
  where assessment_id = v_revision.assessment_id
    and superseded_at is null;

  update app_private.assessment_revisions
  set status = 'superseded'
  where assessment_id = v_revision.assessment_id
    and id <> v_revision.id
    and status in ('staged', 'published');

  insert into app_private.publications(assessment_id, revision_id, published_by)
  values (v_revision.assessment_id, v_revision.id, v_actor)
  returning id into v_publication_id;

  update app_private.assessment_revisions
  set status = 'published'
  where id = v_revision.id;

  update app_private.imports
  set status = 'published'
  where id = v_revision.import_id;

  perform app_private.write_audit_event(
    v_actor,
    'revision.published',
    'assessment_revision',
    v_revision.id,
    jsonb_build_object(
      'assessment_id', v_revision.assessment_id,
      'publication_id', v_publication_id,
      'from_revision_id', v_active_revision_id
    )
  );

  return v_publication_id;
end;
$$;

create or replace function api.publication_history(p_assessment_id uuid)
returns table (
  publication_id uuid,
  revision_id uuid,
  revision_number integer,
  published_at timestamptz,
  published_by uuid,
  superseded_at timestamptz,
  is_active boolean,
  can_restore boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if not app_private.has_any_role(v_actor, array['publisher', 'admin']) then
    raise exception using errcode = '42501', message = 'publisher role required';
  end if;

  return query
  select
    p.id,
    p.revision_id,
    r.revision_number,
    p.published_at,
    p.published_by,
    p.superseded_at,
    p.superseded_at is null,
    p.superseded_at is not null
      and (
        i.uploaded_by <> v_actor
        or app_private.has_any_role(v_actor, array['admin'])
      )
  from app_private.publications p
  join app_private.assessment_revisions r on r.id = p.revision_id
  join app_private.imports i on i.id = r.import_id
  where p.assessment_id = p_assessment_id
  order by p.published_at desc, p.id;
end;
$$;

create or replace function api.restore_revision(
  p_revision_id uuid,
  p_expected_active_revision_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_target app_private.assessment_revisions%rowtype;
  v_import app_private.imports%rowtype;
  v_assessment_id uuid;
  v_previous_revision_id uuid;
  v_publication_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if not app_private.has_any_role(v_actor, array['publisher', 'admin']) then
    raise exception using errcode = '42501', message = 'publisher role required';
  end if;

  select r.assessment_id into v_assessment_id
  from app_private.assessment_revisions r
  where r.id = p_revision_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'revision not found';
  end if;

  perform 1
  from app_private.assessments a
  where a.id = v_assessment_id
  for update;

  select * into v_target
  from app_private.assessment_revisions r
  where r.id = p_revision_id
  for update;

  if not exists (
    select 1 from app_private.publications p where p.revision_id = v_target.id
  ) then
    raise exception using errcode = '55000', message = 'only a previously published revision can be restored';
  end if;

  select * into v_import
  from app_private.imports i
  where i.id = v_target.import_id;

  if v_import.uploaded_by = v_actor
     and not app_private.has_any_role(v_actor, array['admin']) then
    raise exception using
      errcode = '42501',
      message = 'uploader and publisher must be different users';
  end if;

  select p.revision_id into v_previous_revision_id
  from app_private.publications p
  where p.assessment_id = v_target.assessment_id
    and p.superseded_at is null
  for update;

  if v_previous_revision_id is null then
    raise exception using errcode = '55000', message = 'assessment has no active publication';
  end if;

  if v_previous_revision_id is distinct from p_expected_active_revision_id then
    raise exception using
      errcode = '55000',
      message = 'active publication changed; refresh before restoring';
  end if;

  if exists (
    select 1
    from app_private.assessment_revisions r
    where r.assessment_id = v_target.assessment_id
      and r.status = 'staged'
  ) then
    raise exception using
      errcode = '55000',
      message = 'pending staged revision must be resolved before restore';
  end if;

  if v_previous_revision_id = v_target.id then
    raise exception using errcode = '55000', message = 'revision is already active';
  end if;

  update app_private.publications
  set superseded_at = statement_timestamp(), superseded_by = v_actor
  where assessment_id = v_target.assessment_id
    and superseded_at is null;

  update app_private.assessment_revisions
  set status = 'superseded'
  where assessment_id = v_target.assessment_id
    and id <> v_target.id
    and status in ('staged', 'published');

  insert into app_private.publications(assessment_id, revision_id, published_by)
  values (v_target.assessment_id, v_target.id, v_actor)
  returning id into v_publication_id;

  update app_private.assessment_revisions
  set status = 'published'
  where id = v_target.id;

  perform app_private.write_audit_event(
    v_actor,
    'revision.restored',
    'assessment_revision',
    v_target.id,
    jsonb_build_object(
      'assessment_id', v_target.assessment_id,
      'publication_id', v_publication_id,
      'from_revision_id', v_previous_revision_id
    )
  );

  return v_publication_id;
end;
$$;

-- New account-management RPCs are available only to the server-side Edge
-- Function. The Edge Function authenticates the caller, supplies that actor id,
-- and these functions independently recheck the current admin role.
revoke execute on function api.admin_student_accounts(uuid)
  from public, anon, authenticated;
revoke execute on function api.prepare_student_account_provision(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function api.complete_student_account_provision(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke execute on function api.begin_student_credential_reset(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function api.credential_state(uuid)
  from public, anon, authenticated;
revoke execute on function api.complete_initial_password_change(uuid)
  from public, anon, authenticated;

grant execute on function api.admin_student_accounts(uuid) to service_role;
grant execute on function api.prepare_student_account_provision(uuid, uuid) to service_role;
grant execute on function api.complete_student_account_provision(uuid, uuid, uuid) to service_role;
grant execute on function api.begin_student_credential_reset(uuid, uuid) to service_role;
grant execute on function api.credential_state(uuid) to service_role;
grant execute on function api.complete_initial_password_change(uuid) to service_role;

revoke execute on function app_private.canonical_login_part(text)
  from public, anon, authenticated;
revoke execute on function app_private.student_login_identity(uuid)
  from public, anon, authenticated;
grant execute on function app_private.canonical_login_part(text) to service_role;
grant execute on function app_private.student_login_identity(uuid) to service_role;

comment on column app_private.user_accounts.login_id is
  'Canonical roll-derived login id. The corresponding synthetic Auth email and every password remain outside application tables.';
comment on column app_private.user_accounts.must_change_password is
  'When true, all portal data and staff actions are blocked until a trusted server confirms the Auth password update.';
comment on function api.admin_student_accounts(uuid) is
  'Service-only admin-authorized student credential directory. Never returns Auth email or password material.';
comment on function api.prepare_student_account_provision(uuid, uuid) is
  'Service-only roll-first, collision-safe login derivation before Auth account creation.';
comment on function api.complete_student_account_provision(uuid, uuid, uuid) is
  'Service-only binding of a matching Auth identity to a student with a forced initial password change.';
comment on function api.begin_student_credential_reset(uuid, uuid) is
  'Service-only fail-closed credential reset marker to call before replacing the Auth password.';
comment on function api.complete_initial_password_change(uuid) is
  'Service-only credential gate completion to call only after Supabase Auth accepts the new password.';
comment on function api.publish_revision(uuid, uuid) is
  'Compare-and-swap publication of the latest staged revision; an admin may publish their own upload, while legacy uploader/publisher identities must differ.';
