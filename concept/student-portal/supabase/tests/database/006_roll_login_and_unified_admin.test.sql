begin;

create extension if not exists pgtap with schema extensions;

select plan(63);

select has_column('app_private', 'user_accounts', 'login_id', 'portal accounts store a private login id');
select has_column('app_private', 'user_accounts', 'must_change_password', 'portal accounts track forced password changes');
select has_column('app_private', 'user_accounts', 'temporary_password_issued_at', 'temporary credential issuance is timestamped');
select has_column('app_private', 'user_accounts', 'password_changed_at', 'password completion is timestamped');
select has_column('app_private', 'user_accounts', 'credential_changed_by', 'credential changes retain an actor');
select has_column('app_private', 'user_accounts', 'credential_changed_at', 'credential changes retain a timestamp');

select has_function(
  'api',
  'admin_student_accounts',
  array['uuid'],
  'service account-directory RPC exists'
);
select has_function(
  'api',
  'prepare_student_account_provision',
  array['uuid', 'uuid'],
  'service provisioning preparation RPC exists'
);
select has_function(
  'api',
  'complete_student_account_provision',
  array['uuid', 'uuid', 'uuid', 'uuid'],
  'service provisioning completion RPC exists'
);
select has_function(
  'api',
  'begin_student_credential_reset',
  array['uuid', 'uuid', 'uuid'],
  'service credential reset RPC exists'
);
select has_function(
  'api',
  'credential_state',
  array['uuid'],
  'service credential-state RPC exists'
);
select has_function(
  'api',
  'complete_initial_password_change',
  array['uuid', 'uuid', 'uuid'],
  'operation-bound service password completion RPC exists'
);

select is(
  has_function_privilege('authenticated', 'api.admin_student_accounts(uuid)', 'EXECUTE'),
  false,
  'browser callers cannot enumerate student accounts'
);
select is(
  has_function_privilege('authenticated', 'api.prepare_student_account_provision(uuid,uuid)', 'EXECUTE'),
  false,
  'browser callers cannot prepare Auth provisioning'
);
select is(
  has_function_privilege('authenticated', 'api.complete_student_account_provision(uuid,uuid,uuid,uuid)', 'EXECUTE'),
  false,
  'browser callers cannot bind Auth identities'
);
select is(
  has_function_privilege('authenticated', 'api.begin_student_credential_reset(uuid,uuid,uuid)', 'EXECUTE'),
  false,
  'browser callers cannot force credential resets'
);
select is(
  has_function_privilege('authenticated', 'api.credential_state(uuid)', 'EXECUTE'),
  false,
  'browser callers cannot query arbitrary credential state'
);
select is(
  has_function_privilege('authenticated', 'api.complete_initial_password_change(uuid,uuid,uuid)', 'EXECUTE'),
  false,
  'browser callers cannot bypass the password-change gate'
);

-- Every identity and record below is synthetic.
insert into auth.users (id, email, encrypted_password, aud, role)
values
  ('c0000000-0000-4000-8000-000000000001', 'student.temp@example.invalid', '', 'authenticated', 'authenticated'),
  ('c0000000-0000-4000-8000-000000000099', 'student.0099@login.concept.invalid', '', 'authenticated', 'authenticated'),
  ('c0000000-0000-4000-8000-000000000100', 'collision.fixture@example.invalid', '', 'authenticated', 'authenticated'),
  ('c0000000-0000-4000-8000-000000000110', 'student.batch-b-0012@login.concept.invalid', '', 'authenticated', 'authenticated'),
  ('d0000000-0000-4000-8000-000000000001', 'admin@example.invalid', '', 'authenticated', 'authenticated'),
  ('d0000000-0000-4000-8000-000000000002', 'dual.staff@example.invalid', '', 'authenticated', 'authenticated'),
  ('d0000000-0000-4000-8000-000000000003', 'publisher@example.invalid', '', 'authenticated', 'authenticated');

insert into app_private.account_roles (user_id, role, granted_by)
values
  ('d0000000-0000-4000-8000-000000000001', 'admin', 'd0000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000002', 'uploader', 'd0000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000002', 'publisher', 'd0000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000003', 'publisher', 'd0000000-0000-4000-8000-000000000001');

insert into app_private.batches (id, code, academic_year, display_name, created_by)
values
  ('e1000000-0000-4000-8000-000000000001', 'BATCH-A', '2026-27', 'Synthetic Batch A', 'd0000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000002', 'BATCH-B', '2026-27', 'Synthetic Batch B', 'd0000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000003', '###', '----', 'Synthetic Noncanonical Batch', 'd0000000-0000-4000-8000-000000000001');

