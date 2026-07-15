# Student portal database

This directory is the version-controlled source of truth for the portal's
Supabase database. Student PII and raw workbooks never belong in seeds, tests,
logs, snapshots, or Git.

## Local verification

From `student-portal/`:

```sh
npx supabase start
npx supabase db reset --local
npx supabase test db
npx supabase db lint --local --level error --schema app_private --schema api
```

The tests use synthetic identities and run inside transactions. Generated
client types are refreshed with:

```sh
npx supabase gen types typescript --local --schema api
```

## Security boundary

- `app_private` contains every application table. It is absent from the Data
  API configuration, has RLS forced, and is inaccessible to browser roles.
- `api` exposes only explicitly granted RPCs. Anonymous callers have no schema
  access.
- PostgreSQL's `public` schema and its future-object defaults are closed to
  `PUBLIC`, `anon`, and `authenticated`; extension-owned schemas are unchanged.
- `user_accounts.status` and `must_change_password` are checked on every
  authenticated data/staff path. Suspending an account or issuing/resetting a
  temporary credential blocks even an already-issued JWT from portal data.
- The user-facing roll/admin ID is canonicalized and mapped to the internal Auth
  identity `student.<login-id>@login.concept.invalid`. That address is an
  identifier, not a mailbox; it is not stored in application tables or returned
  by account-management responses. Passwords remain exclusively in Auth.
- `student_account_links` is many-to-many. A verified guardian may select more
  than one linked student, and a student may have more than one guardian.
- Raw XLSX objects live in the private `qpt-imports` bucket. Browsers can insert
  only a server-reserved path. The narrowly scoped SELECT policy exists solely
  for Storage's `object.upload` metadata response; browser download, list,
  update, and delete operations are denied. Trusted parsing uses `service_role`.
  The parser removes the source object immediately after a staged, quarantined,
  or failed outcome is durably recorded. Raw files are retained only while an
  upload is awaiting processing or a transient, unrecorded failure needs retry;
  they are not a result archive or backup.
- The unified `admin` role may upload and publish the same validated revision.
  Latest-revision, compare-and-swap, warning, and audit controls remain in
  force. Legacy `uploader` and `publisher` identities must still be different;
  this is checked in the RPC and by a table trigger. The active uploader/admin
  role is rechecked at confirmation, worker claim, and parse commit, so
  revocation takes effect in an in-flight import.
- `student-account` is the only application path that uses Auth Admin account
  creation/password updates. It authenticates the caller first; its supporting
  account RPCs are executable only by `service_role` and independently recheck
  the current admin actor or exact credential version. No service credential is
  exposed to the SPA.
- Publication, correction, restore, account status, credential, and import
  transitions are append-only audit events. Update, delete, and truncate are
  all rejected.

## RPC workflow

Authenticated browser calls:

1. `my_portal_context()` / `my_students()` determine roles, the mandatory
   password-change gate, and linked students.
2. An administrator invokes `student-account` to list enrolled students and to
   provision or reset a verified student's login. A student invokes the same
   function only to replace their own temporary password. The SPA never calls
   Auth Admin or the service-only credential RPCs directly.
3. `begin_import(client_request_id, original_filename, byte_size)` reserves an
   idempotent private path.
4. Upload the XLSX to the returned bucket/path, then invoke
   `parse-result-xlsx` with the import id. The function authenticates the user
   and calls `confirm_import_upload(import_id)` in that user session before any
   trusted parsing work.
5. Poll `import_review(import_id)`. It returns safe preview metadata,
   aggregate validation details, blocking issues, state, and revision id. It
   never returns raw score rows or workbook bytes.
6. The unified administrator uses `pending_revisions()` to review safe aggregate
   warnings, subject/status summaries, the latest-revision flag, and the current
   active revision. They pass that active id to
   `publish_revision(revision_id, expected_active_revision_id)` or
   `restore_revision(revision_id, expected_active_revision_id)`. The
   compare-and-swap check rejects stale tabs; only the newest revision can be
   published, and restore is blocked while a staged correction is pending. A
   legacy publisher may do the same only under the different-user rule.
