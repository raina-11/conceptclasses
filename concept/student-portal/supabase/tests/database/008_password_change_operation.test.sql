begin;

create extension if not exists pgtap with schema extensions;

select plan(38);

select has_column('app_private', 'user_accounts', 'password_change_operation_id', 'password changes carry an operation nonce');
select has_column('app_private', 'user_accounts', 'password_change_operation_state', 'password changes carry an operation state');
select has_column('app_private', 'user_accounts', 'password_change_operation_started_at', 'password-change leases are timestamped');
select has_column('app_private', 'user_accounts', 'password_change_operation_credential_version', 'operations retain their claimed credential generation');
select has_function('api', 'begin_initial_password_change', array['uuid', 'uuid', 'uuid'], 'password change has a pre-Auth claim RPC');
select hasnt_function('api', 'complete_initial_password_change', array['uuid', 'uuid'], 'version-only completion bypass is removed');
select has_function('api', 'complete_initial_password_change', array['uuid', 'uuid', 'uuid'], 'completion requires version and operation nonce');
select has_function('api', 'cancel_initial_password_change', array['uuid', 'uuid', 'uuid'], 'failed Auth updates can release their exact claim');
select has_function('api', 'begin_failed_password_change_compensation', array['uuid', 'uuid', 'uuid'], 'ambiguous completion has a fail-secure compensation claim');
select has_function('api', 'complete_failed_password_change_compensation', array['uuid', 'uuid', 'uuid'], 'Auth compensation has an exact finalizer');
select is(
  has_function_privilege('authenticated', 'api.begin_initial_password_change(uuid,uuid,uuid)', 'EXECUTE'),
  false,
  'browser callers cannot claim credential operations directly'
);

insert into auth.users (id, email, encrypted_password, aud, role)
values
  ('a1000000-0000-4000-8000-000000000001', 'operation.admin@example.invalid', '', 'authenticated', 'authenticated'),
  ('a1000000-0000-4000-8000-000000000002', 'student.op-1001@login.concept.invalid', '', 'authenticated', 'authenticated'),
  ('a1000000-0000-4000-8000-000000000003', 'student.op-1002@login.concept.invalid', '', 'authenticated', 'authenticated'),
  ('a1000000-0000-4000-8000-000000000004', 'student.op-session@login.concept.invalid', '', 'authenticated', 'authenticated');

insert into app_private.account_roles (user_id, role, granted_by)
values ('a1000000-0000-4000-8000-000000000001', 'admin', 'a1000000-0000-4000-8000-000000000001');

insert into app_private.batches (id, code, academic_year, display_name, created_by)
values ('a2000000-0000-4000-8000-000000000001', 'OPERATION-BATCH', '2098-99', 'Synthetic Operation Batch', 'a1000000-0000-4000-8000-000000000001');

insert into app_private.students (id, full_name, created_by)
values
  ('a3000000-0000-4000-8000-000000000001', 'Synthetic Operation One', 'a1000000-0000-4000-8000-000000000001'),
  ('a3000000-0000-4000-8000-000000000002', 'Synthetic Operation Two', 'a1000000-0000-4000-8000-000000000001'),
  ('a3000000-0000-4000-8000-000000000003', 'Synthetic Session-Bound Student', 'a1000000-0000-4000-8000-000000000001');

