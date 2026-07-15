begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

select has_function(
  'api',
  'student_result_insights',
  array['uuid'],
  'privacy-safe student insight RPC exists'
);
select is(
  pg_get_function_result('api.student_result_insights(uuid)'::regprocedure),
  'TABLE(assessment_id uuid, qpt_number integer, display_title text, test_date date, subject_code text, subject_name text, max_marks numeric, student_score numeric, status text, rank bigint, cohort_highest_score numeric, cohort_average_score numeric, participant_count bigint)',
  'insight RPC exposes only assessment, own-result, and aggregate fields'
);
select is(
  has_function_privilege('authenticated', 'api.student_result_insights(uuid)', 'EXECUTE'),
  true,
  'authenticated users can execute the insight RPC'
);
select is(
  has_function_privilege('service_role', 'api.student_result_insights(uuid)', 'EXECUTE'),
  true,
  'trusted services retain the same insight RPC access as student results'
);
select is(
  has_function_privilege('anon', 'api.student_result_insights(uuid)', 'EXECUTE'),
  false,
  'anonymous users cannot execute the insight RPC'
);

-- Every identity and result below is synthetic.
insert into auth.users (id, email, encrypted_password, aud, role)
values
  ('da000000-0000-4000-8000-000000000001', 'insights.admin@example.invalid', '', 'authenticated', 'authenticated'),
  ('da100000-0000-4000-8000-000000000001', 'student.insight-1001@login.concept.invalid', '', 'authenticated', 'authenticated'),
  ('da100000-0000-4000-8000-000000000002', 'student.insight-1002@login.concept.invalid', '', 'authenticated', 'authenticated');

insert into app_private.account_roles (user_id, role, granted_by)
values (
  'da000000-0000-4000-8000-000000000001',
  'admin',
  'da000000-0000-4000-8000-000000000001'
);

insert into app_private.batches (id, code, academic_year, display_name, created_by)
values
  (
    'db000000-0000-4000-8000-000000000001',
    'INSIGHT-A',
    '2096-97',
    'Synthetic Insight Batch A',
    'da000000-0000-4000-8000-000000000001'
  ),
  (
    'db000000-0000-4000-8000-000000000002',
    'INSIGHT-B',
    '2096-97',
    'Synthetic Insight Batch B',
    'da000000-0000-4000-8000-000000000001'
  );

insert into app_private.students (id, full_name, created_by)
values
  ('dc000000-0000-4000-8000-000000000001', 'Synthetic Insight Target', 'da000000-0000-4000-8000-000000000001'),
  ('dc000000-0000-4000-8000-000000000002', 'Synthetic Insight Peer', 'da000000-0000-4000-8000-000000000001'),
  ('dc000000-0000-4000-8000-000000000003', 'Synthetic Insight Absent Peer', 'da000000-0000-4000-8000-000000000001'),
  ('dc000000-0000-4000-8000-000000000004', 'Synthetic Other Batch Student', 'da000000-0000-4000-8000-000000000001');

insert into app_private.enrollments (student_id, batch_id, roll_no, created_by)
values
  ('dc000000-0000-4000-8000-000000000001', 'db000000-0000-4000-8000-000000000001', 'INSIGHT-1001', 'da000000-0000-4000-8000-000000000001'),
  ('dc000000-0000-4000-8000-000000000002', 'db000000-0000-4000-8000-000000000001', 'INSIGHT-1002', 'da000000-0000-4000-8000-000000000001'),
  ('dc000000-0000-4000-8000-000000000003', 'db000000-0000-4000-8000-000000000001', 'INSIGHT-1003', 'da000000-0000-4000-8000-000000000001'),
  ('dc000000-0000-4000-8000-000000000004', 'db000000-0000-4000-8000-000000000002', 'INSIGHT-2001', 'da000000-0000-4000-8000-000000000001');

insert into app_private.student_account_links (user_id, student_id, linked_by)
values
  ('da100000-0000-4000-8000-000000000001', 'dc000000-0000-4000-8000-000000000001', 'da000000-0000-4000-8000-000000000001'),
  ('da100000-0000-4000-8000-000000000002', 'dc000000-0000-4000-8000-000000000002', 'da000000-0000-4000-8000-000000000001');

update app_private.user_accounts
set login_id = case user_id
  when 'da100000-0000-4000-8000-000000000001' then 'insight-1001'
  else 'insight-1002'
end
where user_id in (
  'da100000-0000-4000-8000-000000000001',
  'da100000-0000-4000-8000-000000000002'
);

