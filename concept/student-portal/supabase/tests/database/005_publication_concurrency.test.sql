begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, email, encrypted_password, aud, role)
values
  ('b0000000-0000-4000-8000-000000000001', 'cas.uploader@example.invalid', '', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-000000000002', 'cas.publisher@example.invalid', '', 'authenticated', 'authenticated');

insert into app_private.account_roles (user_id, role, granted_by)
values
  ('b0000000-0000-4000-8000-000000000001', 'uploader', 'b0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000002', 'publisher', 'b0000000-0000-4000-8000-000000000002');

insert into app_private.batches (id, code, academic_year, display_name, created_by)
values (
  'b1000000-0000-4000-8000-000000000001',
  'CAS-A',
  '2026-27',
  'CAS Batch A',
  'b0000000-0000-4000-8000-000000000001'
);

insert into app_private.assessments (
  id, assessment_code, academic_year, qpt_number, batch_id, test_date,
  display_title, created_by
)
values (
  'b2000000-0000-4000-8000-000000000001',
  'CAS-QPT-1',
  '2026-27',
  1,
  'b1000000-0000-4000-8000-000000000001',
  date '2026-07-13',
  'CAS QPT 1',
  'b0000000-0000-4000-8000-000000000001'
);

insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size, raw_sha256,
  normalized_hash, parser_version, status, uploaded_by, row_count, staged_at,
  validation_summary
)
values (
  'b3000000-0000-4000-8000-000000000001',
  'b3100000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001/cas-1.xlsx',
  'cas-1.xlsx',
  1024,
  repeat('1', 64),
  repeat('a', 64),
  'canonical-v1',
  'staged',
  'b0000000-0000-4000-8000-000000000001',
  1,
  statement_timestamp(),
  '{"subjects":[],"status_counts":{},"warnings":[]}'::jsonb
);

insert into app_private.assessment_revisions (
  id, assessment_id, revision_number, import_id, ranking_basis, status, created_by
)
values (
  'b4000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000001',
  1,
  'b3000000-0000-4000-8000-000000000001',
  'component_score',
  'staged',
  'b0000000-0000-4000-8000-000000000001'
);

set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-4000-8000-000000000002';
select lives_ok(
  $$ select api.publish_revision('b4000000-0000-4000-8000-000000000001', null) $$,
  'first publication succeeds only against an explicitly empty active revision'
);
reset role;

insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size, raw_sha256,
  normalized_hash, parser_version, status, uploaded_by, row_count, staged_at,
  validation_summary
)
values
  (
    'b3000000-0000-4000-8000-000000000002',
    'b3100000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000001/cas-2.xlsx',
    'cas-2.xlsx', 1024, repeat('2', 64), repeat('b', 64), 'canonical-v1',
    'staged', 'b0000000-0000-4000-8000-000000000001', 1,
    statement_timestamp(), '{"subjects":[],"status_counts":{},"warnings":[]}'::jsonb
  ),
  (
    'b3000000-0000-4000-8000-000000000003',
    'b3100000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000001/cas-3.xlsx',
    'cas-3.xlsx', 1024, repeat('3', 64), repeat('c', 64), 'canonical-v1',
    'staged', 'b0000000-0000-4000-8000-000000000001', 1,
    statement_timestamp(), '{"subjects":[],"status_counts":{},"warnings":[]}'::jsonb
  );

insert into app_private.assessment_revisions (
  id, assessment_id, revision_number, import_id, ranking_basis, status, created_by
)
values
  (
    'b4000000-0000-4000-8000-000000000002',
    'b2000000-0000-4000-8000-000000000001', 2,
    'b3000000-0000-4000-8000-000000000002', 'component_score', 'staged',
    'b0000000-0000-4000-8000-000000000001'
  ),
  (
    'b4000000-0000-4000-8000-000000000003',
    'b2000000-0000-4000-8000-000000000001', 3,
    'b3000000-0000-4000-8000-000000000003', 'component_score', 'staged',
    'b0000000-0000-4000-8000-000000000001'
  );

