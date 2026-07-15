begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email, encrypted_password, aud, role)
values
  ('b0000000-0000-4000-8000-000000000001', 'storage.uploader@example.invalid', '', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-000000000002', 'storage.publisher@example.invalid', '', 'authenticated', 'authenticated');

insert into app_private.account_roles (user_id, role, granted_by)
values
  ('b0000000-0000-4000-8000-000000000001', 'uploader', 'b0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000002', 'publisher', 'b0000000-0000-4000-8000-000000000002');

set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-4000-8000-000000000001';
select lives_ok(
  $$ select * from api.begin_import(
    'b1000000-0000-4000-8000-000000000001', 'private-original.xlsx', 4096
  ) $$,
  'uploader reserves an immutable private workbook path'
);
reset role;

select set_config(
  'test.storage_private_path',
  (
    select storage_path from app_private.imports
    where client_request_id = 'b1000000-0000-4000-8000-000000000001'
  ),
  true
);

set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-4000-8000-000000000001';
select lives_ok(
  format(
    'insert into storage.objects(bucket_id, name, owner_id) values (%L, %L, %L)',
    'qpt-imports',
    current_setting('test.storage_private_path'),
    'b0000000-0000-4000-8000-000000000001'
  ),
  'reserved uploader can insert the workbook object'
);
select throws_ok(
  $$ insert into storage.objects(bucket_id, name, owner_id)
     values (
       'qpt-imports',
       'b0000000-0000-4000-8000-000000000001/not-reserved.xlsx',
       'b0000000-0000-4000-8000-000000000001'
     ) $$,
  '42501',
  null,
  'uploader cannot insert an arbitrary unreserved object'
);

select is(
  (select count(*) from storage.objects where bucket_id = 'qpt-imports'),
  0::bigint,
  'uploader cannot directly select raw workbook metadata'
);

set local storage.operation = 'storage.object.get_authenticated';
select is(
  (select count(*) from storage.objects where bucket_id = 'qpt-imports'),
  0::bigint,
  'uploader cannot download the authenticated raw workbook'
);

set local storage.operation = 'storage.object.list';
select is(
  (select count(*) from storage.objects where bucket_id = 'qpt-imports'),
  0::bigint,
  'uploader cannot list raw workbook objects'
);

select results_eq(
  $$ update storage.objects
     set name = 'b0000000-0000-4000-8000-000000000001/changed.xlsx'
     where bucket_id = 'qpt-imports'
     returning 1 $$,
  $$ select 1 where false $$,
  'uploader cannot overwrite or move a workbook object'
);

select is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'DELETE'
      and policyname like 'qpt import%'
  ),
  0::bigint,
  'no browser role has a policy to delete workbook objects through Storage API'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-4000-8000-000000000002';
set local storage.operation = 'storage.object.get_authenticated';
select is(
  (select count(*) from storage.objects where bucket_id = 'qpt-imports'),
  0::bigint,
  'publisher cannot download raw source workbooks'
);
reset role;

set local role anon;
set local storage.operation = 'storage.object.get_authenticated';
select is(
  (select count(*) from storage.objects where bucket_id = 'qpt-imports'),
  0::bigint,
  'anonymous callers cannot download raw source workbooks'
);
reset role;

select * from finish();
rollback;