insert into app_private.students (id, full_name, created_by)
values
  ('e2000000-0000-4000-8000-000000000001', 'Synthetic Temporary Student', 'd0000000-0000-4000-8000-000000000001'),
  ('e2000000-0000-4000-8000-000000000099', 'Synthetic Provision Target', 'd0000000-0000-4000-8000-000000000001'),
  ('e2000000-0000-4000-8000-000000000100', 'Synthetic Collision Target', 'd0000000-0000-4000-8000-000000000001'),
  ('e2000000-0000-4000-8000-000000000101', 'Synthetic Student Without Enrollment', 'd0000000-0000-4000-8000-000000000001'),
  ('e2000000-0000-4000-8000-000000000102', 'Synthetic Fallback Batch Target', 'd0000000-0000-4000-8000-000000000001');

insert into app_private.enrollments (student_id, batch_id, roll_no, created_by)
values
  ('e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', '0012', 'd0000000-0000-4000-8000-000000000001'),
  ('e2000000-0000-4000-8000-000000000099', 'e1000000-0000-4000-8000-000000000001', '0099', 'd0000000-0000-4000-8000-000000000001'),
  ('e2000000-0000-4000-8000-000000000100', 'e1000000-0000-4000-8000-000000000002', '0012', 'd0000000-0000-4000-8000-000000000001'),
  ('e2000000-0000-4000-8000-000000000102', 'e1000000-0000-4000-8000-000000000003', '0012', 'd0000000-0000-4000-8000-000000000001');

insert into app_private.student_account_links (user_id, student_id, linked_by)
values
  (
    'c0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001'
  ),
  (
    'c0000000-0000-4000-8000-000000000100',
    'e2000000-0000-4000-8000-000000000100',
    'd0000000-0000-4000-8000-000000000001'
  );

update app_private.user_accounts
set
  login_id = '0012',
  must_change_password = true,
  temporary_password_issued_at = statement_timestamp(),
  credential_changed_by = 'd0000000-0000-4000-8000-000000000001',
  credential_changed_at = statement_timestamp()
where user_id = 'c0000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ update app_private.user_accounts
     set login_id = 'UPPERCASE'
     where user_id = 'c0000000-0000-4000-8000-000000000100' $$,
  '23514',
  null,
  'login ids must use the canonical restricted alphabet'
);

select throws_ok(
  $$ update app_private.user_accounts
     set login_id = '0012'
     where user_id = 'c0000000-0000-4000-8000-000000000100' $$,
  '23505',
  null,
  'canonical login ids are globally unique'
);

set local role authenticated;
set local request.jwt.claim.sub = 'c0000000-0000-4000-8000-000000000001';

select is(
  api.my_portal_context()->>'login_id',
  '0012',
  'portal context returns the signed-in account login id'
);
select is(
  (api.my_portal_context()->>'must_change_password')::boolean,
  true,
  'portal context reports a required initial password change'
);
select is(
  api.my_portal_context()->>'account_status',
  'active',
  'portal context distinguishes account status from credential readiness'
);
select is(
  jsonb_array_length(api.my_portal_context()->'students'),
  0,
  'a temporary credential cannot reveal linked students'
);
select is(
  (select count(*) from api.my_students()),
  0::bigint,
  'the password-change gate is enforced by the linked-student RPC'
);

reset role;

set local role service_role;

select is(
  (select must_change_password from api.credential_state('c0000000-0000-4000-8000-000000000001')),
  true,
  'trusted account management can inspect credential state'
);
with credential as (
  select credential_version
  from api.credential_state('c0000000-0000-4000-8000-000000000001')
), claimed as (
  select claim.credential_version, claim.operation_id
  from credential,
    lateral api.begin_initial_password_change(
      'c0000000-0000-4000-8000-000000000001',
      credential.credential_version,
      'c8000000-0000-4000-8000-000000000001'
    ) claim
)
select is(
  (select completed.must_change_password
   from claimed,
     lateral api.complete_initial_password_change(
       'c0000000-0000-4000-8000-000000000001',
       claimed.credential_version,
       claimed.operation_id
     ) completed),
  false,
  'trusted completion opens the portal gate only after Auth changes the password'
);
select isnt(
  (select password_changed_at from api.credential_state('c0000000-0000-4000-8000-000000000001')),
  null::timestamptz,
  'password completion retains its timestamp'
);
select is(
  (select count(*) from app_private.audit_events where action = 'credential.password_changed' and actor_id = 'c0000000-0000-4000-8000-000000000001'),
  1::bigint,
  'password completion is audited once'
);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'c0000000-0000-4000-8000-000000000001';

