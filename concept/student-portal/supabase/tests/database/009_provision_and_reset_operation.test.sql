begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

select has_function('api', 'complete_student_account_provision', array['uuid', 'uuid', 'uuid', 'uuid'], 'provision binding requires an operation nonce');
select hasnt_function('api', 'complete_student_account_provision', array['uuid', 'uuid', 'uuid'], 'unleased provision binding is not service-exposed');
select has_function('api', 'complete_provisioning_credential', array['uuid', 'uuid', 'uuid'], 'provision Auth writes have an exact finalizer');
select has_function('api', 'cancel_provisioning_credential', array['uuid', 'uuid', 'uuid'], 'failed provision Auth writes can release their lease');
select has_function('api', 'begin_student_credential_reset', array['uuid', 'uuid', 'uuid'], 'admin reset requires an operation nonce');
select hasnt_function('api', 'begin_student_credential_reset', array['uuid', 'uuid'], 'unleased admin reset is not service-exposed');
select has_function('api', 'complete_student_credential_reset', array['uuid', 'uuid', 'uuid'], 'successful Auth reset has an exact finalizer');
select has_function('api', 'fail_student_credential_reset', array['uuid', 'uuid', 'uuid'], 'ambiguous Auth reset remains recoverably fail-closed');

insert into auth.users (id, email, encrypted_password, aud, role)
values
  ('b1000000-0000-4000-8000-000000000001', 'lease.admin@example.invalid', '', 'authenticated', 'authenticated'),
  ('b1000000-0000-4000-8000-000000000002', 'student.lease-provision-1@login.concept.invalid', '', 'authenticated', 'authenticated');

insert into app_private.account_roles (user_id, role, granted_by)
values ('b1000000-0000-4000-8000-000000000001', 'admin', 'b1000000-0000-4000-8000-000000000001');
insert into app_private.batches (id, code, academic_year, display_name, created_by)
values ('b2000000-0000-4000-8000-000000000001', 'LEASE-BATCH', '2097-98', 'Synthetic Lease Batch', 'b1000000-0000-4000-8000-000000000001');
insert into app_private.students (id, full_name, created_by)
values ('b3000000-0000-4000-8000-000000000001', 'Synthetic Lease Student', 'b1000000-0000-4000-8000-000000000001');
insert into app_private.enrollments (student_id, batch_id, roll_no, created_by)
values ('b3000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', 'LEASE-PROVISION-1', 'b1000000-0000-4000-8000-000000000001');

set local role service_role;

select is(
  (select provisioning_required from api.complete_student_account_provision(
    'b1000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'b4000000-0000-4000-8000-000000000001'
  )),
  true,
  'the winning provisioner receives the exclusive Auth write'
);
select is(
  (select password_change_operation_state from app_private.user_accounts where user_id = 'b1000000-0000-4000-8000-000000000002'),
  'provisioning',
  'DB binding holds the provisioning lease across the Auth write'
);
select throws_ok(
  $$ select * from api.complete_student_account_provision(
       'b1000000-0000-4000-8000-000000000001',
       'b3000000-0000-4000-8000-000000000001',
       'b1000000-0000-4000-8000-000000000002',
       'b4000000-0000-4000-8000-000000000002'
     ) $$,
  '55P03',
  'credential change already in progress',
  'a concurrent provisioner cannot rotate Auth or return another password'
);
select throws_ok(
  $$ select * from api.begin_student_credential_reset(
       'b1000000-0000-4000-8000-000000000001',
       'b3000000-0000-4000-8000-000000000001',
       'b4000000-0000-4000-8000-000000000010'
     ) $$,
  '55P03',
  'credential change already in progress',
  'admin reset cannot overlap the provisioning Auth write'
);
select is(
  (select provisioning_complete from api.complete_provisioning_credential(
    'b1000000-0000-4000-8000-000000000002',
    (select credential_version from api.credential_state('b1000000-0000-4000-8000-000000000002')),
    'b4000000-0000-4000-8000-000000000001'
  )),
  true,
  'the exact provision operation finalizes after Auth succeeds'
);
select is(
  (select provisioning_required from api.complete_student_account_provision(
    'b1000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000002',
    'b4000000-0000-4000-8000-000000000001'
  )),
  false,
  'an exact finalized provision retry never rewrites Auth'
);
select throws_ok(
  $$ select * from api.complete_student_account_provision(
       'b1000000-0000-4000-8000-000000000001',
       'b3000000-0000-4000-8000-000000000001',
       'b1000000-0000-4000-8000-000000000002',
       'b4000000-0000-4000-8000-000000000002'
     ) $$,
  '55000',
  'student account is already provisioned',
  'a stale different provision operation cannot overwrite a finalized credential'
);

select is(
  (select operation_id from api.begin_student_credential_reset(
    'b1000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000001',
    'b4000000-0000-4000-8000-000000000010'
  )),
  'b4000000-0000-4000-8000-000000000010'::uuid,
  'admin reset claims its own operation before touching Auth'
);
select throws_ok(
  $$ select * from api.begin_initial_password_change(
       'b1000000-0000-4000-8000-000000000002',
       (select credential_version from api.credential_state('b1000000-0000-4000-8000-000000000002')),
       'b4000000-0000-4000-8000-000000000020'
     ) $$,
  '55P03',
  'credential reset recovery required',
  'an old password/session cannot clear a reset before Auth success'
);
select is(
  (select reset_failed from api.fail_student_credential_reset(
    'b1000000-0000-4000-8000-000000000002',
    (select credential_version from api.credential_state('b1000000-0000-4000-8000-000000000002')),
    'b4000000-0000-4000-8000-000000000010'
  )),
  true,
  'an Auth reset failure records a recoverable fail-closed state'
);
select throws_ok(
  $$ select * from api.begin_initial_password_change(
       'b1000000-0000-4000-8000-000000000002',
       (select credential_version from api.credential_state('b1000000-0000-4000-8000-000000000002')),
       'b4000000-0000-4000-8000-000000000020'
     ) $$,
  '55P03',
  'credential reset recovery required',
  'reset-failed state continues blocking the old Auth password'
);

with previous as (
  select credential_version
  from api.credential_state('b1000000-0000-4000-8000-000000000002')
), replacement as (
  select reset.credential_version
  from previous,
    lateral api.begin_student_credential_reset(
      'b1000000-0000-4000-8000-000000000001',
      'b3000000-0000-4000-8000-000000000001',
      'b4000000-0000-4000-8000-000000000011'
    ) reset
)
select isnt(
  (select credential_version from replacement),
  (select credential_version from previous),
  'a later admin reset supersedes the explicitly failed generation'
);

select * from finish();
rollback;