set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-4000-8000-000000000002';
select is(
  (
    select count(*)
    from api.pending_revisions()
    where revision_id in (
      'b4000000-0000-4000-8000-000000000002',
      'b4000000-0000-4000-8000-000000000003'
    )
  ),
  2::bigint,
  'publisher queue keeps both staged revisions visible for review'
);
select is(
  (
    select active_revision_id
    from api.pending_revisions()
    where revision_id = 'b4000000-0000-4000-8000-000000000003'
  ),
  'b4000000-0000-4000-8000-000000000001'::uuid,
  'publisher queue supplies the active revision compare-and-swap value'
);
select is(
  (
    select is_latest_revision
    from api.pending_revisions()
    where revision_id = 'b4000000-0000-4000-8000-000000000002'
  ),
  false,
  'an older staged correction is marked stale'
);
select is(
  (
    select can_publish
    from api.pending_revisions()
    where revision_id = 'b4000000-0000-4000-8000-000000000002'
  ),
  false,
  'an older staged correction cannot be published'
);
select is(
  (
    select can_publish
    from api.pending_revisions()
    where revision_id = 'b4000000-0000-4000-8000-000000000003'
  ),
  true,
  'the latest independently uploaded correction can be published'
);
select throws_ok(
  $$ select api.publish_revision(
    'b4000000-0000-4000-8000-000000000002',
    'b4000000-0000-4000-8000-000000000001'
  ) $$,
  '55000',
  'only the latest staged revision can be published',
  'the database rejects an older staged correction'
);
select throws_ok(
  $$ select api.publish_revision('b4000000-0000-4000-8000-000000000003', null) $$,
  '55000',
  'active publication changed; refresh before publishing',
  'a stale publisher review cannot overwrite the active publication'
);
select lives_ok(
  $$ select api.publish_revision(
    'b4000000-0000-4000-8000-000000000003',
    'b4000000-0000-4000-8000-000000000001'
  ) $$,
  'the latest correction publishes with a matching active revision'
);
reset role;

select is(
  (
    select status::text
    from app_private.assessment_revisions
    where id = 'b4000000-0000-4000-8000-000000000002'
  ),
  'superseded',
  'publishing the newest correction retires older staged revisions'
);

set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-4000-8000-000000000002';
select is(
  (
    select count(*)
    from api.pending_revisions()
    where assessment_code = 'CAS-QPT-1'
  ),
  0::bigint,
  'retired stale revisions leave the publisher queue'
);
reset role;

insert into app_private.imports (
  id, client_request_id, storage_path, original_filename, byte_size, raw_sha256,
  normalized_hash, parser_version, status, uploaded_by, staged_at
)
values (
  'b3000000-0000-4000-8000-000000000004',
  'b3100000-0000-4000-8000-000000000004',
  'b0000000-0000-4000-8000-000000000001/cas-4.xlsx',
  'cas-4.xlsx', 1024, repeat('4', 64), repeat('d', 64), 'canonical-v1',
  'staged', 'b0000000-0000-4000-8000-000000000001', statement_timestamp()
);

insert into app_private.assessment_revisions (
  id, assessment_id, revision_number, import_id, ranking_basis, status, created_by
)
values (
  'b4000000-0000-4000-8000-000000000004',
  'b2000000-0000-4000-8000-000000000001', 4,
  'b3000000-0000-4000-8000-000000000004', 'component_score', 'staged',
  'b0000000-0000-4000-8000-000000000001'
);

set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-4000-8000-000000000002';
select throws_ok(
  $$ select api.restore_revision(
    'b4000000-0000-4000-8000-000000000001',
    'b4000000-0000-4000-8000-000000000003'
  ) $$,
  '55000',
  'pending staged revision must be resolved before restore',
  'restore cannot bypass a pending staged correction'
);
reset role;

delete from app_private.assessment_revisions
where id = 'b4000000-0000-4000-8000-000000000004';
delete from app_private.imports
where id = 'b3000000-0000-4000-8000-000000000004';

set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-4000-8000-000000000002';
select throws_ok(
  $$ select api.restore_revision(
    'b4000000-0000-4000-8000-000000000001',
    'b4000000-0000-4000-8000-000000000001'
  ) $$,
  '55000',
  'active publication changed; refresh before restoring',
  'restore rejects a stale expected active revision'
);
select lives_ok(
  $$ select api.restore_revision(
    'b4000000-0000-4000-8000-000000000001',
    'b4000000-0000-4000-8000-000000000003'
  ) $$,
  'restore succeeds with the current active revision and no pending correction'
);
select throws_ok(
  $$ select api.restore_revision(
    'b4000000-0000-4000-8000-000000000003',
    'b4000000-0000-4000-8000-000000000003'
  ) $$,
  '55000',
  'active publication changed; refresh before restoring',
  'a second stale restore cannot undo the first restore'
);
reset role;

select is(
  (
    select count(*)
    from app_private.publications
    where assessment_id = 'b2000000-0000-4000-8000-000000000001'
      and superseded_at is null
  ),
  1::bigint,
  'compare-and-swap transitions preserve one active publication'
);
select is(
  (
    select count(*)
    from app_private.audit_events
    where action = 'revision.published'
      and entity_id in (
        'b4000000-0000-4000-8000-000000000001',
        'b4000000-0000-4000-8000-000000000003'
      )
  ),
  2::bigint,
  'only successful scoped publications are audited'
);
select is(
  (
    select count(*)
    from app_private.audit_events
    where action = 'revision.restored'
      and entity_id = 'b4000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'only the successful scoped restore is audited'
);

select * from finish();
rollback;
