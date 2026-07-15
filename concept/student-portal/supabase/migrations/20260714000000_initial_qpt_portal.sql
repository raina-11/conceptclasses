-- Concept Institute QPT portal: private data model and narrow RPC boundary.
-- All client-facing access is through SECURITY DEFINER functions in `api`.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;
create schema if not exists api;

-- This application exposes only the narrow `api` RPC schema. Supabase creates
-- `public` with permissive defaults, so close both existing and future objects
-- before any application-owned database object is created.
revoke all on schema public from public, anon, authenticated;
revoke all on schema app_private from public, anon, authenticated;
revoke all on schema api from public, anon, authenticated;
grant usage on schema api to authenticated, service_role;
grant usage on schema app_private to service_role;

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;
-- PostgreSQL's built-in PUBLIC execute grant is global; a per-schema default
-- ACL can add privileges but cannot subtract that global default.
alter default privileges for role postgres
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema app_private
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema app_private
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema app_private
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema api
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema api
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema api
  revoke execute on functions from public, anon, authenticated;

create type app_private.app_role as enum ('uploader', 'publisher', 'admin');
create type app_private.account_status as enum ('active', 'suspended', 'disabled');
create type app_private.import_status as enum (
  'awaiting_upload',
  'uploaded',
  'parsing',
  'parsed',
  'staged',
  'published',
  'duplicate',
  'quarantined',
  'failed'
);
create type app_private.revision_status as enum ('staged', 'published', 'superseded');
create type app_private.ranking_basis as enum ('component_score', 'assessment_total', 'source_rank');
create type app_private.score_status as enum (
  'present',
  'absent',
  'withheld',
  'cancelled',
  'not_enrolled',
  'omitted'
);

create table app_private.batches (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null,
  academic_year text not null,
  display_name text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint batches_code_valid check (code = btrim(code) and length(code) between 1 and 64),
  constraint batches_academic_year_valid check (
    academic_year = btrim(academic_year) and length(academic_year) between 4 and 16
  ),
  constraint batches_display_name_valid check (
    display_name = btrim(display_name) and length(display_name) between 1 and 160
  ),
  unique (academic_year, code)
);

create table app_private.students (
  id uuid primary key default extensions.gen_random_uuid(),
  full_name text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint students_full_name_valid check (
    full_name = btrim(full_name) and length(full_name) between 1 and 200
  )
);

create table app_private.enrollments (
  id uuid primary key default extensions.gen_random_uuid(),
  student_id uuid not null references app_private.students(id) on delete restrict,
  batch_id uuid not null references app_private.batches(id) on delete restrict,
  roll_no text not null,
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  unique (student_id, batch_id),
  unique (batch_id, roll_no),
  constraint enrollments_roll_no_valid check (
    roll_no = btrim(roll_no)
    and length(roll_no) between 1 and 64
    and roll_no !~ '[[:cntrl:]]'
  ),
  constraint enrollment_dates_valid check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index enrollments_batch_id_idx on app_private.enrollments(batch_id);
create index enrollments_student_id_idx on app_private.enrollments(student_id);

create table app_private.student_account_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references app_private.students(id) on delete restrict,
  relationship text not null default 'student',
  linked_by uuid not null references auth.users(id) on delete restrict,
  linked_at timestamptz not null default statement_timestamp(),
  is_active boolean not null default true,
  primary key (user_id, student_id),
  constraint account_link_relationship_valid check (
    relationship in ('student', 'guardian')
  )
);

create index student_account_links_student_idx
  on app_private.student_account_links(student_id)
  where is_active;

create table app_private.user_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status app_private.account_status not null default 'active',
  status_reason text,
  status_changed_by uuid references auth.users(id) on delete restrict,
  status_changed_at timestamptz not null default statement_timestamp(),
  created_at timestamptz not null default statement_timestamp(),
  constraint account_status_reason_valid check (
    status_reason is null
    or (
      status_reason = btrim(status_reason)
      and length(status_reason) between 3 and 500
      and status_reason !~ '[[:cntrl:]]'
    )
  )
);

create function app_private.create_user_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app_private.user_accounts(user_id, status)
  values (new.id, 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger auth_user_creates_portal_account
after insert on auth.users
for each row execute function app_private.create_user_account();

-- Backfill users that predate this migration. Public signup is disabled, so
-- every such Auth identity was already provisioned by trusted staff/service.
insert into app_private.user_accounts(user_id, status)
select u.id, 'active'::app_private.account_status
from auth.users u
on conflict (user_id) do nothing;

create table app_private.account_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_private.app_role not null,
  granted_by uuid not null references auth.users(id) on delete restrict,
  granted_at timestamptz not null default statement_timestamp(),
  primary key (user_id, role)
);

create table app_private.subjects (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint subjects_code_valid check (
    code = btrim(code) and length(code) between 1 and 64 and code !~ '[[:cntrl:]]'
  ),
  constraint subjects_display_name_valid check (
    display_name = btrim(display_name) and length(display_name) between 1 and 160
  )
);