7. Students/guardians call `student_results(student_id, subject_code)` and
   `student_result_insights(student_id)`; active link membership and credential
   readiness are rechecked inside the database. The insight RPC returns only
   the linked student's row plus batch-level highest, average, rank, and
   participant count for the active published revision. It never returns a
   classmate identity or another student's individual result.

The credential lifecycle is deliberately not email-based. Provisioning derives
a unique roll or batch-qualified login, creates a confirmed synthetic Auth user,
returns a strong temporary password once under `Cache-Control: no-store`, and
stores only login/lifecycle/audit state in Postgres. Until the password is
changed, `is_account_active` denies result and staff RPCs. Completion compares
the exact credential version so a concurrent office reset cannot be cleared by
an older first-login request. After completion, the frontend discards the old
session and requires explicit login with the new password. Forgotten passwords
are reset only after office identity verification; synthetic addresses cannot
receive recovery mail and SMTP is not a student-system dependency.

Trusted parser calls (only `service_role` has EXECUTE):

- `claim_import(import_id)` atomically enters/resumes `parsing` and returns the
  immutable source metadata, including original filename.
- `complete_import_parse(...)` records a `failed` or `quarantined` result. A
  malformed file needs a raw SHA-256 but does not invent a normalized digest.
- `commit_parsed_import(...)` atomically records hashes/preview/validation and
  stages normalized rows. A crash or response retry cannot strand the import
  between parsed and staged states.
- After either completion RPC succeeds, the function deletes the private source
  object with `service_role`. A cleanup error is never reported as success, and
  removing an already-absent object is treated as an idempotent cleanup.

The parser function maps ExcelJS to its pinned `lib/exceljs.bare.js` reader in
the function-local `deno.json`. The default Node entry eagerly initializes
streaming writer dependencies and exceeded the local Edge Runtime's cold-start
CPU budget before authentication. Keep the bare mapping and its runtime-config
regression test when upgrading ExcelJS; verify canonical and legacy workbooks
through the local Edge Runtime before deployment.

Quarantined and failed files require a corrected re-upload with a new
`client_request_id`; browser users cannot override parser findings or forge
rows. Normalized payload hash plus parser version is the dedupe key. Raw file
hash is deliberately not unique.

## Hosted launch settings

Before production traffic:

1. Enable the email/password provider only as the internal password/session
   mechanism, disable public and anonymous signup, and set the Auth Site URL to
   exactly `https://students.conceptinstitute.co.in`. Trusted operations create
   synthetic roll/admin identities as confirmed; student invitation/recovery
   redirects and SMTP are not required.
2. Apply migrations with `supabase db push`, then run the database tests and
   linter against the release candidate before changing DNS.
3. Set both exact-origin secrets. Wildcards and non-local HTTP origins are
   rejected at function startup:

   ```sh
   npx supabase secrets set \
     QPT_ALLOWED_ORIGINS=https://students.conceptinstitute.co.in \
     STUDENT_ACCOUNT_ALLOWED_ORIGINS=https://students.conceptinstitute.co.in
   ```

4. Deploy both `parse-result-xlsx` and `student-account` with platform JWT
   verification enabled. Supabase supplies their platform credentials; never
   expose a `service_role`/secret key to browser code or Netlify.
5. From a trusted operations host, run `npm run bootstrap:admin` with the exact
   hosted API/direct-database configuration, a secret-managed one-time password,
   and `ALLOW_REMOTE_ADMIN_BOOTSTRAP=1`. The command is deliberately blocked for
   remote targets without that explicit guard.
6. Sign in with the admin ID, replace the temporary password, explicitly sign in
   again, and verify same-admin upload/publication plus student provision/reset.
   One human may control one credential; multiple humans need named login IDs
   carrying the same `admin` role so audits remain attributable.