select is(
  (select count(*) from api.my_students()),
  1::bigint,
  'the linked student becomes visible after trusted password completion'
);

reset role;

-- Create an admin-owned staged revision. The same admin may publish it, while
-- all validation, latest-revision, and compare-and-swap checks remain intact.
insert into app_private.subjects (id, code, display_name, created_by)
values ('e3000000-0000-4000-8000-000000000001', 'ROLL-LOGIN-MATHS', 'Synthetic Mathematics', 'd0000000-0000-4000-8000-000000000001');

insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size,
  raw_sha256, normalized_hash, parser_version, status, uploaded_by,
  row_count, staged_at
)
values (
  'e4000000-0000-4000-8000-000000000001',
  'e4100000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000001/admin-r1.xlsx',
  'admin-r1.xlsx', 1024, repeat('1', 64), repeat('a', 64),
  'canonical-v1', 'staged', 'd0000000-0000-4000-8000-000000000001',
  1, statement_timestamp()
);

insert into app_private.assessments (
  id, assessment_code, academic_year, qpt_number, batch_id, test_date,
  display_title, created_by
)
values (
  'e5000000-0000-4000-8000-000000000001', 'ADMIN-QPT-1', '2026-27', 1,
  'e1000000-0000-4000-8000-000000000001', date '2026-07-15',
  'Admin QPT 1', 'd0000000-0000-4000-8000-000000000001'
);

insert into app_private.assessment_revisions (
  id, assessment_id, revision_number, import_id, ranking_basis, status, created_by
)
values (
  'e6000000-0000-4000-8000-000000000001',
  'e5000000-0000-4000-8000-000000000001', 1,
  'e4000000-0000-4000-8000-000000000001', 'component_score', 'staged',
  'd0000000-0000-4000-8000-000000000001'
);

insert into app_private.assessment_components (id, revision_id, subject_id, max_marks, sort_order)
values (
  'e7000000-0000-4000-8000-000000000001',
  'e6000000-0000-4000-8000-000000000001',
  'e3000000-0000-4000-8000-000000000001', 100, 1
);

insert into app_private.student_scores (revision_id, component_id, student_id, score, status, source_rank)
values (
  'e6000000-0000-4000-8000-000000000001',
  'e7000000-0000-4000-8000-000000000001',
  'e2000000-0000-4000-8000-000000000001', 82, 'present', 1
);

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000001';

select is(
  (select can_publish from api.pending_revisions() where revision_id = 'e6000000-0000-4000-8000-000000000001'),
  true,
  'the uploading admin may publish the latest validated revision'
);
select lives_ok(
  $$ select api.publish_revision('e6000000-0000-4000-8000-000000000001', null) $$,
  'one admin account can publish its own validated upload'
);

reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'c0000000-0000-4000-8000-000000000001';
select is(
  (select count(*) from api.student_results('e2000000-0000-4000-8000-000000000001', null)),
  1::bigint,
  'a ready student sees the admin-published result'
);
reset role;

-- Publish a second admin-owned revision, then restore the first one with the
-- same admin account.
insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size,
  raw_sha256, normalized_hash, parser_version, status, uploaded_by,
  row_count, staged_at
)
values (
  'e4000000-0000-4000-8000-000000000002',
  'e4100000-0000-4000-8000-000000000002',
  'd0000000-0000-4000-8000-000000000001/admin-r2.xlsx',
  'admin-r2.xlsx', 1024, repeat('2', 64), repeat('b', 64),
  'canonical-v1', 'staged', 'd0000000-0000-4000-8000-000000000001',
  1, statement_timestamp()
);

insert into app_private.assessment_revisions (
  id, assessment_id, revision_number, import_id, ranking_basis, status, created_by
)
values (
  'e6000000-0000-4000-8000-000000000002',
  'e5000000-0000-4000-8000-000000000001', 2,
  'e4000000-0000-4000-8000-000000000002', 'component_score', 'staged',
  'd0000000-0000-4000-8000-000000000001'
);

insert into app_private.assessment_components (id, revision_id, subject_id, max_marks, sort_order)
values (
  'e7000000-0000-4000-8000-000000000002',
  'e6000000-0000-4000-8000-000000000002',
  'e3000000-0000-4000-8000-000000000001', 100, 1
);

