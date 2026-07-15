begin;

create extension if not exists pgtap with schema extensions;
select plan(33);

-- Every identity and result in this file is synthetic.
insert into auth.users (id, email, encrypted_password, aud, role)
values
  ('10000000-0000-4000-8000-000000000001', 'student.one@example.invalid', '', 'authenticated', 'authenticated'),
  ('10000000-0000-4000-8000-000000000002', 'student.two@example.invalid', '', 'authenticated', 'authenticated'),
  ('10000000-0000-4000-8000-000000000003', 'guardian.one@example.invalid', '', 'authenticated', 'authenticated'),
  ('10000000-0000-4000-8000-000000000004', 'guardian.two@example.invalid', '', 'authenticated', 'authenticated'),
  ('20000000-0000-4000-8000-000000000001', 'uploader@example.invalid', '', 'authenticated', 'authenticated'),
  ('30000000-0000-4000-8000-000000000001', 'publisher@example.invalid', '', 'authenticated', 'authenticated'),
  ('40000000-0000-4000-8000-000000000001', 'admin@example.invalid', '', 'authenticated', 'authenticated');

insert into app_private.account_roles (user_id, role, granted_by)
values
  ('20000000-0000-4000-8000-000000000001', 'uploader', '40000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000001', 'publisher', '40000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000001', 'admin', '40000000-0000-4000-8000-000000000001');

insert into app_private.batches (id, code, academic_year, display_name, created_by)
values ('50000000-0000-4000-8000-000000000001', 'BATCH-A', '2026-27', 'Batch A', '40000000-0000-4000-8000-000000000001');

insert into app_private.students (id, full_name, created_by)
values
  ('60000000-0000-4000-8000-000000000001', 'Synthetic Student One', '40000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000002', 'Synthetic Student Two', '40000000-0000-4000-8000-000000000001');

insert into app_private.enrollments (student_id, batch_id, roll_no, created_by)
values
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '0012', '40000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', '0013', '40000000-0000-4000-8000-000000000001');

insert into app_private.student_account_links (user_id, student_id, linked_by)
values
  ('10000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001');

insert into app_private.student_account_links (user_id, student_id, relationship, linked_by)
values
  ('10000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001', 'guardian', '40000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000002', 'guardian', '40000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000001', 'guardian', '40000000-0000-4000-8000-000000000001');

insert into app_private.subjects (id, code, display_name, created_by)
values ('70000000-0000-4000-8000-000000000001', 'PHYSICS', 'Physics', '40000000-0000-4000-8000-000000000001');

insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size, raw_sha256,
  normalized_hash, parser_version, status, uploaded_by, row_count, staged_at,
  validation_summary
)
values (
  '80000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001/qpt-1.xlsx',
  'qpt-1.xlsx', 1024, repeat('a', 64), repeat('c', 64), 'canonical-v1', 'staged',
  '20000000-0000-4000-8000-000000000001', 2, statement_timestamp(),
  '{
    "subjects":[{"code":"PHYSICS","row_count":2,"max_marks":"100"}],
    "status_counts":{"present":2},
    "warnings":[{"code":"synthetic_warning","message":"Review the synthetic fixture."}],
    "row_previews":[{"student_name":"Must never leave the private schema"}]
  }'::jsonb
);

insert into app_private.assessments (
  id, assessment_code, academic_year, qpt_number, batch_id, test_date, display_title, created_by
)
values (
  '90000000-0000-4000-8000-000000000001', 'QPT-2026-001', '2026-27', 1,
  '50000000-0000-4000-8000-000000000001', date '2026-07-13', 'QPT 1',
  '20000000-0000-4000-8000-000000000001'
);

insert into app_private.assessment_revisions (
  id, assessment_id, revision_number, import_id, ranking_basis, status, created_by
)
values (
  '91000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 1,
  '80000000-0000-4000-8000-000000000001', 'component_score', 'staged',
  '20000000-0000-4000-8000-000000000001'
);

