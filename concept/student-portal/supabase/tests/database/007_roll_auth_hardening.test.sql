begin;

create extension if not exists pgtap with schema extensions;

select plan(32);

select has_column(
  'app_private',
  'user_accounts',
  'credential_version',
  'portal accounts carry a credential compare-and-swap version'
);
select col_not_null(
  'app_private',
  'user_accounts',
  'credential_version',
  'every portal account has a credential version'
);
select hasnt_function(
  'api',
  'complete_initial_password_change',
  array['uuid'],
  'the one-argument password completion bypass no longer exists'
);
select has_function(
  'api',
  'complete_initial_password_change',
  array['uuid', 'uuid', 'uuid'],
  'password completion requires the expected credential version and operation'
);
select is(
  has_function_privilege(
    'authenticated',
    'api.complete_initial_password_change(uuid,uuid,uuid)',
    'EXECUTE'
  ),
  false,
  'browser callers cannot execute versioned password completion'
);
select is(
  has_function_privilege(
    'service_role',
    'api.complete_initial_password_change(uuid,uuid,uuid)',
    'EXECUTE'
  ),
  true,
  'only the trusted service path can complete a versioned password change'
);

-- Every identity and record below is synthetic. The legacy identity owns two
-- student links so replacing one of them must not disable the whole account.
insert into auth.users (id, email, encrypted_password, aud, role)
values
  ('f1000000-0000-4000-8000-000000000001', 'hardening.admin@example.invalid', '', 'authenticated', 'authenticated'),
  ('f1000000-0000-4000-8000-000000000010', 'legacy.multi@example.invalid', '', 'authenticated', 'authenticated'),
  ('f1000000-0000-4000-8000-000000000011', 'student.hard-7001@login.concept.invalid', '', 'authenticated', 'authenticated'),
  ('f1000000-0000-4000-8000-000000000020', 'student.hard-reset-8001@login.concept.invalid', '', 'authenticated', 'authenticated'),
  ('f1000000-0000-4000-8000-000000000030', 'legacy.staff@example.invalid', '', 'authenticated', 'authenticated'),
  ('f1000000-0000-4000-8000-000000000031', 'student.hard-role-9001@login.concept.invalid', '', 'authenticated', 'authenticated');

insert into app_private.account_roles (user_id, role, granted_by)
values
  (
    'f1000000-0000-4000-8000-000000000001',
    'admin',
    'f1000000-0000-4000-8000-000000000001'
  ),
  (
    'f1000000-0000-4000-8000-000000000030',
    'uploader',
    'f1000000-0000-4000-8000-000000000001'
  );

insert into app_private.batches (id, code, academic_year, display_name, created_by)
values (
  'f2000000-0000-4000-8000-000000000001',
  'HARDEN-BATCH',
  '2099-00',
  'Synthetic Hardening Batch',
  'f1000000-0000-4000-8000-000000000001'
);

insert into app_private.students (id, full_name, created_by)
values
  ('f3000000-0000-4000-8000-000000000001', 'Synthetic Cutover Target', 'f1000000-0000-4000-8000-000000000001'),
  ('f3000000-0000-4000-8000-000000000002', 'Synthetic Retained Link', 'f1000000-0000-4000-8000-000000000001'),
  ('f3000000-0000-4000-8000-000000000003', 'Synthetic Reset Target', 'f1000000-0000-4000-8000-000000000001'),
  ('f3000000-0000-4000-8000-000000000004', 'Synthetic Staff Cutover Target', 'f1000000-0000-4000-8000-000000000001');

