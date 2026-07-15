-- Parallel workbook parsing may reach the staging transaction at the same
-- time. A batch owns a shared student/enrollment roster, so serialize only
-- that final mutation boundary while allowing uploads and parsing (and all
-- work for different batches) to continue concurrently.

alter function api.stage_qpt_import(uuid, jsonb, jsonb)
  set schema app_private;

alter function app_private.stage_qpt_import(uuid, jsonb, jsonb)
  rename to stage_qpt_import_unlocked;

-- The implementation is now an owner-only helper. In particular, service
-- clients must not be able to bypass the batch-scoped lock by invoking it.
revoke execute on function app_private.stage_qpt_import_unlocked(uuid, jsonb, jsonb)
  from public, anon, authenticated, service_role;

create function api.stage_qpt_import(
  p_import_id uuid,
  p_assessment jsonb,
  p_rows jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_academic_year text := btrim(coalesce(p_assessment->>'academic_year', ''));
  v_batch_code text := btrim(coalesce(p_assessment->>'batch_code', ''));
begin
  -- A 64-bit hash collision can only cause harmless extra serialization. The
  -- unit separator keeps otherwise ambiguous year/code pairs distinct before
  -- hashing, and the transaction-scoped lock is released automatically on
  -- commit or rollback.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_academic_year || pg_catalog.chr(31) || v_batch_code,
      0
    )
  );

  return app_private.stage_qpt_import_unlocked(
    p_import_id,
    p_assessment,
    p_rows
  );
end;
$$;

revoke execute on function api.stage_qpt_import(uuid, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function api.stage_qpt_import(uuid, jsonb, jsonb)
  to service_role;

comment on function api.stage_qpt_import(uuid, jsonb, jsonb) is
  'Stages one validated QPT import; shared roster mutation is transaction-serialized by academic year and batch code.';

comment on function app_private.stage_qpt_import_unlocked(uuid, jsonb, jsonb) is
  'Owner-only staging implementation; callers must use api.stage_qpt_import so same-batch roster mutation is serialized.';