insert into app_private.assessment_components (id, revision_id, subject_id, max_marks, sort_order)
values ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 100, 1);

insert into app_private.student_scores (revision_id, component_id, student_id, score, status, source_rank)
values
  ('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 80, 'present', 1),
  ('91000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002', 70, 'present', 2);

-- Nothing is visible before a revision is published.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select is((select count(*) from api.student_results('60000000-0000-4000-8000-000000000001', null)), 0::bigint, 'staged results are hidden');
reset role;

-- An uploader cannot publish, even when they created the revision.
set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000001';
select throws_ok(
  $$ select api.publish_revision('91000000-0000-4000-8000-000000000001', null) $$,
  '42501',
  'publisher role required',
  'uploader cannot publish'
);
reset role;

-- A different publisher may publish it.
set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000001';
select is(
  (
    select count(*)
    from api.pending_revisions()
    where revision_id = '91000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'publisher can review the staged revision'
);
select lives_ok(
  $$ select api.publish_revision('91000000-0000-4000-8000-000000000001', null) $$,
  'independent publisher can publish'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select is((select count(*) from api.student_results('60000000-0000-4000-8000-000000000001', null)), 1::bigint, 'student sees one published component');
select is((select score from api.student_results('60000000-0000-4000-8000-000000000001', null)), 80::numeric, 'student sees their own score');
select is((select roll_no from api.student_results('60000000-0000-4000-8000-000000000001', null)), '0012', 'leading-zero roll number is preserved');
select is((select count(*) from api.student_results('60000000-0000-4000-8000-000000000001', 'CHEMISTRY')), 0::bigint, 'subject filter is enforced');
select is((select count(*) from api.student_results('60000000-0000-4000-8000-000000000002', null)), 0::bigint, 'student cannot request an unlinked student');
reset role;

update app_private.user_accounts
set status = 'suspended', status_reason = 'Synthetic security test'
where user_id = '10000000-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select is(
  (select count(*) from api.student_results('60000000-0000-4000-8000-000000000001', null)),
  0::bigint,
  'account deactivation immediately blocks an already-issued JWT'
);
reset role;

update app_private.user_accounts
set status = 'active', status_reason = null
where user_id = '10000000-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
select is((select score from api.student_results('60000000-0000-4000-8000-000000000002', null)), 70::numeric, 'second student sees only their own score');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000003';
select is((select count(*) from api.my_students()), 2::bigint, 'one verified guardian account can select two linked students');
select is((select score from api.student_results('60000000-0000-4000-8000-000000000001', null)), 80::numeric, 'guardian can read the first linked student');
select is((select score from api.student_results('60000000-0000-4000-8000-000000000002', null)), 70::numeric, 'guardian can read the second linked student');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000004';
select is((select count(*) from api.my_students()), 1::bigint, 'a student may have a second independently verified guardian');
reset role;

-- Publishing a correction supersedes, rather than duplicates, the active result.
insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size, raw_sha256,
  normalized_hash, parser_version, status, uploaded_by, row_count, staged_at,
  validation_summary
)
values (
  '80000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000001/qpt-1-corrected.xlsx',
  'qpt-1-corrected.xlsx', 1024, repeat('b', 64), repeat('d', 64), 'canonical-v1', 'staged',
  '20000000-0000-4000-8000-000000000001', 2, statement_timestamp(),
  '{
    "subjects":[{"code":"PHYSICS","row_count":2,"max_marks":"100"}],
    "status_counts":{"present":2},
    "warnings":[]
  }'::jsonb
);

insert into app_private.assessment_revisions (
  id, assessment_id, revision_number, import_id, ranking_basis, status, created_by
)
values (
  '91000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000001', 2,
  '80000000-0000-4000-8000-000000000002', 'component_score', 'staged',
  '20000000-0000-4000-8000-000000000001'
);

insert into app_private.assessment_components (id, revision_id, subject_id, max_marks, sort_order)
values ('92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', 100, 1);

insert into app_private.student_scores (revision_id, component_id, student_id, score, status, source_rank)
values
  ('91000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', 90, 'present', 1),
  ('91000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', 75, 'present', 2);

