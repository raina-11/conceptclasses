begin;

create extension if not exists pgtap with schema extensions;
select plan(40);

insert into auth.users (id, email, encrypted_password, aud, role)
values
  ('a0000000-0000-4000-8000-000000000001', 'pipeline.uploader@example.invalid', '', 'authenticated', 'authenticated'),
  ('a0000000-0000-4000-8000-000000000002', 'pipeline.publisher@example.invalid', '', 'authenticated', 'authenticated');

insert into app_private.account_roles (user_id, role, granted_by)
values
  ('a0000000-0000-4000-8000-000000000001', 'uploader', 'a0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000002', 'publisher', 'a0000000-0000-4000-8000-000000000002');

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
select lives_ok(
  $$ select * from api.begin_import(
    'a1000000-0000-4000-8000-000000000001', 'malformed.xlsx', 4096
  ) $$,
  'uploader can reserve a generated immutable path'
);
reset role;

select set_config(
  'test.import_id',
  (
    select id::text from app_private.imports
    where client_request_id = 'a1000000-0000-4000-8000-000000000001'
  ),
  true
);
select set_config(
  'test.storage_path',
  (
    select storage_path from app_private.imports
    where client_request_id = 'a1000000-0000-4000-8000-000000000001'
  ),
  true
);

select ok(
  current_setting('test.storage_path') like 'a0000000-0000-4000-8000-000000000001/%.xlsx',
  'server-generated path is scoped to the uploader'
);

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
select lives_ok(
  format(
    'insert into storage.objects(bucket_id, name, owner_id) values (%L, %L, %L)',
    'qpt-imports',
    current_setting('test.storage_path'),
    'a0000000-0000-4000-8000-000000000001'
  ),
  'storage policy permits only the reserved uploader path'
);
reset role;

delete from app_private.account_roles
where user_id = 'a0000000-0000-4000-8000-000000000001'
  and role = 'uploader';

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
select throws_ok(
  format('select api.confirm_import_upload(%L::uuid)', current_setting('test.import_id')),
  '42501',
  'uploader role required',
  'upload confirmation rechecks a role revoked after reservation'
);
reset role;

insert into app_private.account_roles (user_id, role, granted_by)
values (
  'a0000000-0000-4000-8000-000000000001',
  'uploader',
  'a0000000-0000-4000-8000-000000000002'
);

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
select lives_ok(
  format('select api.confirm_import_upload(%L::uuid)', current_setting('test.import_id')),
  'uploader can confirm an object that exists in private storage'
);
select throws_ok(
  format('select * from api.claim_import(%L::uuid)', current_setting('test.import_id')),
  '42501',
  null,
  'browser uploader cannot claim parsing work'
);
reset role;

delete from app_private.account_roles
where user_id = 'a0000000-0000-4000-8000-000000000001'
  and role = 'uploader';

set local role service_role;
select throws_ok(
  format('select * from api.claim_import(%L::uuid)', current_setting('test.import_id')),
  '42501',
  'uploader role required',
  'trusted claim rechecks a role revoked after upload confirmation'
);
reset role;

insert into app_private.account_roles (user_id, role, granted_by)
values (
  'a0000000-0000-4000-8000-000000000001',
  'uploader',
  'a0000000-0000-4000-8000-000000000002'
);

set local role service_role;
select is(
  (
    select original_filename
    from api.claim_import(current_setting('test.import_id')::uuid)
  ),
  'malformed.xlsx',
  'trusted worker claim includes the original filename'
);
select is(
  (
    select original_filename
    from api.claim_import(current_setting('test.import_id')::uuid)
  ),
  'malformed.xlsx',
  'claim is idempotently resumable while an import is parsing'
);
reset role;

delete from app_private.account_roles
where user_id = 'a0000000-0000-4000-8000-000000000001'
  and role = 'uploader';

set local role service_role;
select throws_ok(
  format(
    'select api.complete_import_parse(%L::uuid, %L, null, %L, %L, %L::jsonb, %L::jsonb)',
    current_setting('test.import_id'),
    repeat('a', 64),
    'legacy-sheet1-v1',
    'failed',
    '{"issues":[{"code":"invalid_zip","message":"Workbook cannot be opened"}]}',
    '{"detected_format":"unknown"}'
  ),
  '42501',
  'uploader role required',
  'parse completion rechecks a role revoked after claim'
);
reset role;

insert into app_private.account_roles (user_id, role, granted_by)
values (
  'a0000000-0000-4000-8000-000000000001',
  'uploader',
  'a0000000-0000-4000-8000-000000000002'
);