insert into app_private.student_scores (revision_id, component_id, student_id, score, status, source_rank)
values (
  'e6000000-0000-4000-8000-000000000002',
  'e7000000-0000-4000-8000-000000000002',
  'e2000000-0000-4000-8000-000000000001', 91, 'present', 1
);

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000001';
select lives_ok(
  $$ select api.publish_revision(
    'e6000000-0000-4000-8000-000000000002',
    'e6000000-0000-4000-8000-000000000001'
  ) $$,
  'the same admin may publish a correction'
);
select lives_ok(
  $$ select api.restore_revision(
    'e6000000-0000-4000-8000-000000000001',
    'e6000000-0000-4000-8000-000000000002'
  ) $$,
  'the same admin may restore its own previously published revision'
);
reset role;

-- A non-admin account that happens to hold both legacy roles remains subject
-- to uploader/publisher separation.
insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size,
  raw_sha256, normalized_hash, parser_version, status, uploaded_by,
  row_count, staged_at
)
values (
  'e4000000-0000-4000-8000-000000000003',
  'e4100000-0000-4000-8000-000000000003',
  'd0000000-0000-4000-8000-000000000002/dual.xlsx',
  'dual.xlsx', 1024, repeat('3', 64), repeat('c', 64),
  'canonical-v1', 'staged', 'd0000000-0000-4000-8000-000000000002',
  1, statement_timestamp()
);

insert into app_private.assessments (
  id, assessment_code, academic_year, qpt_number, batch_id, test_date,
  display_title, created_by
)
values (
  'e5000000-0000-4000-8000-000000000003', 'DUAL-QPT-2', '2026-27', 2,
  'e1000000-0000-4000-8000-000000000001', date '2026-07-16',
  'Dual-role QPT', 'd0000000-0000-4000-8000-000000000002'
);

insert into app_private.assessment_revisions (
  id, assessment_id, revision_number, import_id, ranking_basis, status, created_by
)
values (
  'e6000000-0000-4000-8000-000000000003',
  'e5000000-0000-4000-8000-000000000003', 1,
  'e4000000-0000-4000-8000-000000000003', 'component_score', 'staged',
  'd0000000-0000-4000-8000-000000000002'
);

set local role authenticated;
set local request.jwt.claim.sub = 'd0000000-0000-4000-8000-000000000002';
select is(
  (select can_publish from api.pending_revisions() where revision_id = 'e6000000-0000-4000-8000-000000000003'),
  false,
  'legacy dual-role staff cannot publish their own upload'
);
select throws_ok(
  $$ select api.publish_revision('e6000000-0000-4000-8000-000000000003', null) $$,
  '42501',
  'uploader and publisher must be different users',
  'the publication RPC preserves separation for non-admin staff'
);
reset role;

-- Service-only account management checks the supplied actor against current
-- database state on every call.
set local role service_role;

select throws_ok(
  $$ select * from api.admin_student_accounts('d0000000-0000-4000-8000-000000000002') $$,
  '42501',
  'active admin role required',
  'a service caller cannot substitute a non-admin actor for account listing'
);
select is(
  (
    select count(*)
    from api.admin_student_accounts('d0000000-0000-4000-8000-000000000001')
    where student_id in (
      'e2000000-0000-4000-8000-000000000001',
      'e2000000-0000-4000-8000-000000000099',
      'e2000000-0000-4000-8000-000000000100'
    )
  ),
  3::bigint,
  'an active admin can list the synthetic student account directory'
);
select is(
  (
    select count(*)
    from api.admin_student_accounts('d0000000-0000-4000-8000-000000000001')
    where student_id = 'e2000000-0000-4000-8000-000000000101'
  ),
  0::bigint,
  'the account directory includes only students with an active provisionable enrollment'
);
select is(
  (select login_id from api.admin_student_accounts('d0000000-0000-4000-8000-000000000001') where student_id = 'e2000000-0000-4000-8000-000000000001'),
  '0012',
  'the account directory reports an existing login id'
);
select is(
  (select account_status from api.admin_student_accounts('d0000000-0000-4000-8000-000000000001') where student_id = 'e2000000-0000-4000-8000-000000000099'),
  'not-provisioned',
  'the account directory returns a semantic status for an unprovisioned student'
);
select throws_ok(
  $$ select * from api.prepare_student_account_provision(
    'd0000000-0000-4000-8000-000000000002',
    'e2000000-0000-4000-8000-000000000099'
  ) $$,
  '42501',
  'active admin role required',
  'a service caller cannot substitute a non-admin actor for provisioning'
);
select is(
  (select login_id from api.prepare_student_account_provision(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000099'
  )),
  '0099',
  'a globally available roll number becomes the canonical login id'
);
select is(
  (select auth_email from api.prepare_student_account_provision(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000099'
  )),
  'student.0099@login.concept.invalid',
  'provisioning returns a deterministic internal Auth email only to service role'
);
select is(
  (select already_provisioned from api.prepare_student_account_provision(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000099'
  )),
  false,
  'provisioning preparation distinguishes a new account'
);
select is(
  (select login_id from api.prepare_student_account_provision(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000100'
  )),
  'batch-b-0012',
  'a duplicated active roll number receives a deterministic batch-qualified login id'
);
select is(
  (select login_id from api.prepare_student_account_provision(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000102'
  )),
  'batch-0012',
  'an uncanonicalizable batch and year use a valid lowercase fallback login id'
);
select is(
  (select already_provisioned from api.complete_student_account_provision(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000100',
    'c0000000-0000-4000-8000-000000000110',
    'c8000000-0000-4000-8000-000000000100'
  )),
  true,
  'roll provisioning replaces a legacy linked account without a login id'
);
select is(
  (select status::text from app_private.user_accounts where user_id = 'c0000000-0000-4000-8000-000000000100'),
  'disabled',
  'legacy account replacement disables the previous portal account'
);
select is(
  (
    select count(*)
    from app_private.student_account_links
    where student_id = 'e2000000-0000-4000-8000-000000000100'
      and user_id = 'c0000000-0000-4000-8000-000000000110'
      and is_active
  ),
  1::bigint,
  'legacy account replacement leaves exactly one active roll-login link'
);