insert into app_private.enrollments (student_id, batch_id, roll_no, created_by)
values
  ('f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'HARD-7001', 'f1000000-0000-4000-8000-000000000001'),
  ('f3000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000001', 'HARD-7002', 'f1000000-0000-4000-8000-000000000001'),
  ('f3000000-0000-4000-8000-000000000003', 'f2000000-0000-4000-8000-000000000001', 'HARD-RESET-8001', 'f1000000-0000-4000-8000-000000000001'),
  ('f3000000-0000-4000-8000-000000000004', 'f2000000-0000-4000-8000-000000000001', 'HARD-ROLE-9001', 'f1000000-0000-4000-8000-000000000001');

insert into app_private.student_account_links (user_id, student_id, linked_by)
values
  ('f1000000-0000-4000-8000-000000000010', 'f3000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000010', 'f3000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000020', 'f3000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000001'),
  ('f1000000-0000-4000-8000-000000000030', 'f3000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000001');

update app_private.user_accounts
set
  login_id = 'hard-reset-8001',
  must_change_password = true,
  temporary_password_issued_at = statement_timestamp(),
  credential_changed_by = 'f1000000-0000-4000-8000-000000000001',
  credential_changed_at = statement_timestamp()
where user_id = 'f1000000-0000-4000-8000-000000000020';

create temporary table hardening_versions (
  label text primary key,
  version uuid not null
) on commit drop;
grant select, insert on hardening_versions to service_role;

set local role service_role;

insert into hardening_versions(label, version)
select 'provision-before', credential_version
from api.credential_state('f1000000-0000-4000-8000-000000000011');

select isnt(
  (select version from hardening_versions where label = 'provision-before'),
  null::uuid,
  'the Auth-created portal account starts with a credential version'
);

insert into hardening_versions(label, version)
select 'provision-after', credential_version
from api.complete_student_account_provision(
  'f1000000-0000-4000-8000-000000000001',
  'f3000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000011',
  'f4000000-0000-4000-8000-000000000001'
);

select isnt(
  (select version from hardening_versions where label = 'provision-after'),
  (select version from hardening_versions where label = 'provision-before'),
  'first provisioning rotates the credential version'
);
select is(
  (select credential_version from api.credential_state('f1000000-0000-4000-8000-000000000011')),
  (select version from hardening_versions where label = 'provision-after'),
  'credential state reports the provisioned version'
);
select is(
  (
    select is_active
    from app_private.student_account_links
    where user_id = 'f1000000-0000-4000-8000-000000000010'
      and student_id = 'f3000000-0000-4000-8000-000000000001'
  ),
  false,
  'legacy cutover deactivates the target link only'
);
select is(
  (
    select is_active
    from app_private.student_account_links
    where user_id = 'f1000000-0000-4000-8000-000000000010'
      and student_id = 'f3000000-0000-4000-8000-000000000002'
  ),
  true,
  'legacy cutover preserves the other active student link'
);
select is(
  (select status::text from app_private.user_accounts where user_id = 'f1000000-0000-4000-8000-000000000010'),
  'active',
  'a legacy identity with another active link remains active'
);
select is(
  (
    select count(*)
    from app_private.student_account_links
    where user_id = 'f1000000-0000-4000-8000-000000000011'
      and student_id = 'f3000000-0000-4000-8000-000000000001'
      and is_active
  ),
  1::bigint,
  'cutover creates one active roll-login link for the target'
);
select is(
  (select credential_version from api.complete_student_account_provision(
    'f1000000-0000-4000-8000-000000000001',
    'f3000000-0000-4000-8000-000000000001',
    'f1000000-0000-4000-8000-000000000011',
    'f4000000-0000-4000-8000-000000000001'
  )),
  (select version from hardening_versions where label = 'provision-after'),
  'an idempotent provisioning retry does not invalidate its credential version'
);
select lives_ok(
  $$ select * from api.complete_student_account_provision(
       'f1000000-0000-4000-8000-000000000001',
       'f3000000-0000-4000-8000-000000000004',
       'f1000000-0000-4000-8000-000000000031',
       'f4000000-0000-4000-8000-000000000004'
     ) $$,
  'a legacy staff-linked student can cut over to a roll login'
);
select is(
  (select status::text from app_private.user_accounts where user_id = 'f1000000-0000-4000-8000-000000000030'),
  'active',
  'a legacy identity with a staff role remains active after cutover'
);
select is(
  (
    select is_active
    from app_private.student_account_links
    where user_id = 'f1000000-0000-4000-8000-000000000030'
      and student_id = 'f3000000-0000-4000-8000-000000000004'
  ),
  false,
  'staff cutover still deactivates only the selected student link'
);
select is(
  (
    select count(*)
    from app_private.account_roles
    where user_id = 'f1000000-0000-4000-8000-000000000030'
      and role = 'uploader'
  ),
  1::bigint,
  'staff cutover preserves the legacy role assignment'
);

insert into hardening_versions(label, version)
select 'reset-before', credential_version
from api.credential_state('f1000000-0000-4000-8000-000000000020');

select isnt(
  (select version from hardening_versions where label = 'reset-before'),
  null::uuid,
  'a resettable account has a credential version'
);

insert into hardening_versions(label, version)
select 'reset-one', credential_version
from api.begin_student_credential_reset(
  'f1000000-0000-4000-8000-000000000001',
  'f3000000-0000-4000-8000-000000000003',
  'f4000000-0000-4000-8000-000000000010'
);

select isnt(
  (select version from hardening_versions where label = 'reset-one'),
  (select version from hardening_versions where label = 'reset-before'),
  'beginning a reset rotates the credential version'
);
select is(
  (select credential_version from api.credential_state('f1000000-0000-4000-8000-000000000020')),
  (select version from hardening_versions where label = 'reset-one'),
  'credential state reports the first reset version'
);

select lives_ok(
  $$ select * from api.fail_student_credential_reset(
       'f1000000-0000-4000-8000-000000000020',
       (select version from hardening_versions where label = 'reset-one'),
       'f4000000-0000-4000-8000-000000000010'
     ) $$,
  'an ambiguous first Auth reset remains fail-closed and recoverable'
);

insert into hardening_versions(label, version)
select 'reset-two', credential_version
from api.begin_student_credential_reset(
  'f1000000-0000-4000-8000-000000000001',
  'f3000000-0000-4000-8000-000000000003',
  'f4000000-0000-4000-8000-000000000020'
);

select isnt(
  (select version from hardening_versions where label = 'reset-two'),
  (select version from hardening_versions where label = 'reset-one'),
  'a concurrent later reset supersedes the first reset version'
);
select throws_ok(
  $$ select * from api.complete_initial_password_change(
       'f1000000-0000-4000-8000-000000000020',
       (select version from hardening_versions where label = 'reset-one'),
       'f4000000-0000-4000-8000-000000000010'
     ) $$,
  '40001',
  'credential state changed; restart password change',
  'a stale password completion cannot win after a later reset'
);
select is(
  (select must_change_password from api.credential_state('f1000000-0000-4000-8000-000000000020')),
  true,
  'a rejected stale completion leaves the portal gate closed'
);
select lives_ok(
  $$ select * from api.complete_student_credential_reset(
       'f1000000-0000-4000-8000-000000000020',
       (select version from hardening_versions where label = 'reset-two'),
       'f4000000-0000-4000-8000-000000000020'
     ) $$,
  'the successful second Auth reset finalizes its exact operation'
);
with claimed as (
  select * from api.begin_initial_password_change(
    'f1000000-0000-4000-8000-000000000020',
    (select version from hardening_versions where label = 'reset-two'),
    'f4000000-0000-4000-8000-000000000030'
  )
)
select is(
  (select completed.must_change_password
   from claimed,
     lateral api.complete_initial_password_change(
       claimed.user_id,
       claimed.credential_version,
       claimed.operation_id
     ) completed),
  false,
  'the current credential version can complete the password change'
);
select isnt(
  (select password_changed_at from api.credential_state('f1000000-0000-4000-8000-000000000020')),
  null::timestamptz,
  'versioned completion timestamps the accepted password change'
);
select is(
  (select credential_version from api.credential_state('f1000000-0000-4000-8000-000000000020')),
  (select version from hardening_versions where label = 'reset-two'),
  'successful completion retains the compared credential version'
);
select throws_ok(
  $$ select * from api.complete_initial_password_change(
       'f1000000-0000-4000-8000-000000000020',
       (select version from hardening_versions where label = 'reset-one'),
       'f4000000-0000-4000-8000-000000000010'
     ) $$,
  '40001',
  'credential state changed; restart password change',
  'an older credential version remains stale after completion'
);
select is(
  (
    select count(*)
    from app_private.audit_events
    where action = 'credential.reset_required'
      and entity_id = 'f3000000-0000-4000-8000-000000000003'
  ),
  2::bigint,
  'each reset generation is audited'
);
select is(
  (
    select count(*)
    from app_private.audit_events
    where action = 'credential.password_changed'
      and entity_id = 'f1000000-0000-4000-8000-000000000020'
  ),
  1::bigint,
  'only the current generation records password completion'
);

select * from finish();
rollback;