set local role service_role;
select is(
  api.complete_import_parse(
    current_setting('test.import_id')::uuid,
    repeat('a', 64),
    null,
    'legacy-sheet1-v1',
    'failed',
    '{"issues":[{"code":"invalid_zip","message":"Workbook cannot be opened"}]}'::jsonb,
    '{"detected_format":"unknown"}'::jsonb
  )::text,
  'failed',
  'unparseable workbook can fail without inventing a normalized digest'
);
select is(
  api.complete_import_parse(
    current_setting('test.import_id')::uuid,
    repeat('a', 64),
    null,
    'legacy-sheet1-v1',
    'failed',
    '{"issues":[{"code":"invalid_zip","message":"Workbook cannot be opened"}]}'::jsonb,
    '{"detected_format":"unknown"}'::jsonb
  )::text,
  'failed',
  'parse completion is idempotent after a worker response retry'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
select is(
  (select requires_corrected_reupload from api.import_review(current_setting('test.import_id')::uuid)),
  true,
  'uploader receives a clear corrected-re-upload disposition'
);
reset role;

delete from app_private.account_roles
where user_id = 'a0000000-0000-4000-8000-000000000001'
  and role = 'uploader';

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
select throws_ok(
  format('select * from api.import_review(%L::uuid)', current_setting('test.import_id')),
  '42501',
  'staff role required',
  'a revoked original uploader can no longer read import review metadata'
);
reset role;

insert into app_private.account_roles (user_id, role, granted_by)
values (
  'a0000000-0000-4000-8000-000000000001',
  'uploader',
  'a0000000-0000-4000-8000-000000000002'
);

-- Prepare a successfully parsed legacy workbook without involving browser rows.
insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size, status,
  uploaded_by, upload_confirmed_at, parsing_started_at
)
values (
  'a2000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000001/legacy.xlsx',
  'legacy.xlsx',
  8192,
  'parsing',
  'a0000000-0000-4000-8000-000000000001',
  statement_timestamp(),
  statement_timestamp()
);

delete from app_private.account_roles
where user_id = 'a0000000-0000-4000-8000-000000000001'
  and role = 'uploader';

set local role service_role;
select throws_ok(
  $$ select api.commit_parsed_import(
    'a2000000-0000-4000-8000-000000000001',
    repeat('b', 64),
    repeat('c', 64),
    'legacy-sheet1-v1',
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '[]'::jsonb
  ) $$,
  '42501',
  'uploader role required',
  'atomic parse commit rechecks the uploader role immediately before mutation'
);
reset role;

insert into app_private.account_roles (user_id, role, granted_by)
values (
  'a0000000-0000-4000-8000-000000000001',
  'uploader',
  'a0000000-0000-4000-8000-000000000002'
);

set local role service_role;
select lives_ok(
  $$ select api.commit_parsed_import(
    'a2000000-0000-4000-8000-000000000001',
    repeat('b', 64),
    repeat('c', 64),
    'legacy-sheet1-v1',
    '{"assessment_code":"LEGACY-QPT-1","batch_code":"LEGACY-A"}'::jsonb,
    '{
      "row_count":1,
      "student_count":1,
      "subject_count":1,
      "subjects":[{"code":"PHYSICS","row_count":1,"max_marks":"100"}],
      "status_counts":{"present":1},
      "warnings":[{"code":"negative_score_review","message":"Confirm negative marking."}],
      "row_previews":[{"student_name":"Must never leave the private schema"}]
    }'::jsonb,
    '{
      "parser_version":"legacy-sheet1-v1",
      "template_version":"legacy-sheet1",
      "assessment_code":"LEGACY-QPT-1",
      "academic_year":"2026-27",
      "qpt_number":1,
      "batch_code":"LEGACY-A",
      "test_date":"2026-07-13",
      "display_title":"Legacy QPT 1",
      "ranking_basis":"component_score"
    }'::jsonb,
    '[{
      "roll_no":"0012",
      "student_name_for_review":"Synthetic Legacy Student",
      "subject_code":"PHYSICS",
      "max_marks":"100",
      "score":"-1.5",
      "status":"present",
      "source_rank":"3"
    }]'::jsonb
  ) $$,
  'trusted worker can stage normalized rows from the pinned legacy parser'
);
select is(
  api.commit_parsed_import(
    'a2000000-0000-4000-8000-000000000001',
    repeat('b', 64),
    repeat('c', 64),
    'legacy-sheet1-v1',
    '{"assessment_code":"LEGACY-QPT-1","batch_code":"LEGACY-A"}'::jsonb,
    '{
      "row_count":1,
      "student_count":1,
      "subject_count":1,
      "subjects":[{"code":"PHYSICS","row_count":1,"max_marks":"100"}],
      "status_counts":{"present":1},
      "warnings":[{"code":"negative_score_review","message":"Confirm negative marking."}],
      "row_previews":[{"student_name":"Must never leave the private schema"}]
    }'::jsonb,
    '{
      "parser_version":"legacy-sheet1-v1",
      "template_version":"legacy-sheet1",
      "assessment_code":"LEGACY-QPT-1",
      "academic_year":"2026-27",
      "qpt_number":1,
      "batch_code":"LEGACY-A",
      "test_date":"2026-07-13",
      "display_title":"Legacy QPT 1",
      "ranking_basis":"component_score"
    }'::jsonb,
    '[{
      "roll_no":"0012",
      "student_name_for_review":"Synthetic Legacy Student",
      "subject_code":"PHYSICS",
      "max_marks":"100",
      "score":"-1.5",
      "status":"present",
      "source_rank":"3"
    }]'::jsonb
  ),
  (
    select id from app_private.assessment_revisions
    where import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  'atomic parser commit is idempotent after a response-boundary retry'
);
reset role;