create table app_private.imports (
  id uuid primary key default extensions.gen_random_uuid(),
  client_request_id uuid not null,
  storage_bucket text not null default 'qpt-imports',
  storage_path text not null unique,
  original_filename text not null,
  byte_size bigint not null,
  raw_sha256 text,
  normalized_hash text,
  parser_version text,
  status app_private.import_status not null default 'awaiting_upload',
  validation_summary jsonb not null default '{}'::jsonb,
  preview_metadata jsonb not null default '{}'::jsonb,
  error_summary jsonb,
  row_count integer,
  duplicate_of_import_id uuid references app_private.imports(id) on delete restrict,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  upload_confirmed_at timestamptz,
  parsing_started_at timestamptz,
  parsed_at timestamptz,
  staged_at timestamptz,
  unique (uploaded_by, client_request_id),
  constraint imports_bucket_fixed check (storage_bucket = 'qpt-imports'),
  constraint imports_storage_path_valid check (
    storage_path = btrim(storage_path)
    and length(storage_path) between 8 and 512
    and storage_path !~ '(^|/)\.\.(/|$)'
  ),
  constraint imports_filename_valid check (
    original_filename = btrim(original_filename)
    and length(original_filename) between 6 and 255
    and lower(right(original_filename, 5)) = '.xlsx'
    and original_filename !~ '[\\/]'
    and original_filename !~ '[[:cntrl:]]'
  ),
  constraint imports_raw_sha256_valid check (
    raw_sha256 is null or raw_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint imports_normalized_hash_valid check (
    normalized_hash is null or normalized_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint imports_byte_size_valid check (byte_size between 1 and 10485760),
  constraint imports_parser_version_valid check (
    parser_version is null
    or (parser_version = btrim(parser_version) and length(parser_version) between 1 and 64)
  ),
  constraint imports_row_count_valid check (row_count is null or row_count >= 0),
  constraint imports_summary_object check (jsonb_typeof(validation_summary) = 'object'),
  constraint imports_preview_object check (jsonb_typeof(preview_metadata) = 'object'),
  constraint imports_error_object check (
    error_summary is null or jsonb_typeof(error_summary) = 'object'
  ),
  constraint imports_duplicate_reference_valid check (
    duplicate_of_import_id is null or duplicate_of_import_id <> id
  ),
  constraint imports_safe_metadata_size check (
    pg_column_size(validation_summary) <= 262144
    and pg_column_size(preview_metadata) <= 65536
    and (error_summary is null or pg_column_size(error_summary) <= 262144)
  )
);

create index imports_uploaded_by_created_at_idx
  on app_private.imports(uploaded_by, created_at desc);

-- The canonical payload, not the raw workbook bytes, is the idempotency key.
-- Failed/quarantined/duplicate attempts do not reserve the key.
create unique index imports_normalized_payload_unique_idx
  on app_private.imports(normalized_hash, parser_version)
  where normalized_hash is not null
    and status in ('parsed', 'staged', 'published');

create table app_private.assessments (
  id uuid primary key default extensions.gen_random_uuid(),
  assessment_code text not null unique,
  academic_year text not null,
  qpt_number integer not null,
  batch_id uuid not null references app_private.batches(id) on delete restrict,
  test_date date not null,
  display_title text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint assessments_code_valid check (
    assessment_code = btrim(assessment_code)
    and length(assessment_code) between 1 and 100
    and assessment_code !~ '[[:cntrl:]]'
  ),
  constraint assessments_year_valid check (
    academic_year = btrim(academic_year) and length(academic_year) between 4 and 16
  ),
  constraint assessments_qpt_number_valid check (qpt_number > 0),
  constraint assessments_title_valid check (
    display_title = btrim(display_title) and length(display_title) between 1 and 200
  )
  -- A QPT may be delivered as separate subject files or repeated on a new
  -- date. assessment_code is the stable correction identity; batch/QPT/year
  -- is deliberately not unique.
);

create index assessments_batch_qpt_date_idx
  on app_private.assessments(batch_id, qpt_number, test_date);

create table app_private.assessment_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  assessment_id uuid not null references app_private.assessments(id) on delete restrict,
  revision_number integer not null,
  import_id uuid not null unique references app_private.imports(id) on delete restrict,
  ranking_basis app_private.ranking_basis not null default 'component_score',
  status app_private.revision_status not null default 'staged',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  unique (assessment_id, revision_number),
  unique (assessment_id, id),
  constraint assessment_revision_number_valid check (revision_number > 0)
);

create index assessment_revisions_assessment_idx
  on app_private.assessment_revisions(assessment_id, revision_number desc);

create table app_private.assessment_components (
  id uuid primary key default extensions.gen_random_uuid(),
  revision_id uuid not null references app_private.assessment_revisions(id) on delete restrict,
  subject_id uuid not null references app_private.subjects(id) on delete restrict,
  max_marks numeric(12, 4) not null,
  sort_order integer not null,
  created_at timestamptz not null default statement_timestamp(),
  unique (revision_id, subject_id),
  unique (revision_id, id),
  unique (revision_id, sort_order),
  constraint assessment_component_marks_valid check (max_marks > 0),
  constraint assessment_component_sort_valid check (sort_order > 0)
);

create table app_private.student_scores (
  revision_id uuid not null,
  component_id uuid not null,
  student_id uuid not null references app_private.students(id) on delete restrict,
  score numeric(12, 4),
  status app_private.score_status not null,
  source_rank integer,
  source_student_name text,
  created_at timestamptz not null default statement_timestamp(),
  primary key (component_id, student_id),
  foreign key (revision_id, component_id)
    references app_private.assessment_components(revision_id, id) on delete restrict,
  constraint score_presence_valid check (
    (status = 'present' and score is not null)
    or (status <> 'present' and score is null)
  ),
  constraint source_rank_valid check (source_rank is null or source_rank > 0),
  constraint source_name_valid check (
    source_student_name is null
    or (
      source_student_name = btrim(source_student_name)
      and length(source_student_name) between 1 and 200
    )
  )
);

create function app_private.enforce_score_maximum()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max_marks numeric;
begin
  if new.status = 'present' then
    select c.max_marks into v_max_marks
    from app_private.assessment_components c
    where c.revision_id = new.revision_id and c.id = new.component_id;

    if v_max_marks is not null and new.score > v_max_marks then
      raise exception using
        errcode = '23514',
        message = 'present score cannot exceed component maximum marks';
    end if;
  end if;

  return new;
end;
$$;

create trigger student_scores_enforce_maximum
before insert or update of score, status, component_id, revision_id
on app_private.student_scores
for each row execute function app_private.enforce_score_maximum();

create index student_scores_student_revision_idx
  on app_private.student_scores(student_id, revision_id);

create table app_private.publications (
  id uuid primary key default extensions.gen_random_uuid(),
  assessment_id uuid not null,
  revision_id uuid not null,
  published_by uuid not null references auth.users(id) on delete restrict,
  published_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  superseded_by uuid references auth.users(id) on delete restrict,
  foreign key (assessment_id, revision_id)
    references app_private.assessment_revisions(assessment_id, id) on delete restrict,
  constraint publication_supersession_valid check (
    (superseded_at is null and superseded_by is null)
    or (superseded_at is not null and superseded_by is not null)
  )
);

create unique index one_active_publication_per_assessment_idx
  on app_private.publications(assessment_id)
  where superseded_at is null;

create table app_private.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(),
  constraint audit_action_valid check (
    action = btrim(action) and length(action) between 3 and 100 and action !~ '[[:cntrl:]]'
  ),
  constraint audit_entity_type_valid check (
    entity_type = btrim(entity_type)
    and length(entity_type) between 3 and 80
    and entity_type !~ '[[:cntrl:]]'
  ),
  constraint audit_details_object check (jsonb_typeof(details) = 'object')
);

