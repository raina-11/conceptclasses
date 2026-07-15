begin;

create extension if not exists pgtap with schema extensions;

select plan(54);

select has_schema('app_private', 'private application schema exists');
select has_schema('api', 'API schema exists');

select has_table('app_private', 'students', 'students table exists');
select has_table('app_private', 'batches', 'batches table exists');
select has_table('app_private', 'enrollments', 'enrollments table exists');
select has_table('app_private', 'student_account_links', 'account links table exists');
select has_table('app_private', 'account_roles', 'account roles table exists');
select has_table('app_private', 'user_accounts', 'account lifecycle table exists');
select has_table('app_private', 'subjects', 'subjects table exists');
select has_table('app_private', 'imports', 'imports table exists');
select has_table('app_private', 'assessments', 'assessments table exists');
select has_table('app_private', 'assessment_revisions', 'assessment revisions table exists');
select has_table('app_private', 'assessment_components', 'assessment components table exists');
select has_table('app_private', 'student_scores', 'student scores table exists');
select has_table('app_private', 'publications', 'publications table exists');
select has_table('app_private', 'audit_events', 'audit events table exists');

select is(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app_private' and c.relname = 'students'),
  true,
  'students has RLS enabled'
);
select is(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app_private' and c.relname = 'student_account_links'),
  true,
  'account links have RLS enabled'
);
select is(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app_private' and c.relname = 'user_accounts'),
  true,
  'account lifecycle has RLS enabled'
);
select is(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app_private' and c.relname = 'student_scores'),
  true,
  'student scores have RLS enabled'
);
select is(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app_private' and c.relname = 'imports'),
  true,
  'imports have RLS enabled'
);
select is(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app_private' and c.relname = 'publications'),
  true,
  'publications have RLS enabled'
);
select is(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app_private' and c.relname = 'audit_events'),
  true,
  'audit log has RLS enabled'
);

select has_function('api', 'my_students', array[]::text[], 'linked-student RPC exists');
select has_function('api', 'student_results', array['uuid', 'text'], 'student results RPC exists');
select has_function('api', 'my_portal_context', array[]::text[], 'portal context RPC exists');
select has_function('api', 'set_account_status', array['uuid', 'text', 'text'], 'account lifecycle RPC exists');
select has_function('api', 'begin_import', array['uuid', 'text', 'bigint'], 'begin import RPC exists');
select has_function('api', 'confirm_import_upload', array['uuid'], 'confirm upload RPC exists');
select has_function('api', 'claim_import', array['uuid'], 'worker claim RPC exists');
select has_function('api', 'complete_import_parse', array['uuid', 'text', 'text', 'text', 'text', 'jsonb', 'jsonb', 'jsonb'], 'worker completion RPC exists');
select has_function('api', 'commit_parsed_import', array['uuid', 'text', 'text', 'text', 'jsonb', 'jsonb', 'jsonb', 'jsonb'], 'atomic parser commit RPC exists');
select has_function('api', 'stage_qpt_import', array['uuid', 'jsonb', 'jsonb'], 'stage import RPC exists');
select has_function('api', 'import_review', array['uuid'], 'safe import review RPC exists');
select has_function('api', 'pending_revisions', array[]::text[], 'publisher queue RPC exists');
select has_function('api', 'publish_revision', array['uuid', 'uuid'], 'compare-and-swap publication RPC exists');
select has_function('api', 'publication_history', array['uuid'], 'publication history RPC exists');
select has_function('api', 'restore_revision', array['uuid', 'uuid'], 'compare-and-swap restore RPC exists');

select is(
  has_schema_privilege('authenticated', 'app_private', 'USAGE'),
  false,
  'authenticated cannot access private schema directly'
);

select is(
  has_schema_privilege('authenticated', 'api', 'USAGE'),
  true,
  'authenticated can access API schema'
);

select is(
  has_schema_privilege('anon', 'api', 'USAGE'),
  false,
  'anonymous clients cannot access the RPC schema'
);

select is(
  has_schema_privilege('authenticated', 'public', 'USAGE'),
  false,
  'authenticated clients cannot use the public schema'
);

select is(
  has_schema_privilege('anon', 'public', 'USAGE'),
  false,
  'anonymous clients cannot use the public schema'
);

select has_trigger(
  'app_private',
  'audit_events',
  'audit_events_reject_truncate',
  'audit history rejects statement-level truncation'
);

select is(
  has_table_privilege('service_role', 'app_private.audit_events', 'TRUNCATE'),
  false,
  'service role does not receive truncate privilege on audit history'
);

create table public.qpt_default_acl_probe (id integer);
create function public.qpt_default_acl_probe()
returns integer
language sql
as $$ select 1 $$;

select is(
  has_table_privilege('authenticated', 'public.qpt_default_acl_probe', 'SELECT'),
  false,
  'future public tables are not exposed to authenticated by default'
);

select is(
  has_table_privilege('anon', 'public.qpt_default_acl_probe', 'SELECT'),
  false,
  'future public tables are not exposed to anonymous clients by default'
);

select is(
  has_function_privilege('authenticated', 'public.qpt_default_acl_probe()', 'EXECUTE'),
  false,
  'future public functions are not executable by authenticated by default'
);

select is(
  has_function_privilege('anon', 'public.qpt_default_acl_probe()', 'EXECUTE'),
  false,
  'future public functions are not executable by anonymous clients by default'
);

select is(
  has_function_privilege('authenticated', 'api.begin_import(uuid,text,bigint)', 'EXECUTE'),
  true,
  'authenticated staff may begin an import'
);

select is(
  has_function_privilege('authenticated', 'api.claim_import(uuid)', 'EXECUTE'),
  false,
  'browser callers cannot claim parser work'
);

select is(
  has_function_privilege('authenticated', 'api.complete_import_parse(uuid,text,text,text,text,jsonb,jsonb,jsonb)', 'EXECUTE'),
  false,
  'browser callers cannot record parser outcomes'
);

select is(
  has_function_privilege('authenticated', 'api.commit_parsed_import(uuid,text,text,text,jsonb,jsonb,jsonb,jsonb)', 'EXECUTE'),
  false,
  'browser callers cannot atomically commit parsed rows'
);

select is(
  has_function_privilege('authenticated', 'api.stage_qpt_import(uuid,jsonb,jsonb)', 'EXECUTE'),
  false,
  'browser callers cannot stage forged score rows'
);

select * from finish();
rollback;