select is(
  (
    select s.score
    from app_private.student_scores s
    join app_private.assessment_revisions r on r.id = s.revision_id
    where r.import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  (-1.5)::numeric,
  'database preserves valid negative-marking scores'
);

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
select lives_ok(
  $$ select api.confirm_import_upload('a2000000-0000-4000-8000-000000000001') $$,
  'upload confirmation is idempotent after a successful terminal commit'
);
reset role;

set local role service_role;
select is(
  (
    select import_status
    from api.claim_import('a2000000-0000-4000-8000-000000000001')
  ),
  'staged',
  'a response-boundary retry discovers the terminal import without reparsing it'
);
reset role;

insert into app_private.students (id, full_name, created_by)
values (
  'a3000000-0000-4000-8000-000000000001',
  'Synthetic Bounds Student',
  'a0000000-0000-4000-8000-000000000001'
);

select throws_ok(
  $$ insert into app_private.student_scores (
       revision_id, component_id, student_id, score, status
     )
     select
       c.revision_id,
       c.id,
       'a3000000-0000-4000-8000-000000000001',
       c.max_marks + 0.0001,
       'present'
     from app_private.assessment_components c
     where c.revision_id = (
       select r.id
       from app_private.assessment_revisions r
       where r.import_id = 'a2000000-0000-4000-8000-000000000001'
     ) $$,
  '23514',
  'present score cannot exceed component maximum marks',
  'database rejects a present score above component maximum marks'
);

select lives_ok(
  $$ insert into app_private.assessments (
       assessment_code, academic_year, qpt_number, batch_id, test_date,
       display_title, created_by
     )
     select
       'LEGACY-QPT-1-CHEMISTRY', '2026-27', 1, id, date '2026-07-14',
       'Legacy QPT 1 Chemistry',
       'a0000000-0000-4000-8000-000000000001'
     from app_private.batches
     where code = 'LEGACY-A' and academic_year = '2026-27' $$,
  'separate subject or date files may coexist for the same batch and QPT number'
);

insert into app_private.batches (id, code, academic_year, display_name, created_by)
values (
  'a4000000-0000-4000-8000-000000000001',
  'LEGACY-B',
  '2026-27',
  'Legacy B',
  'a0000000-0000-4000-8000-000000000001'
);

insert into app_private.students (id, full_name, created_by)
values (
  'a3000000-0000-4000-8000-000000000002',
  'Different Synthetic Student',
  'a0000000-0000-4000-8000-000000000001'
);

select lives_ok(
  $$ insert into app_private.enrollments (
       student_id, batch_id, roll_no, created_by
     ) values (
       'a3000000-0000-4000-8000-000000000002',
       'a4000000-0000-4000-8000-000000000001',
       '0012',
       'a0000000-0000-4000-8000-000000000001'
     ) $$,
  'the same roll number may identify a different student in another batch'
);

select is(
  (
    select count(*)
    from app_private.enrollments
    where roll_no = '0012'
      and batch_id in (
        select id
        from app_private.batches
        where (code, academic_year) in (
          ('LEGACY-A', '2026-27'),
          ('LEGACY-B', '2026-27')
        )
      )
  ),
  2::bigint,
  'roll identity is scoped by enrollment rather than globally merged'
);

select throws_ok(
  $$ insert into app_private.enrollments (
       student_id, batch_id, roll_no, created_by
     ) values (
       'a3000000-0000-4000-8000-000000000001',
       (select id from app_private.batches where code = 'LEGACY-A' and academic_year = '2026-27'),
       '0012',
       'a0000000-0000-4000-8000-000000000001'
     ) $$,
  '23505',
  null,
  'a roll number remains unique within one batch enrollment'
);

select is(
  (
    select count(*)
    from app_private.students s
    join app_private.enrollments e on e.student_id = s.id
    where e.roll_no = '0012'
      and e.batch_id in (
        select id
        from app_private.batches
        where (code, academic_year) in (
          ('LEGACY-A', '2026-27'),
          ('LEGACY-B', '2026-27')
        )
      )
  ),
  2::bigint,
  'conflicting names on a reused cross-batch roll remain separate students'
);

select lives_ok(
  $$ insert into app_private.batches (code, academic_year, display_name, created_by)
     values (
       'LEGACY-A', '2027-28', 'Legacy A next year',
       'a0000000-0000-4000-8000-000000000001'
     ) $$,
  'a batch code may recur in a different academic year'
);

select throws_ok(
  $$ insert into app_private.batches (code, academic_year, display_name, created_by)
     values (
       'LEGACY-A', '2026-27', 'Duplicate same-year batch',
       'a0000000-0000-4000-8000-000000000001'
     ) $$,
  '23505',
  null,
  'a batch code remains unique within its academic year'
);

-- Raw workbook hashes are deliberately non-unique; normalized payloads drive dedupe.
insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size, status,
  uploaded_by, upload_confirmed_at, parsing_started_at
)
values (
  'a2000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000001/duplicate.xlsx',
  'duplicate.xlsx',
  8192,
  'parsing',
  'a0000000-0000-4000-8000-000000000001',
  statement_timestamp(),
  statement_timestamp()
);