select is(
  (select already_provisioned from api.complete_student_account_provision(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000099',
    'c0000000-0000-4000-8000-000000000099',
    'c8000000-0000-4000-8000-000000000099'
  )),
  true,
  'trusted provisioning binds the matching Auth identity'
);
select is(
  (select login_id from app_private.user_accounts where user_id = 'c0000000-0000-4000-8000-000000000099'),
  '0099',
  'provisioning persists only the canonical login id, not a password'
);
select is(
  (select must_change_password from app_private.user_accounts where user_id = 'c0000000-0000-4000-8000-000000000099'),
  true,
  'a newly provisioned account is forced through password change'
);
select is(
  (select count(*) from app_private.student_account_links where user_id = 'c0000000-0000-4000-8000-000000000099' and student_id = 'e2000000-0000-4000-8000-000000000099' and is_active),
  1::bigint,
  'provisioning creates exactly one active student link'
);
select is(
  (select already_provisioned from api.complete_student_account_provision(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000099',
    'c0000000-0000-4000-8000-000000000099',
    'c8000000-0000-4000-8000-000000000099'
  )),
  true,
  'exact provisioning completion is idempotent'
);
select is(
  (select count(*) from app_private.audit_events where action = 'credential.account_provisioned' and entity_id = 'e2000000-0000-4000-8000-000000000099'),
  1::bigint,
  'idempotent provisioning writes one audit event'
);
select is(
  (select already_provisioned from api.prepare_student_account_provision(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000099'
  )),
  true,
  'a later preparation resolves the existing account without another password'
);

select lives_ok(
  $$ select * from api.complete_provisioning_credential(
       'c0000000-0000-4000-8000-000000000099',
       (select credential_version from api.credential_state('c0000000-0000-4000-8000-000000000099')),
       'c8000000-0000-4000-8000-000000000099'
     ) $$,
  'the Auth password write finalizes the provisioning lease'
);
with credential as (
  select credential_version
  from api.credential_state('c0000000-0000-4000-8000-000000000099')
), claimed as (
  select claim.credential_version, claim.operation_id
  from credential,
    lateral api.begin_initial_password_change(
      'c0000000-0000-4000-8000-000000000099',
      credential.credential_version,
      'c8000000-0000-4000-8000-000000000199'
    ) claim
)
select is(
  (select completed.must_change_password
   from claimed,
     lateral api.complete_initial_password_change(
       'c0000000-0000-4000-8000-000000000099',
       claimed.credential_version,
       claimed.operation_id
     ) completed),
  false,
  'the provisioned account can complete its initial password change'
);
select is(
  (select must_change_password from api.begin_student_credential_reset(
    'd0000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000099',
    'c8000000-0000-4000-8000-000000000299'
  )),
  true,
  'credential reset closes the data gate before the Auth password is replaced'
);
select is(
  app_private.is_account_active('c0000000-0000-4000-8000-000000000099'),
  false,
  'a reset-required account is immediately blocked even with an issued JWT'
);
select is(
  (select count(*) from app_private.audit_events where action = 'credential.reset_required' and entity_id = 'e2000000-0000-4000-8000-000000000099'),
  1::bigint,
  'credential reset is audited without storing the temporary password'
);

select * from finish();
rollback;