create index audit_events_entity_idx
  on app_private.audit_events(entity_type, entity_id, created_at desc);
create index audit_events_actor_idx
  on app_private.audit_events(actor_id, created_at desc);

comment on table app_private.audit_events is
  'Append-only security and publication audit trail. Never expose through the Data API.';

create function app_private.reject_audit_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'audit events are append-only';
end;
$$;

create trigger audit_events_reject_mutation
before update or delete on app_private.audit_events
for each row execute function app_private.reject_audit_event_mutation();

create trigger audit_events_reject_truncate
before truncate on app_private.audit_events
for each statement execute function app_private.reject_audit_event_mutation();

create function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

create trigger batches_touch_updated_at
before update on app_private.batches
for each row execute function app_private.touch_updated_at();

create trigger students_touch_updated_at
before update on app_private.students
for each row execute function app_private.touch_updated_at();

create trigger subjects_touch_updated_at
before update on app_private.subjects
for each row execute function app_private.touch_updated_at();

create trigger assessments_touch_updated_at
before update on app_private.assessments
for each row execute function app_private.touch_updated_at();

create function app_private.is_account_active(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from app_private.user_accounts ua
    where ua.user_id = p_user_id and ua.status = 'active'
  );
$$;

create function app_private.has_any_role(p_user_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app_private.is_account_active(p_user_id) and exists (
    select 1
    from app_private.account_roles ar
    where ar.user_id = p_user_id
      and ar.role::text = any (p_roles)
  );
$$;

create function app_private.can_upload_import(p_user_id uuid, p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from app_private.imports i
    where i.uploaded_by = p_user_id
      and i.storage_bucket = 'qpt-imports'
      and i.storage_path = p_storage_path
      and i.status = 'awaiting_upload'
  );
$$;

create function app_private.write_audit_event(
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into app_private.audit_events(actor_id, action, entity_type, entity_id, details)
  values (
    p_actor_id,
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_details, '{}'::jsonb)
  );
$$;

create function app_private.enforce_publication_separation()
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

  if new.published_by = v_uploaded_by then
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

create trigger publications_separation_of_duties
before insert on app_private.publications
for each row execute function app_private.enforce_publication_separation();

-- Every application table is deny-by-default even if it is accidentally added
-- to PostgREST's exposed schemas later.
alter table app_private.batches enable row level security;
alter table app_private.batches force row level security;
alter table app_private.students enable row level security;
alter table app_private.students force row level security;
alter table app_private.enrollments enable row level security;
alter table app_private.enrollments force row level security;
alter table app_private.student_account_links enable row level security;
alter table app_private.student_account_links force row level security;
alter table app_private.user_accounts enable row level security;
alter table app_private.user_accounts force row level security;
alter table app_private.account_roles enable row level security;
alter table app_private.account_roles force row level security;
alter table app_private.subjects enable row level security;
alter table app_private.subjects force row level security;
alter table app_private.imports enable row level security;
alter table app_private.imports force row level security;
alter table app_private.assessments enable row level security;
alter table app_private.assessments force row level security;
alter table app_private.assessment_revisions enable row level security;
alter table app_private.assessment_revisions force row level security;
alter table app_private.assessment_components enable row level security;
alter table app_private.assessment_components force row level security;
alter table app_private.student_scores enable row level security;
alter table app_private.student_scores force row level security;
alter table app_private.publications enable row level security;
alter table app_private.publications force row level security;
alter table app_private.audit_events enable row level security;
alter table app_private.audit_events force row level security;

create function api.set_account_status(
  p_user_id uuid,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status app_private.account_status;
begin
  if not app_private.has_any_role(v_actor, array['admin']) then
    raise exception using errcode = '42501', message = 'active admin role required';
  end if;

  begin
    v_status := lower(p_status)::app_private.account_status;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'account status must be active, suspended, or disabled';
  end;

  if v_status <> 'active'
     and (p_reason is null or length(btrim(p_reason)) < 3) then
    raise exception using errcode = '22023', message = 'suspension or disablement requires a reason';
  end if;

  update app_private.user_accounts ua
  set
    status = v_status,
    status_reason = case when v_status = 'active' then null else btrim(p_reason) end,
    status_changed_by = v_actor,
    status_changed_at = statement_timestamp()
  where ua.user_id = p_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'portal account not found';
  end if;

  perform app_private.write_audit_event(
    v_actor,
    'account.status_changed',
    'user_account',
    p_user_id,
    jsonb_build_object('status', v_status::text, 'reason', p_reason)
  );
end;
$$;

create function api.my_students()
returns table (
  student_id uuid,
  roll_no text,
  full_name text,
  relationship text,
  batch_id uuid,
  batch_code text,
  batch_name text,
  academic_year text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    b.roll_no,
    s.full_name,
    l.relationship,
    b.id,
    b.code,
    b.display_name,
    b.academic_year
  from app_private.student_account_links l
  join app_private.students s on s.id = l.student_id and s.is_active
  left join lateral (
    select eb.*, e.roll_no
    from app_private.enrollments e
    join app_private.batches eb on eb.id = e.batch_id
    where e.student_id = s.id and e.is_active and eb.is_active
    order by e.starts_on desc nulls last, e.created_at desc
    limit 1
  ) b on true
  where l.user_id = auth.uid()
    and l.is_active
    and app_private.is_account_active(auth.uid())
  order by s.full_name, b.roll_no;
$$;

create function api.student_results(
  p_student_id uuid,
  p_subject_code text default null
)
returns table (
  assessment_id uuid,
  revision_id uuid,
  assessment_code text,
  qpt_number integer,
  display_title text,
  test_date date,
  subject_code text,
  subject_name text,
  max_marks numeric,
  score numeric,
  status text,
  percentage numeric,
  rank bigint,
  roll_no text,
  batch_code text
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked_results as (
    select
      a.id as assessment_id,
      r.id as revision_id,
      a.assessment_code,
      a.qpt_number,
      a.display_title,
      a.test_date,
      su.code as subject_code,
      su.display_name as subject_name,
      c.max_marks,
      sc.score,
      sc.status,
      case
        when sc.status = 'present' then round((sc.score / c.max_marks) * 100, 2)
        else null
      end as percentage,
      case
        when sc.status <> 'present' then null
        when sc.source_rank is not null then sc.source_rank::bigint
        else rank() over (
          partition by c.id
          order by sc.score desc nulls last
        )
      end as result_rank,
      sc.student_id,
      e.roll_no,
      b.code as batch_code,
      c.sort_order
    from app_private.publications p
    join app_private.assessment_revisions r on r.id = p.revision_id
    join app_private.assessments a on a.id = p.assessment_id
    join app_private.batches b on b.id = a.batch_id
    join app_private.assessment_components c on c.revision_id = r.id
    join app_private.subjects su on su.id = c.subject_id
    join app_private.student_scores sc
      on sc.revision_id = r.id and sc.component_id = c.id
    join app_private.students s on s.id = sc.student_id
    join app_private.enrollments e
      on e.student_id = sc.student_id and e.batch_id = a.batch_id
    where p.superseded_at is null
      and r.status = 'published'
  )
  select
    rr.assessment_id,
    rr.revision_id,
    rr.assessment_code,
    rr.qpt_number,
    rr.display_title,
    rr.test_date,
    rr.subject_code,
    rr.subject_name,
    rr.max_marks,
    rr.score,
    rr.status::text,
    rr.percentage,
    rr.result_rank,
    rr.roll_no,
    rr.batch_code
  from ranked_results rr
  where rr.student_id = p_student_id
    and exists (
      select 1
      from app_private.student_account_links l
      where l.user_id = auth.uid()
        and l.student_id = p_student_id
        and l.is_active
        and app_private.is_account_active(auth.uid())
    )
    and (p_subject_code is null or upper(rr.subject_code) = upper(btrim(p_subject_code)))
  order by rr.test_date desc, rr.qpt_number desc, rr.sort_order, rr.subject_code;
$$;

create function api.my_portal_context()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
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

create function api.begin_import(
  p_client_request_id uuid,
  p_original_filename text,
  p_byte_size bigint
)
returns table (
  import_id uuid,
  storage_bucket text,
  storage_path text
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_import_id uuid;
  v_existing app_private.imports%rowtype;
  v_storage_path text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if not app_private.has_any_role(v_actor, array['uploader', 'admin']) then
    raise exception using errcode = '42501', message = 'uploader role required';
  end if;

  if p_client_request_id is null then
    raise exception using errcode = '22023', message = 'client request id is required';
  end if;

  if p_original_filename is null
     or p_original_filename <> btrim(p_original_filename)
     or length(p_original_filename) not between 6 and 255
     or lower(right(p_original_filename, 5)) <> '.xlsx'
     or p_original_filename ~ '[\\/]'
     or p_original_filename ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'invalid original filename';
  end if;

  if p_byte_size is null or p_byte_size not between 1 and 10485760 then
    raise exception using errcode = '22023', message = 'workbook size must be between 1 byte and 10 MiB';
  end if;

  select * into v_existing
  from app_private.imports i
  where i.uploaded_by = v_actor
    and i.client_request_id = p_client_request_id;

  if found then
    if v_existing.original_filename <> p_original_filename
       or v_existing.byte_size <> p_byte_size then
      raise exception using
        errcode = '22023',
        message = 'client request id was already used for a different workbook';
    end if;

    return query
      select v_existing.id, v_existing.storage_bucket, v_existing.storage_path;
    return;
  end if;

  v_import_id := extensions.gen_random_uuid();
  v_storage_path := v_actor::text || '/' || v_import_id::text || '.xlsx';

  insert into app_private.imports (
    id,
    client_request_id,
    storage_path,
    original_filename,
    byte_size,
    uploaded_by
  )
  values (
    v_import_id,
    p_client_request_id,
    v_storage_path,
    p_original_filename,
    p_byte_size,
    v_actor
  );

  perform app_private.write_audit_event(
    v_actor,
    'import.begun',
    'import',
    v_import_id,
    jsonb_build_object('byte_size', p_byte_size)
  );

  return query select v_import_id, 'qpt-imports'::text, v_storage_path;
end;
$$;

create function api.confirm_import_upload(p_import_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_import app_private.imports%rowtype;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if not app_private.is_account_active(v_actor) then
    raise exception using errcode = '42501', message = 'account is not active';
  end if;

  if not app_private.has_any_role(v_actor, array['uploader', 'admin']) then
    raise exception using errcode = '42501', message = 'uploader role required';
  end if;

  select * into v_import
  from app_private.imports i
  where i.id = p_import_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'import not found';
  end if;

  if v_import.uploaded_by <> v_actor
     and not app_private.has_any_role(v_actor, array['admin']) then
    raise exception using errcode = '42501', message = 'import belongs to another uploader';
  end if;

  if v_import.status in (
    'uploaded',
    'parsing',
    'parsed',
    'duplicate',
    'quarantined',
    'failed',
    'staged',
    'published'
  ) then
    return;
  end if;

  if v_import.status <> 'awaiting_upload' then
    raise exception using errcode = '55000', message = 'import is not awaiting upload';
  end if;

  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = v_import.storage_bucket
      and o.name = v_import.storage_path
  ) then
    raise exception using errcode = '55000', message = 'uploaded workbook object was not found';
  end if;

  update app_private.imports
  set status = 'uploaded', upload_confirmed_at = statement_timestamp()
  where id = p_import_id;

  perform app_private.write_audit_event(
    v_actor,
    'import.upload_confirmed',
    'import',
    p_import_id,
    '{}'::jsonb
  );
end;
$$;

create function api.claim_import(p_import_id uuid)
returns table (
  import_id uuid,
  storage_bucket text,
  storage_path text,
  byte_size bigint,
  original_filename text,
  import_status text,
  revision_id uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_import app_private.imports%rowtype;
begin
  select * into v_import
  from app_private.imports i
  where i.id = p_import_id;

  if found
     and v_import.status in ('uploaded', 'parsing')
     and not app_private.has_any_role(v_import.uploaded_by, array['uploader', 'admin']) then
    raise exception using errcode = '42501', message = 'uploader role required';
  end if;

  return query
  update app_private.imports i
  set status = 'parsing', parsing_started_at = statement_timestamp()
  where i.id = p_import_id and i.status = 'uploaded'
  returning
    i.id,
    i.storage_bucket,
    i.storage_path,
    i.byte_size,
    i.original_filename,
    i.status::text,
    null::uuid;

  if found then
    return;
  end if;

  -- A worker retry after claiming receives the same immutable source metadata.
  return query
  select
    i.id,
    i.storage_bucket,
    i.storage_path,
    i.byte_size,
    i.original_filename,
    i.status::text,
    null::uuid
  from app_private.imports i
  where i.id = p_import_id and i.status = 'parsing';

  if found then
    return;
  end if;

  -- Once the parser has recorded an outcome, retries return the terminal state
  -- so the Edge Function can finish idempotent object cleanup without reading
  -- or parsing the workbook again.
  return query
  select
    i.id,
    i.storage_bucket,
    i.storage_path,
    i.byte_size,
    i.original_filename,
    i.status::text,
    r.id
  from app_private.imports i
  left join app_private.assessment_revisions r on r.import_id = i.id
  where i.id = p_import_id
    and i.status in ('parsed', 'duplicate', 'quarantined', 'failed', 'staged', 'published');

  if found then
    return;
  end if;

  raise exception using errcode = '55000', message = 'import is not ready to parse';
end;
$$;

create function api.complete_import_parse(
  p_import_id uuid,
  p_raw_sha256 text,
  p_normalized_hash text,
  p_parser_version text,
  p_outcome text,
  p_error_summary jsonb default null,
  p_preview_metadata jsonb default '{}'::jsonb,
  p_validation_summary jsonb default '{}'::jsonb
)
returns app_private.import_status
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_status app_private.import_status;
  v_duplicate_id uuid;
  v_import app_private.imports%rowtype;
begin
  if lower(coalesce(p_raw_sha256, '')) !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'a valid raw SHA-256 digest is required';
  end if;

  if p_parser_version is null
     or p_parser_version <> btrim(p_parser_version)
     or length(p_parser_version) not between 1 and 64 then
    raise exception using errcode = '22023', message = 'invalid parser version';
  end if;

  if lower(coalesce(p_outcome, '')) not in ('parsed', 'quarantined', 'failed') then
    raise exception using errcode = '22023', message = 'parse outcome must be parsed, quarantined, or failed';
  end if;

  if lower(p_outcome) = 'parsed'
     and lower(coalesce(p_normalized_hash, '')) !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'a parsed import requires a valid normalized SHA-256 digest';
  end if;

  if p_normalized_hash is not null
     and lower(p_normalized_hash) !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'normalized SHA-256 digest is invalid';
  end if;

  if p_error_summary is not null and jsonb_typeof(p_error_summary) <> 'object' then
    raise exception using errcode = '22023', message = 'error summary must be a JSON object';
  end if;

  if p_preview_metadata is null or jsonb_typeof(p_preview_metadata) <> 'object' then
    raise exception using errcode = '22023', message = 'preview metadata must be a JSON object';
  end if;

  if p_validation_summary is null or jsonb_typeof(p_validation_summary) <> 'object' then
    raise exception using errcode = '22023', message = 'validation summary must be a JSON object';
  end if;

  if lower(p_outcome) in ('quarantined', 'failed') and p_error_summary is null then
    raise exception using errcode = '22023', message = 'failed and quarantined outcomes require an error summary';
  end if;

  v_status := lower(p_outcome)::app_private.import_status;

  select * into v_import
  from app_private.imports i
  where i.id = p_import_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'import not found';
  end if;

  if v_import.status = 'parsing'
     and not app_private.has_any_role(v_import.uploaded_by, array['uploader', 'admin']) then
    raise exception using errcode = '42501', message = 'uploader role required';
  end if;

  if v_import.status <> 'parsing' then
    if v_import.raw_sha256 = lower(p_raw_sha256)
       and v_import.normalized_hash is not distinct from lower(p_normalized_hash)
       and v_import.parser_version = p_parser_version
       and (
         v_import.status = v_status
         or (
           v_status = 'parsed'
           and v_import.status in ('duplicate', 'staged', 'published')
         )
       )
       and v_import.error_summary is not distinct from p_error_summary
       and v_import.preview_metadata = p_preview_metadata
       and v_import.validation_summary @> p_validation_summary then
      return v_import.status;
    end if;

    raise exception using errcode = '55000', message = 'import is not in parsing state';
  end if;

  if v_status = 'parsed' then
    select i.id into v_duplicate_id
    from app_private.imports i
    where i.id <> p_import_id
      and i.normalized_hash = lower(p_normalized_hash)
      and i.parser_version = p_parser_version
      and i.status in ('parsed', 'staged', 'published')
    order by i.created_at
    limit 1;

    if found then
      v_status := 'duplicate';
    end if;
  end if;

  update app_private.imports i
  set
    raw_sha256 = lower(p_raw_sha256),
    normalized_hash = lower(p_normalized_hash),
    parser_version = p_parser_version,
    status = v_status,
    preview_metadata = p_preview_metadata,
    validation_summary = p_validation_summary,
    error_summary = p_error_summary,
    duplicate_of_import_id = v_duplicate_id,
    parsed_at = statement_timestamp()
  where i.id = p_import_id and i.status = 'parsing';

  if not found then
    raise exception using errcode = '55000', message = 'import is not in parsing state';
  end if;

  perform app_private.write_audit_event(
    null,
    'import.parse_completed',
    'import',
    p_import_id,
    jsonb_build_object('outcome', v_status::text, 'duplicate_of', v_duplicate_id)
  );

  return v_status;
exception
  when unique_violation then
    select i.id into v_duplicate_id
    from app_private.imports i
    where i.id <> p_import_id
      and i.normalized_hash = lower(p_normalized_hash)
      and i.parser_version = p_parser_version
      and i.status in ('parsed', 'staged', 'published')
    order by i.created_at
    limit 1;

    update app_private.imports i
    set
      raw_sha256 = lower(p_raw_sha256),
      normalized_hash = lower(p_normalized_hash),
      parser_version = p_parser_version,
      status = 'duplicate',
      preview_metadata = p_preview_metadata,
      validation_summary = p_validation_summary,
      duplicate_of_import_id = v_duplicate_id,
      parsed_at = statement_timestamp()
    where i.id = p_import_id and i.status = 'parsing';

    perform app_private.write_audit_event(
      null,
      'import.parse_completed',
      'import',
      p_import_id,
      jsonb_build_object('outcome', 'duplicate', 'duplicate_of', v_duplicate_id)
    );

    return 'duplicate'::app_private.import_status;
end;
$$;

create function api.commit_parsed_import(
  p_import_id uuid,
  p_raw_sha256 text,
  p_normalized_hash text,
  p_parser_version text,
  p_preview_metadata jsonb,
  p_validation_summary jsonb,
  p_assessment jsonb,
  p_rows jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_status app_private.import_status;
  v_revision_id uuid;
  v_duplicate_of uuid;
begin
  -- Parse completion and normalized score staging share this transaction. Any
  -- staging error rolls the parse state back to `parsing` for a safe retry.
  v_status := api.complete_import_parse(
    p_import_id,
    p_raw_sha256,
    p_normalized_hash,
    p_parser_version,
    'parsed',
    null,
    p_preview_metadata,
    p_validation_summary
  );

  if v_status = 'parsed' then
    return api.stage_qpt_import(p_import_id, p_assessment, p_rows);
  end if;

  if v_status in ('staged', 'published') then
    select r.id into v_revision_id
    from app_private.assessment_revisions r
    where r.import_id = p_import_id;

    if v_revision_id is null then
      raise exception using errcode = '55000', message = 'committed import has no assessment revision';
    end if;

    return v_revision_id;
  end if;

  if v_status = 'duplicate' then
    select i.duplicate_of_import_id into v_duplicate_of
    from app_private.imports i
    where i.id = p_import_id;

    select r.id into v_revision_id
    from app_private.assessment_revisions r
    where r.import_id = v_duplicate_of;

    if v_revision_id is null then
      raise exception using errcode = '55000', message = 'duplicate canonical revision is not available';
    end if;

    return v_revision_id;
  end if;

  raise exception using errcode = '55000', message = 'parsed import could not be committed';
end;
$$;

create function api.stage_qpt_import(
  p_import_id uuid,
  p_assessment jsonb,
  p_rows jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  -- Source ownership is attributed to the uploader. This RPC is executable
  -- only by service_role; browser callers cannot supply or forge score rows.
  v_actor uuid;
  v_import app_private.imports%rowtype;
  v_batch app_private.batches%rowtype;
  v_assessment app_private.assessments%rowtype;
  v_revision_id uuid;
  v_revision_number integer;
  v_row jsonb;
  v_row_index integer := 0;
  v_student_id uuid;
  v_subject_id uuid;
  v_component_id uuid;
  v_existing_name text;
  v_existing_max numeric;
  v_subject_order integer := 0;
  v_status app_private.score_status;
  v_ranking_basis app_private.ranking_basis;
  v_qpt_number integer;
  v_test_date date;
begin
  if jsonb_typeof(p_assessment) <> 'object' or jsonb_typeof(p_rows) <> 'array' then
    raise exception using errcode = '22023', message = 'assessment must be an object and rows must be an array';
  end if;

  if jsonb_array_length(p_rows) = 0 then
    raise exception using errcode = '22023', message = 'at least one score row is required';
  end if;

  select * into v_import
  from app_private.imports
  where id = p_import_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'import not found';
  end if;

  v_actor := v_import.uploaded_by;

  if v_import.status <> 'parsed' then
    raise exception using errcode = '55000', message = 'import is not in parsed state';
  end if;

  if not app_private.has_any_role(v_actor, array['uploader', 'admin']) then
    raise exception using errcode = '42501', message = 'uploader role required';
  end if;

  if v_import.parser_version not in ('canonical-v1', 'legacy-sheet1-v1') then
    raise exception using errcode = '22023', message = 'unsupported parser version';
  end if;

  if p_assessment ? 'parser_version'
     and p_assessment->>'parser_version' <> v_import.parser_version then
    raise exception using errcode = '22023', message = 'parser version does not match the claimed import';
  end if;

  if nullif(btrim(p_assessment->>'assessment_code'), '') is null
     or nullif(btrim(p_assessment->>'academic_year'), '') is null
     or nullif(btrim(p_assessment->>'batch_code'), '') is null
     or nullif(btrim(p_assessment->>'display_title'), '') is null then
    raise exception using errcode = '22023', message = 'assessment metadata is incomplete';
  end if;

  begin
    v_qpt_number := (p_assessment->>'qpt_number')::integer;
    v_test_date := (p_assessment->>'test_date')::date;
    v_ranking_basis := coalesce(nullif(lower(p_assessment->>'ranking_basis'), ''), 'component_score')::app_private.ranking_basis;
  exception when invalid_text_representation or datetime_field_overflow then
    raise exception using errcode = '22023', message = 'assessment metadata has invalid types';
  end;

  if v_qpt_number <= 0 then
    raise exception using errcode = '22023', message = 'qpt number must be positive';
  end if;

  select * into v_batch
  from app_private.batches
  where code = btrim(p_assessment->>'batch_code')
    and academic_year = btrim(p_assessment->>'academic_year');

  if not found then
    insert into app_private.batches(code, academic_year, display_name, created_by)
    values (
      btrim(p_assessment->>'batch_code'),
      btrim(p_assessment->>'academic_year'),
      coalesce(nullif(btrim(p_assessment->>'batch_name'), ''), btrim(p_assessment->>'batch_code')),
      v_actor
    )
    returning * into v_batch;
  end if;

  select * into v_assessment
  from app_private.assessments
  where assessment_code = btrim(p_assessment->>'assessment_code')
  for update;

  if found then
    if v_assessment.batch_id <> v_batch.id
       or v_assessment.academic_year <> btrim(p_assessment->>'academic_year')
       or v_assessment.qpt_number <> v_qpt_number
       or v_assessment.test_date <> v_test_date then
      raise exception using errcode = '23514', message = 'assessment metadata conflicts with an existing assessment';
    end if;
  else
    insert into app_private.assessments (
      assessment_code, academic_year, qpt_number, batch_id, test_date, display_title, created_by
    )
    values (
      btrim(p_assessment->>'assessment_code'),
      btrim(p_assessment->>'academic_year'),
      v_qpt_number,
      v_batch.id,
      v_test_date,
      btrim(p_assessment->>'display_title'),
      v_actor
    )
    returning * into v_assessment;
  end if;

  select coalesce(max(revision_number), 0) + 1
    into v_revision_number
  from app_private.assessment_revisions
  where assessment_id = v_assessment.id;

  insert into app_private.assessment_revisions (
    assessment_id, revision_number, import_id, ranking_basis, created_by
  )
  values (
    v_assessment.id, v_revision_number, p_import_id, v_ranking_basis, v_actor
  )
  returning id into v_revision_id;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_row_index := v_row_index + 1;

    if jsonb_typeof(v_row) <> 'object'
       or nullif(btrim(v_row->>'roll_no'), '') is null
       or nullif(btrim(v_row->>'student_name_for_review'), '') is null
       or nullif(btrim(v_row->>'subject_code'), '') is null then
      raise exception using
        errcode = '22023',
        message = format('score row %s is incomplete', v_row_index);
    end if;

    begin
      v_status := lower(v_row->>'status')::app_private.score_status;
    exception when invalid_text_representation then
      raise exception using
        errcode = '22023',
        message = format('score row %s has an invalid status', v_row_index);
    end;

    select s.id, s.full_name into v_student_id, v_existing_name
    from app_private.enrollments e
    join app_private.students s on s.id = e.student_id
    where e.batch_id = v_batch.id
      and e.roll_no = btrim(v_row->>'roll_no');

    if found and v_existing_name <> btrim(v_row->>'student_name_for_review') then
      raise exception using
        errcode = '23514',
        message = format('score row %s student name does not match the existing roll number', v_row_index);
    elsif not found then
      insert into app_private.students(full_name, created_by)
      values (
        btrim(v_row->>'student_name_for_review'),
        v_actor
      )
      returning id into v_student_id;

      insert into app_private.enrollments(student_id, batch_id, roll_no, created_by)
      values (v_student_id, v_batch.id, btrim(v_row->>'roll_no'), v_actor);
    end if;

    insert into app_private.subjects(code, display_name, created_by)
    values (
      btrim(v_row->>'subject_code'),
      coalesce(nullif(btrim(v_row->>'subject_name'), ''), btrim(v_row->>'subject_code')),
      v_actor
    )
    on conflict (code) do nothing
    returning id into v_subject_id;

    if v_subject_id is null then
      select id into v_subject_id
      from app_private.subjects
      where code = btrim(v_row->>'subject_code');
    end if;

    select id, max_marks into v_component_id, v_existing_max
    from app_private.assessment_components
    where revision_id = v_revision_id and subject_id = v_subject_id;

    if found then
      if v_existing_max <> (v_row->>'max_marks')::numeric then
        raise exception using
          errcode = '23514',
          message = format('score row %s has inconsistent maximum marks', v_row_index);
      end if;
    else
      v_subject_order := v_subject_order + 1;
      insert into app_private.assessment_components (
        revision_id, subject_id, max_marks, sort_order
      )
      values (
        v_revision_id,
        v_subject_id,
        (v_row->>'max_marks')::numeric,
        v_subject_order
      )
      returning id, max_marks into v_component_id, v_existing_max;
    end if;

    insert into app_private.student_scores (
      revision_id,
      component_id,
      student_id,
      score,
      status,
      source_rank,
      source_student_name
    )
    values (
      v_revision_id,
      v_component_id,
      v_student_id,
      case when v_status = 'present' then (v_row->>'score')::numeric else null end,
      v_status,
      nullif(v_row->>'source_rank', '')::integer,
      btrim(v_row->>'student_name_for_review')
    );
  end loop;

  update app_private.imports
  set
    status = 'staged',
    staged_at = statement_timestamp(),
    row_count = v_row_index,
    validation_summary = validation_summary || jsonb_build_object(
      'parser_version', v_import.parser_version,
      'source_template_version', p_assessment->>'template_version',
      'assessment_code', p_assessment->>'assessment_code'
    )
  where id = p_import_id;

  perform app_private.write_audit_event(
    v_actor,
    'revision.staged',
    'assessment_revision',
    v_revision_id,
    jsonb_build_object('import_id', p_import_id, 'row_count', v_row_index)
  );

  return v_revision_id;
exception
  when unique_violation then
    raise exception using
      errcode = '23505',
      message = format('duplicate score, assessment, or import data near row %s', greatest(v_row_index, 1));
  when check_violation then
    raise exception using
      errcode = '23514',
      message = format('invalid score or assessment data near row %s', greatest(v_row_index, 1));
end;
$$;

create function api.import_review(p_import_id uuid)
returns table (
  import_id uuid,
  original_filename text,
  status text,
  created_at timestamptz,
  uploaded_by uuid,
  parser_version text,
  row_count integer,
  preview_metadata jsonb,
  validation_summary jsonb,
  error_summary jsonb,
  duplicate_of_import_id uuid,
  revision_id uuid,
  revision_status text,
  requires_corrected_reupload boolean
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

  if not app_private.is_account_active(v_actor) then
    raise exception using errcode = '42501', message = 'account is not active';
  end if;

  if not app_private.has_any_role(v_actor, array['uploader', 'publisher', 'admin']) then
    raise exception using errcode = '42501', message = 'staff role required';
  end if;

  return query
  select
    i.id,
    i.original_filename,
    i.status::text,
    i.created_at,
    i.uploaded_by,
    i.parser_version,
    i.row_count,
    i.preview_metadata,
    i.validation_summary,
    i.error_summary,
    i.duplicate_of_import_id,
    r.id,
    r.status::text,
    i.status in ('quarantined', 'failed')
  from app_private.imports i
  left join app_private.assessment_revisions r on r.import_id = i.id
  where i.id = p_import_id
    and (
      (
        i.uploaded_by = v_actor
        and app_private.has_any_role(v_actor, array['uploader', 'admin'])
      )
      or app_private.has_any_role(v_actor, array['publisher', 'admin'])
    );
end;
$$;

comment on function api.import_review(uuid) is
  'Safe parser metadata and validation issues only. Quarantined/failed imports require a corrected re-upload; raw score rows are never browser-supplied.';

create function api.pending_revisions()
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
    i.uploaded_by <> v_actor
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

create function api.publish_revision(
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

  -- Lock the shared assessment before any revision/import row. Every publish,
  -- restore, and staging transition then uses one serialization point and two
  -- publishers cannot deadlock while holding different revision rows.
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

  if v_import.uploaded_by = v_actor then
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

create function api.publication_history(p_assessment_id uuid)
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
    p.superseded_at is not null and i.uploaded_by <> v_actor
  from app_private.publications p
  join app_private.assessment_revisions r on r.id = p.revision_id
  join app_private.imports i on i.id = r.import_id
  where p.assessment_id = p_assessment_id
  order by p.published_at desc, p.id;
end;
$$;

create function api.restore_revision(
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

  if v_import.uploaded_by = v_actor then
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
  where id = v_previous_revision_id;

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
      'from_revision_id', v_previous_revision_id,
      'publication_id', v_publication_id
    )
  );

  return v_publication_id;
end;
$$;

-- Private immutable workbook bucket. Client policies intentionally permit no
-- overwrite or delete; cleanup is a trusted service operation.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'qpt-imports',
  'qpt-imports',
  false,
  10485760,
  array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "qpt import uploaders insert own immutable xlsx"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'qpt-imports'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) = 'xlsx'
  and app_private.has_any_role((select auth.uid()), array['uploader', 'admin'])
  and app_private.can_upload_import((select auth.uid()), name)
);

-- Storage upload performs INSERT ... RETURNING metadata. Permit that metadata
-- response only for the exact upload operation; object download, listing,
-- signed URLs, and authenticated info remain denied to every browser role.
create policy "qpt import uploader receives upload metadata only"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'qpt-imports'
  and owner_id = (select auth.uid())::text
  and storage.allow_only_operation('storage.object.upload')
  and app_private.has_any_role((select auth.uid()), array['uploader', 'admin'])
  and app_private.can_upload_import((select auth.uid()), name)
);

revoke all on schema public from public, anon, authenticated;
revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

revoke all on all tables in schema app_private from public, anon, authenticated;
revoke all on all sequences in schema app_private from public, anon, authenticated;
revoke execute on all functions in schema app_private from public, anon, authenticated;

grant all on all tables in schema app_private to service_role;
grant all on all sequences in schema app_private to service_role;
grant execute on all functions in schema app_private to service_role;
revoke truncate on app_private.audit_events from service_role;

-- RLS policies need this helper at execution time, but callers still have no
-- USAGE on the private schema and cannot invoke it directly through PostgREST.
grant execute on function app_private.has_any_role(uuid, text[]) to authenticated;
grant execute on function app_private.can_upload_import(uuid, text) to authenticated;

revoke execute on all functions in schema api from public, anon, authenticated;
grant execute on function api.my_students() to authenticated, service_role;
grant execute on function api.student_results(uuid, text) to authenticated, service_role;
grant execute on function api.my_portal_context() to authenticated, service_role;
grant execute on function api.set_account_status(uuid, text, text) to authenticated, service_role;
grant execute on function api.begin_import(uuid, text, bigint) to authenticated, service_role;
grant execute on function api.confirm_import_upload(uuid) to authenticated, service_role;
grant execute on function api.import_review(uuid) to authenticated, service_role;
grant execute on function api.pending_revisions() to authenticated, service_role;
grant execute on function api.publish_revision(uuid, uuid) to authenticated, service_role;
grant execute on function api.publication_history(uuid) to authenticated, service_role;
grant execute on function api.restore_revision(uuid, uuid) to authenticated, service_role;
-- Parsing and canonical score commits are trusted-server operations only.
grant execute on function api.claim_import(uuid) to service_role;
grant execute on function api.complete_import_parse(uuid, text, text, text, text, jsonb, jsonb, jsonb) to service_role;
grant execute on function api.commit_parsed_import(uuid, text, text, text, jsonb, jsonb, jsonb, jsonb) to service_role;
grant execute on function api.stage_qpt_import(uuid, jsonb, jsonb) to service_role;

comment on schema app_private is 'Never expose via PostgREST; contains student PII and assessment data.';
comment on schema api is 'Narrow RPC-only interface exposed through PostgREST.';
comment on function api.publish_revision(uuid, uuid) is
  'Compare-and-swap publication of the latest staged revision; uploader and publisher must differ.';
comment on function api.restore_revision(uuid, uuid) is
  'Compare-and-swap restore of a published revision when no staged correction is pending.';