set local role service_role;
select is(
  api.complete_import_parse(
    'a2000000-0000-4000-8000-000000000002',
    repeat('b', 64),
    repeat('c', 64),
    'legacy-sheet1-v1',
    'parsed',
    null,
    '{"assessment_code":"LEGACY-QPT-1"}'::jsonb
  )::text,
  'duplicate',
  'normalized payload plus parser version deduplicates a re-export'
);
reset role;

select is(
  (
    select duplicate_of_import_id
    from app_private.imports
    where id = 'a2000000-0000-4000-8000-000000000002'
  ),
  'a2000000-0000-4000-8000-000000000001'::uuid,
  'duplicate import points to the canonical prior import'
);

select is(
  (
    select count(distinct raw_sha256)
    from app_private.imports
    where id in (
      'a2000000-0000-4000-8000-000000000001',
      'a2000000-0000-4000-8000-000000000002'
    )
  ),
  1::bigint,
  'identical raw hashes are allowed and are not the uniqueness key'
);

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000002';
select is(
  (
    select count(*)
    from api.pending_revisions()
    where import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'publisher can review the staged legacy revision'
);
select is(
  (
    select can_publish
    from api.pending_revisions()
    where import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  true,
  'independent publisher is allowed to publish the staged revision'
);
select is(
  (
    select active_revision_id
    from api.pending_revisions()
    where import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  null::uuid,
  'publisher review exposes the null compare-and-swap value before first publication'
);
select is(
  (
    select is_latest_revision
    from api.pending_revisions()
    where import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  true,
  'publisher review marks the newest staged revision'
);
select is(
  (
    select revision_number
    from api.pending_revisions()
    where import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  1,
  'publisher review exposes the immutable revision number'
);
select is(
  (
    select subject_summaries
    from api.pending_revisions()
    where import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  '[{"code":"PHYSICS","row_count":1,"max_marks":"100"}]'::jsonb,
  'publisher review exposes only the stored subject summary'
);
select is(
  (
    select status_counts
    from api.pending_revisions()
    where import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  '{"present":1}'::jsonb,
  'publisher review exposes aggregate row statuses'
);
select is(
  (
    select warnings
    from api.pending_revisions()
    where import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  '[{"code":"negative_score_review","message":"Confirm negative marking."}]'::jsonb,
  'publisher review exposes sanitized warnings for acknowledgement'
);
select ok(
  (
    select to_jsonb(p)::text not like '%Must never leave%'
    from api.pending_revisions() p
    where p.import_id = 'a2000000-0000-4000-8000-000000000001'
  ),
  'publisher queue never returns row-level preview data'
);
reset role;

select * from finish();
rollback;