insert into auth.sessions (id, user_id, created_at, updated_at)
values
  ('da200000-0000-4000-8000-000000000001', 'da100000-0000-4000-8000-000000000001', statement_timestamp(), statement_timestamp()),
  ('da200000-0000-4000-8000-000000000002', 'da100000-0000-4000-8000-000000000002', statement_timestamp(), statement_timestamp());

insert into app_private.subjects (id, code, display_name, created_by)
values (
  'dd000000-0000-4000-8000-000000000001',
  'INSIGHT-SCIENCE',
  'Synthetic Insight Science',
  'da000000-0000-4000-8000-000000000001'
);

insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size,
  raw_sha256, normalized_hash, parser_version, status, uploaded_by,
  row_count, staged_at, validation_summary
)
values
  (
    'de000000-0000-4000-8000-000000000001', 'de100000-0000-4000-8000-000000000001',
    'da000000-0000-4000-8000-000000000001/insight-old.xlsx', 'insight-old.xlsx', 1024,
    repeat('1', 64), repeat('2', 64), 'canonical-v1', 'published',
    'da000000-0000-4000-8000-000000000001', 4, statement_timestamp(), '{}'
  ),
  (
    'de000000-0000-4000-8000-000000000002', 'de100000-0000-4000-8000-000000000002',
    'da000000-0000-4000-8000-000000000001/insight-current.xlsx', 'insight-current.xlsx', 1024,
    repeat('3', 64), repeat('4', 64), 'canonical-v1', 'published',
    'da000000-0000-4000-8000-000000000001', 4, statement_timestamp(), '{}'
  ),
  (
    'de000000-0000-4000-8000-000000000003', 'de100000-0000-4000-8000-000000000003',
    'da000000-0000-4000-8000-000000000001/insight-staged.xlsx', 'insight-staged.xlsx', 1024,
    repeat('5', 64), repeat('6', 64), 'canonical-v1', 'staged',
    'da000000-0000-4000-8000-000000000001', 1, statement_timestamp(), '{}'
  );

insert into app_private.assessments (
  id, assessment_code, academic_year, qpt_number, batch_id,
  test_date, display_title, created_by
)
values
  (
    'df000000-0000-4000-8000-000000000001', 'INSIGHT-QPT-1', '2096-97', 1,
    'db000000-0000-4000-8000-000000000001', date '2096-07-13',
    'Synthetic QPT 1', 'da000000-0000-4000-8000-000000000001'
  ),
  (
    'df000000-0000-4000-8000-000000000002', 'INSIGHT-QPT-2', '2096-97', 2,
    'db000000-0000-4000-8000-000000000001', date '2096-07-20',
    'Synthetic Unpublished QPT', 'da000000-0000-4000-8000-000000000001'
  );

insert into app_private.assessment_revisions (
  id, assessment_id, revision_number, import_id, ranking_basis, status, created_by
)
values
  (
    'd1000000-0000-4000-8000-000000000001', 'df000000-0000-4000-8000-000000000001', 1,
    'de000000-0000-4000-8000-000000000001', 'component_score', 'superseded',
    'da000000-0000-4000-8000-000000000001'
  ),
  (
    'd1000000-0000-4000-8000-000000000002', 'df000000-0000-4000-8000-000000000001', 2,
    'de000000-0000-4000-8000-000000000002', 'component_score', 'published',
    'da000000-0000-4000-8000-000000000001'
  ),
  (
    'd1000000-0000-4000-8000-000000000003', 'df000000-0000-4000-8000-000000000002', 1,
    'de000000-0000-4000-8000-000000000003', 'component_score', 'staged',
    'da000000-0000-4000-8000-000000000001'
  );

insert into app_private.assessment_components (id, revision_id, subject_id, max_marks, sort_order)
values
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'dd000000-0000-4000-8000-000000000001', 100, 1),
  ('d2000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002', 'dd000000-0000-4000-8000-000000000001', 100, 1),
  ('d2000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003', 'dd000000-0000-4000-8000-000000000001', 100, 1);