set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000001';
select lives_ok(
  $$ select api.publish_revision(
    '91000000-0000-4000-8000-000000000002',
    '91000000-0000-4000-8000-000000000001'
  ) $$,
  'publisher can publish corrected revision'
);
reset role;

select is(
  (select count(*) from app_private.publications where assessment_id = '90000000-0000-4000-8000-000000000001' and superseded_at is null),
  1::bigint,
  'only one publication is active per assessment'
);

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select is((select count(*) from api.student_results('60000000-0000-4000-8000-000000000001', null)), 1::bigint, 'correction does not duplicate result rows');
select is((select score from api.student_results('60000000-0000-4000-8000-000000000001', null)), 90::numeric, 'active result uses corrected revision');
select throws_ok(
  $$ select count(*) from app_private.student_scores $$,
  '42501',
  null,
  'student cannot query private tables directly'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000001';
select is(
  (select count(*) from api.publication_history('90000000-0000-4000-8000-000000000001')),
  2::bigint,
  'publisher can inspect immutable publication history'
);
select lives_ok(
  $$ select api.restore_revision(
    '91000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000002'
  ) $$,
  'publisher can restore a prior independently uploaded revision'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select is(
  (select score from api.student_results('60000000-0000-4000-8000-000000000001', null)),
  80::numeric,
  'student result atomically returns to the restored revision'
);
reset role;

-- Registration follows storage ownership and role boundaries.
set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000001';
select lives_ok(
  $$ select * from api.begin_import(
    '82000000-0000-4000-8000-000000000001', 'new.xlsx', 2048
  ) $$,
  'uploader can begin an import without supplying a trusted hash or path'
);
select is(
  (select import_id from api.begin_import('82000000-0000-4000-8000-000000000001', 'new.xlsx', 2048)),
  (select import_id from api.begin_import('82000000-0000-4000-8000-000000000001', 'new.xlsx', 2048)),
  'begin import is idempotent for a client request id'
);
select throws_ok(
  $$ select api.stage_qpt_import(
    '80000000-0000-4000-8000-000000000001',
    '{"template_version":"canonical-v1"}'::jsonb,
    '[]'::jsonb
  ) $$,
  '42501',
  null,
  'browser uploader cannot forge parsed score rows'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000001';
select throws_ok(
  $$ select * from api.begin_import(
    '82000000-0000-4000-8000-000000000002', 'publisher.xlsx', 2048
  ) $$,
  '42501',
  'uploader role required',
  'publisher cannot register imports'
);
reset role;

select is(
  (
    select count(*)
    from app_private.audit_events
    where action = 'revision.published'
      and entity_id in (
        '91000000-0000-4000-8000-000000000001',
        '91000000-0000-4000-8000-000000000002'
      )
  ),
  2::bigint,
  'each publication creates an audit event'
);

select is(
  (
    select count(*)
    from app_private.audit_events
    where action = 'import.begun'
      and entity_id = (
        select id from app_private.imports
        where client_request_id = '82000000-0000-4000-8000-000000000001'
      )
  ),
  1::bigint,
  'import registration creates an audit event'
);

select is(
  (
    select count(*)
    from app_private.audit_events
    where action = 'revision.restored'
      and entity_id = '91000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'restore creates a dedicated audit event'
);

set local role service_role;
select throws_ok(
  $$ update app_private.audit_events set action = 'tampered' where id = (select min(id) from app_private.audit_events) $$,
  '55000',
  'audit events are append-only',
  'service role cannot alter audit history'
);
select throws_ok(
  $$ delete from app_private.audit_events where id = (select min(id) from app_private.audit_events) $$,
  '55000',
  'audit events are append-only',
  'service role cannot delete audit history'
);
reset role;

select throws_ok(
  $$ truncate table app_private.audit_events $$,
  '55000',
  'audit events are append-only',
  'audit history rejects truncation even by a privileged role'
);

select * from finish();
rollback;
