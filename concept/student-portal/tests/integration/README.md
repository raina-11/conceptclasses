# Local Supabase integration test

This suite exercises the real local backend path. It is separate from the
mocked browser E2E suite and is skipped unless `RUN_LOCAL_INTEGRATION=1`.

It provisions one synthetic unified administrator, uploads an XLSX to the
private bucket, invokes the real parsing Edge Function, and reads only safe
review metadata. Through the real `student-account` function it then finds an
unprovisioned workbook student, creates the roll-derived login, receives a
one-time temporary password without exposing the internal Auth email, and
proves results remain gated. The student replaces the temporary password,
signs out, proves the old password no longer works, explicitly signs in with
the new password, and reads only the linked student. Finally, the same admin
publishes the staged revision and the student sees it. The suite also proves
that the terminal parsing path deletes the uploaded raw object even from a
service-role reader.

The synthetic internal emails are Auth identifiers only; the test does not send
mail or exercise SMTP. It never logs or snapshots workbook rows, student names,
roll numbers, temporary/private passwords, internal emails, tokens, object
paths, keys, database URLs, or service error payloads. Failures identify only
the pipeline step.

## Safe local run

Prerequisites are Node.js 20+, Docker, the project-pinned Supabase CLI, and
`psql` on `PATH` (or set `PSQL_BIN` to its executable). From `student-portal`:

```sh
npx supabase start
npx supabase db reset --local
npm run test:integration:local
npx supabase db reset --local
```

The test discovers credentials from `npx supabase status -o env` without
printing them. You may instead set `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DB_URL` in the process environment.
A hard safety guard rejects every API or database host except `localhost`,
`127.0.0.1`, or `::1`; hosted and linked projects cannot run this test.

The default fixture is generated in memory by filling the canonical template
with synthetic data. To test a private workbook, keep it outside version
control and set its path. The test privately normalizes it, requires a
`READY_FOR_REVIEW` outcome, and selects the first staged student in memory;
neither the normalized rows nor the selector are reported:

```sh
QPT_INTEGRATION_WORKBOOK_PATH=/absolute/private/workbook.xlsx \
npm run test:integration:local
```

You may override that inferred selection by supplying all three selectors.
Their values are likewise used only in memory and are never reported:

```sh
QPT_INTEGRATION_WORKBOOK_PATH=/absolute/private/workbook.xlsx \
QPT_INTEGRATION_ACADEMIC_YEAR='2026-27' \
QPT_INTEGRATION_BATCH_CODE='private-batch-selector' \
QPT_INTEGRATION_ROLL_NO='private-roll-selector' \
npm run test:integration:local
```

The selected workbook must produce a staged import. If supplied, the three
selectors must identify one enrollment created by that import.

## Cleanup contract

The successful Edge Function path must delete the raw Storage object; the test
fails if it remains. Published revisions, audit records, synthetic Auth users,
and student links deliberately remain locally because production history is
append-only. `npx supabase db reset --local` before and after the run is the
authoritative cleanup and determinism boundary.

If a run is interrupted before the Edge Function reaches a terminal state,
reset the local database before retrying. To discard every local Supabase data
volume as well, use `npx supabase stop --no-backup` and start the stack again.
Both cleanup commands are destructive to local Supabase state; never add
`--linked` or a remote `--db-url`.