insert into app_private.student_scores (
  revision_id, component_id, student_id, score, status, source_rank
)
values
  ('d1000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'dc000000-0000-4000-8000-000000000001', 70, 'present', 2),
  ('d1000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'dc000000-0000-4000-8000-000000000002', 99, 'present', 1),
  ('d1000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000002', 'dc000000-0000-4000-8000-000000000001', 80, 'present', 2),
  ('d1000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000002', 'dc000000-0000-4000-8000-000000000002', 95, 'present', 1),
  ('d1000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000002', 'dc000000-0000-4000-8000-000000000003', null, 'absent', null),
  -- A malformed cross-batch score must never influence this batch's metrics.
  ('d1000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000002', 'dc000000-0000-4000-8000-000000000004', 100, 'present', 1),
  ('d1000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000003', 'dc000000-0000-4000-8000-000000000001', 100, 'present', 1);

insert into app_private.publications (
  assessment_id, revision_id, published_by, published_at, superseded_at, superseded_by
)
values
  (
    'df000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    'da000000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 day',
    statement_timestamp(), 'da000000-0000-4000-8000-000000000001'
  ),
  (
    'df000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002',
    'da000000-0000-4000-8000-000000000001', statement_timestamp(), null, null
  );

set local role authenticated;
set local request.jwt.claims = '{"sub":"da100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"da200000-0000-4000-8000-000000000001"}';

select is(
  (select count(*) from api.student_result_insights('dc000000-0000-4000-8000-000000000001')),
  1::bigint,
  'student sees one current published component'
);
select is((select assessment_id from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 'df000000-0000-4000-8000-000000000001'::uuid, 'current published assessment is returned');
select is((select qpt_number from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 1, 'QPT number is returned');
select is((select display_title from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 'Synthetic QPT 1', 'assessment title is returned');
select is((select test_date from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), date '2096-07-13', 'assessment date is returned');
select is((select subject_code from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 'INSIGHT-SCIENCE', 'subject code is returned');
select is((select subject_name from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 'Synthetic Insight Science', 'subject name is returned');
select is((select max_marks from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 100::numeric, 'component maximum is returned');
select is((select student_score from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 80::numeric, 'only the student own score is returned');
select is((select status from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 'present', 'student status is returned');
select is((select rank from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 2::bigint, 'student rank is returned');
select is((select cohort_highest_score from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 95::numeric, 'highest score uses present students in the assessment batch only');
select is((select cohort_average_score from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 87.50::numeric, 'average score uses present numeric scores only');
select is((select participant_count from api.student_result_insights('dc000000-0000-4000-8000-000000000001')), 2::bigint, 'participant count excludes absent and cross-batch rows');
select is(
  (
    select count(*)
    from api.student_result_insights('dc000000-0000-4000-8000-000000000001') insights
    where insights.assessment_id = 'df000000-0000-4000-8000-000000000002'
  ),
  0::bigint,
  'unpublished revisions are excluded'
);

set local request.jwt.claims = '{"sub":"da100000-0000-4000-8000-000000000002","role":"authenticated","session_id":"da200000-0000-4000-8000-000000000002"}';
select is(
  (select count(*) from api.student_result_insights('dc000000-0000-4000-8000-000000000001')),
  0::bigint,
  'a student cannot request insights for an unlinked student'
);

set local request.jwt.claims = '{"sub":"da100000-0000-4000-8000-000000000001","role":"authenticated"}';
select is(
  (select count(*) from api.student_result_insights('dc000000-0000-4000-8000-000000000001')),
  0::bigint,
  'a signed JWT without a live session id cannot read insights'
);

set local request.jwt.claims = '{"sub":"da100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"da200000-0000-4000-8000-000000000002"}';
select is(
  (select count(*) from api.student_result_insights('dc000000-0000-4000-8000-000000000001')),
  0::bigint,
  'a session belonging to another user cannot read insights'
);
reset role;

update app_private.user_accounts
set must_change_password = true
where user_id = 'da100000-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claims = '{"sub":"da100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"da200000-0000-4000-8000-000000000001"}';
select is(
  (select count(*) from api.student_result_insights('dc000000-0000-4000-8000-000000000001')),
  0::bigint,
  'temporary-password sessions cannot read insights'
);
reset role;

update app_private.user_accounts
set must_change_password = false, status = 'suspended', status_reason = 'Synthetic insight security test'
where user_id = 'da100000-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claims = '{"sub":"da100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"da200000-0000-4000-8000-000000000001"}';
select is(
  (select count(*) from api.student_result_insights('dc000000-0000-4000-8000-000000000001')),
  0::bigint,
  'suspended student accounts cannot read insights'
);
reset role;

update app_private.user_accounts
set status = 'active', status_reason = null
where user_id = 'da100000-0000-4000-8000-000000000001';

set local role authenticated;
set local request.jwt.claims = '{"sub":"da100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"da200000-0000-4000-8000-000000000001"}';
select throws_ok(
  $$ select * from app_private.student_scores $$,
  '42501',
  null,
  'student cannot inspect raw cohort score rows or identities'
);

select * from finish();
rollback;