insert into app_private.enrollments (student_id, batch_id, roll_no, created_by)
values
  ('a3000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'OP-1001', 'a1000000-0000-4000-8000-000000000001'),
  ('a3000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000001', 'OP-1002', 'a1000000-0000-4000-8000-000000000001'),
  ('a3000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000001', 'OP-SESSION', 'a1000000-0000-4000-8000-000000000001');

insert into app_private.student_account_links (user_id, student_id, linked_by)
values
  ('a1000000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000004', 'a3000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001');

update app_private.user_accounts
set
  login_id = case user_id
    when 'a1000000-0000-4000-8000-000000000002' then 'op-1001'
    else 'op-1002'
  end,
  must_change_password = true,
  temporary_password_issued_at = statement_timestamp(),
  credential_changed_by = 'a1000000-0000-4000-8000-000000000001',
  credential_changed_at = statement_timestamp()
where user_id in (
  'a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003'
);

update app_private.user_accounts
set login_id = 'op-session'
where user_id = 'a1000000-0000-4000-8000-000000000004';

insert into auth.sessions (id, user_id, created_at, updated_at)
values
  ('a5000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004', statement_timestamp(), statement_timestamp()),
  ('a5000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', statement_timestamp(), statement_timestamp());

create temporary table operation_values (
  label text primary key,
  value uuid not null
) on commit drop;
grant select, insert, update on operation_values to service_role;

set local role service_role;

insert into operation_values(label, value)
select 'one-version', credential_version
from api.credential_state('a1000000-0000-4000-8000-000000000002');
insert into operation_values(label, value)
values
  ('one-op', 'a4000000-0000-4000-8000-000000000001'),
  ('other-op', 'a4000000-0000-4000-8000-000000000099'),
  ('admin-reset-op', 'a4000000-0000-4000-8000-000000000088');

select is(
  (select operation_id from api.begin_initial_password_change(
    'a1000000-0000-4000-8000-000000000002',
    (select value from operation_values where label = 'one-version'),
    (select value from operation_values where label = 'one-op')
  )),
  (select value from operation_values where label = 'one-op'),
  'the expected generation can claim its operation nonce'
);
select cmp_ok(
  (select operation_expires_at from api.begin_initial_password_change(
    'a1000000-0000-4000-8000-000000000002',
    (select value from operation_values where label = 'one-version'),
    (select value from operation_values where label = 'one-op')
  )),
  '>',
  statement_timestamp(),
  'an idempotent claim reports a future lease expiry'
);
select throws_ok(
  $$ select * from api.begin_initial_password_change(
       'a1000000-0000-4000-8000-000000000002',
       (select value from operation_values where label = 'one-version'),
       (select value from operation_values where label = 'other-op')
     ) $$,
  '55P03',
  'credential change already in progress',
  'a different operation cannot overlap the active claim'
);
select throws_ok(
  $$ select * from api.begin_student_credential_reset(
       'a1000000-0000-4000-8000-000000000001',
       'a3000000-0000-4000-8000-000000000001',
       (select value from operation_values where label = 'admin-reset-op')
     ) $$,
  '55P03',
  'credential change already in progress',
  'admin reset cannot overlap a live student Auth update'
);
select throws_ok(
  $$ select * from api.complete_initial_password_change(
       'a1000000-0000-4000-8000-000000000002',
       (select value from operation_values where label = 'one-version'),
       (select value from operation_values where label = 'other-op')
     ) $$,
  '40001',
  'credential operation changed; restart password change',
  'completion rejects the wrong operation nonce'
);
select is(
  (select must_change_password from api.credential_state('a1000000-0000-4000-8000-000000000002')),
  true,
  'wrong-operation completion leaves the gate closed'
);
select is(
  (select must_change_password from api.complete_initial_password_change(
    'a1000000-0000-4000-8000-000000000002',
    (select value from operation_values where label = 'one-version'),
    (select value from operation_values where label = 'one-op')
  )),
  false,
  'the exact operation completes after Auth accepts the password'
);
select is(
  (select auth_compensation_required from api.begin_failed_password_change_compensation(
    'a1000000-0000-4000-8000-000000000002',
    (select value from operation_values where label = 'one-version'),
    (select value from operation_values where label = 'one-op')
  )),
  true,
  'an ambiguous committed completion enters fail-secure compensation'
);

insert into operation_values(label, value)
select 'one-compensation-version', credential_version
from api.begin_failed_password_change_compensation(
  'a1000000-0000-4000-8000-000000000002',
  (select value from operation_values where label = 'one-version'),
  (select value from operation_values where label = 'one-op')
)
on conflict (label) do update set value = excluded.value;

select isnt(
  (select value from operation_values where label = 'one-compensation-version'),
  (select value from operation_values where label = 'one-version'),
  'compensation rotates the database credential generation'
);
select is(
  (select must_change_password from api.credential_state('a1000000-0000-4000-8000-000000000002')),
  true,
  'compensation closes a possibly committed gate before Auth rotation'
);
select throws_ok(
  $$ select * from api.begin_student_credential_reset(
       'a1000000-0000-4000-8000-000000000001',
       'a3000000-0000-4000-8000-000000000001',
       (select value from operation_values where label = 'admin-reset-op')
     ) $$,
  '55P03',
  'credential change already in progress',
  'admin reset cannot race the undisclosed Auth compensation write'
);
select is(
  (select must_change_password from api.complete_failed_password_change_compensation(
    'a1000000-0000-4000-8000-000000000002',
    (select value from operation_values where label = 'one-compensation-version'),
    (select value from operation_values where label = 'one-op')
  )),
  true,
  'compensation finalization preserves the closed gate'
);
select is(
  (select password_change_operation_state from app_private.user_accounts where user_id = 'a1000000-0000-4000-8000-000000000002'),
  null::text,
  'successful Auth compensation releases the operation lease'
);

insert into operation_values(label, value)
select 'two-version', credential_version
from api.credential_state('a1000000-0000-4000-8000-000000000003');
insert into operation_values(label, value)
values ('two-op', 'a4000000-0000-4000-8000-000000000002');

select lives_ok(
  $$ select * from api.begin_initial_password_change(
       'a1000000-0000-4000-8000-000000000003',
       (select value from operation_values where label = 'two-version'),
       (select value from operation_values where label = 'two-op')
     ) $$,
  'a second account can claim a password change'
);
select is(
  (select cancelled from api.cancel_initial_password_change(
    'a1000000-0000-4000-8000-000000000003',
    (select value from operation_values where label = 'two-version'),
    (select value from operation_values where label = 'two-op')
  )),
  true,
  'an Auth update failure releases its exact operation immediately'
);
select is(
  (select password_change_operation_state from app_private.user_accounts where user_id = 'a1000000-0000-4000-8000-000000000003'),
  null::text,
  'cancellation clears the operation state without opening the gate'
);

select lives_ok(
  $$ select * from api.begin_initial_password_change(
       'a1000000-0000-4000-8000-000000000003',
       (select value from operation_values where label = 'two-version'),
       (select value from operation_values where label = 'two-op')
     ) $$,
  'the student can reclaim after a known Auth failure'
);
update app_private.user_accounts
set password_change_operation_started_at = statement_timestamp() - interval '11 minutes'
where user_id = 'a1000000-0000-4000-8000-000000000003';

insert into operation_values(label, value)
select 'two-reset-version', credential_version
from api.begin_student_credential_reset(
  'a1000000-0000-4000-8000-000000000001',
  'a3000000-0000-4000-8000-000000000002',
  (select value from operation_values where label = 'admin-reset-op')
);

select isnt(
  (select value from operation_values where label = 'two-reset-version'),
  (select value from operation_values where label = 'two-version'),
  'admin reset may supersede an expired operation lease'
);
select is(
  (select auth_compensation_required from api.begin_failed_password_change_compensation(
    'a1000000-0000-4000-8000-000000000003',
    (select value from operation_values where label = 'two-version'),
    (select value from operation_values where label = 'two-op')
  )),
  false,
  'compensation becomes a no-op when a later reset generation already won'
);
select is(
  (select credential_version from api.credential_state('a1000000-0000-4000-8000-000000000003')),
  (select value from operation_values where label = 'two-reset-version'),
  'no-op compensation preserves the later reset generation'
);
select throws_ok(
  $$ select * from api.complete_initial_password_change(
       'a1000000-0000-4000-8000-000000000003',
       (select value from operation_values where label = 'two-version'),
       (select value from operation_values where label = 'two-op')
     ) $$,
  '40001',
  'credential state changed; restart password change',
  'the expired operation cannot complete after the later reset'
);
select is(
  (select must_change_password from api.credential_state('a1000000-0000-4000-8000-000000000003')),
  true,
  'the later reset remains fail-closed'
);
select is(
  (
    select count(*)
    from app_private.audit_events
    where action = 'credential.password_change_compensation_started'
      and entity_id = 'a1000000-0000-4000-8000-000000000002'
  ),
  1::bigint,
  'only the winning operation starts compensation'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000004","role":"authenticated"}';
select is(
  (select count(*) from api.my_students()),
  0::bigint,
  'an authenticated JWT without a session id cannot regain student data'
);
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000004","role":"authenticated","session_id":"a5000000-0000-4000-8000-000000000002"}';
select is(
  (select count(*) from api.my_students()),
  0::bigint,
  'a session id belonging to another user cannot authorize the JWT'
);
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000004","role":"authenticated","session_id":"a5000000-0000-4000-8000-000000000001"}';
select is(
  (select count(*) from api.my_students()),
  1::bigint,
  'a matching live Auth session authorizes the ready student account'
);
reset role;
delete from auth.sessions where id = 'a5000000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1000000-0000-4000-8000-000000000004","role":"authenticated","session_id":"a5000000-0000-4000-8000-000000000001"}';
select is(
  (select count(*) from api.my_students()),
  0::bigint,
  'a still-signed JWT is denied immediately after its Auth session is deleted'
);

select * from finish();
rollback;
