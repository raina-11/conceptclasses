# Concept Institute student results portal

This directory contains the implementation and operations material for the staff-provisioned QPT results portal intended for `https://students.conceptinstitute.co.in`. The portal is not considered deployed merely because this repository builds; complete the production checklist below and record the release outside this repository.

## Architecture and trust boundaries

| Component | Responsibility | Data boundary |
| --- | --- | --- |
| Netlify-hosted React/Vite SPA | Roll/admin-ID sign-in, upload workflow, publication review, account operations, and student result views | Receives only the Supabase URL and browser-safe publishable key; it converts a login ID to an internal Auth email without displaying that email |
| Supabase Auth | Password verification and sessions for staff, students, and guardians | Public signup is disabled; trusted server operations provision new student/admin accounts under synthetic `student.<login-id>@login.concept.invalid` identities |
| Supabase Postgres | Enrollments, normalized results, import state, roles, links, and audit history | Forced RLS denies browser access to private tables; explicitly granted `api` security-definer RPCs verify the session, account, link, and/or staff role |
| Private Supabase Storage bucket | Temporary raw `.xlsx` files | Objects are never public and are removed at a terminal import state |
| `parse-result-xlsx` Edge Function | Authenticates the uploader, downloads and validates the workbook, stages safe records, and deletes the raw object | Its service credential stays inside Supabase and is never sent to the browser or Netlify |
| `student-account` Edge Function | Lists provisionable students, creates/resets credentials, and completes mandatory first-login password changes | Authenticates every bearer token, rechecks the current admin/account state in service-only RPCs, and never returns an internal Auth email |

The normal data path is:

1. An authenticated administrator may select up to 20 `.xlsx` files at once. The browser runs three independent import pipelines in parallel; each reserves an import, uploads to an immutable path in the private bucket, confirms the upload, and invokes the parsing Edge Function. A failure or retry stays isolated to that workbook. A two-minute upload-response timeout and five-minute review deadline turn a stalled request into an explicit retry/stop-tracking decision instead of trapping the admin indefinitely.
2. Each function invocation validates and normalizes one workbook into Postgres. It records a staged, quarantined, or failed terminal state and then idempotently deletes that raw object. Same-batch staging takes a transaction-scoped advisory lock so shared roster writes are serialized without making uploads or parsing sequential; different batches can stage concurrently.
3. The same unified `admin` account may review safe metadata and publish the staged revision. Compare-and-swap, latest-revision, warning, and audit checks still apply. Legacy `uploader`/`publisher` identities, if retained, remain subject to different-user separation.
4. The administrator generates one short-lived credential Excel for all active students, then gives each row only to the matching verified student. Until a student replaces the temporary password and explicitly signs in again, every result and staff-data path remains blocked.
5. A linked student or guardian can read only published results belonging to that student. Subject filtering, totals, percentages, and ranks are computed from normalized published data. Per-QPT insight cards compare the student's marks with identity-free batch averages and highest marks, plus the student's subject rank and participant count; no classmate name, roll number, or individual score is returned.

The database—not the frontend—is the authorization boundary. See [the database and RPC notes](supabase/README.md) for the detailed invariants.

The browser stores only an account-scoped last-activity timestamp for shared-device protection; it never stores result rows for this feature. A persisted session is rejected before private UI renders when that timestamp is missing, invalid, in the future, or at least 30 minutes old. This intentionally signs existing sessions out once when the control is first deployed; an interactive sign-in establishes a fresh timestamp without relying on callback ordering. Activity and sign-out events are synchronized across same-origin tabs, an idle expiry fails closed locally even if the network sign-out call fails, and a successful first-password change discards the old session before requiring explicit re-login.

## Privacy and source files

- Use the generated QPT template at `/templates/qpt-import-template.xlsx` for new uploads. The parser also handles the supported legacy workbook shape, but `.xls`, CSV, macros, and arbitrary spreadsheets are not accepted.
- Never make the supplied Google Drive folder public, use it as a production database/API, or place its URL, folder IDs, credentials, student details, or workbook contents in source control, frontend code, logs, screenshots, fixtures, or issue trackers.
- A workbook used for local validation must stay outside Git or under ignored `tests/fixtures/private/`. Delete local copies when validation is complete.
- Production workbooks enter only through the private upload flow. Browser code must never list the private bucket, use a service-role/secret key, or log raw row content.
- Prefer the canonical template because a legacy workbook can contain unrelated personal data in non-result tabs. For compatibility with the supplied legacy shape, the isolated server-side XLSX decoder transiently materializes the workbook package in memory, but application parsing iterates and stages only the allowlisted `Sheet1` result projection. Other-tab values are never returned, logged, or stored as normalized records, and the raw private object is deleted at a terminal outcome. If institute policy requires that unrelated tabs never be processed even transiently, staff must first produce the sanitized canonical workbook; do not upload the legacy original.
- A successfully staged, quarantined, or failed import is terminal, and the Edge Function retries deletion of its raw object idempotently. An interrupted pre-terminal import can retain its raw object so the same import can be resumed safely.
- There is currently no automatic stale-import sweeper or public cancellation endpoint. An operator should regularly review old `awaiting_upload` and `parsing` imports through a trusted database context, resume them first, and escalate deliberately abandoned records through a reviewed cleanup runbook. Do not bulk-empty the bucket or repair statuses ad hoc.
- Package limits are 10 MiB uploaded, 50 MiB expanded, 20 MiB per ZIP entry, 1,000 entries, and a 250:1 compression ratio. Semantic input is limited to 10,000 score/student rows. Before scanning cells, canonical dimensions are capped at `Instructions` 200×20, `Assessment` 64×2 and `Scores` 10,001×64 with 100,000 populated cells overall; legacy `Sheet1` is capped at 10,025×64 and 200,000 populated cells. Persisted marks must fit PostgreSQL `numeric(12,4)` and ranks/QPT numbers must fit `integer`.

## Local setup

Prerequisites are Node.js `20.19+` (below 21) or `22.12+`, Docker, and `psql` for the real integration suite. The Supabase CLI is pinned as a development dependency, so use it through `npm`/`npx` from this directory.

```sh
cd student-portal
npm ci
cp .env.example .env.local
npm run db:start
npm run db:reset
npm run dev
```

Fill `.env.local` with the local API URL and browser-safe publishable key printed by `npx supabase status -o env`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
```

Do not put a service-role key, database password, administrator password, production workbook path, or student data in `.env.local`. Every `VITE_` value is bundled into client JavaScript and is public by design. The student login and reset flow does not require SMTP or a deliverable student email address.

`npm run db:start` runs the local Supabase stack used by the application and integration suite. For direct Edge Function development, run `npx supabase functions serve` in another terminal so both `parse-result-xlsx` and `student-account` are available. On macOS/Colima, if the CLI cannot create its function bundle in the system temporary directory, retry with `TMPDIR="$PWD/supabase/.temp"`; that directory is ignored.

Both local Edge Functions accept the exact Vite origins on ports `5173` and `4173`; the latter is the documented fallback when another local project already owns Vite's default port. Start it with `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort`. Hosted deployments must still set both `QPT_ALLOWED_ORIGINS` and `STUDENT_ACCOUNT_ALLOWED_ORIGINS` to the single production portal origin.

Before testing the admin UI on a fresh local database, run the [`bootstrap:admin` procedure](#administrator-bootstrap) once and complete its temporary-password/re-login flow.

Use `npm run db:stop` when finished. `npx supabase stop --no-backup` and database resets destroy local Supabase state; never add `--linked` or point these commands at a hosted database.

## Test-driven workflow

Write or update a failing test with each behavior change, implement the smallest change, then run the relevant focused test and the complete gates before merging.

```sh
# Unit/component/parser tests
npm test

# Static checks and a synthetic, non-deployable production-bundle smoke test
npm run typecheck
npm run lint
npm run build:synthetic

# Database pgTAP suite and local schema lint (local stack required)
npm run test:db
npx supabase db lint --local --level error --schema app_private --schema api

# Real local one-admin Auth -> Storage -> both Edge Functions -> DB -> publish path
npm run test:integration:local

# Browser flows, responsive checks, and automated accessibility checks
npm run test:e2e:install   # once per machine/CI image
npm run test:e2e
```

Additional development commands are `npm run test:watch`, `npm run test:coverage`, `npm run preview`, and `npm run test:integration`. The last command compiles the integration suite but skips its destructive body unless the local-only safety flag is set; prefer `npm run test:integration:local` for the real run.

`npm run build` is deliberately a production-only gate: it refuses missing configuration, local HTTP URLs, non-Supabase hosts, URL paths, malformed keys, and any Supabase secret/service-role key. It accepts the exact hosted HTTPS project origin plus a browser-safe `sb_publishable_…` key (or the legacy `anon` JWT fallback), then emits `dist/_headers` with a CSP whose `connect-src` is pinned to that one origin. `npm run build:synthetic` supplies an inert project-shaped configuration only for local bundle and browser tests; never deploy that artifact.

Reset the local database before and after a real integration run. That suite provisions only synthetic users and refuses non-loopback API/database hosts. Private real-workbook coverage is opt-in and must not expose its path or selectors; follow [the integration test guide](tests/integration/README.md). Browser-suite details are in [the E2E guide](tests/e2e/README.md).

When the workbook contract changes, update its tests and generator, run `npm run generate:template`, and rerun the full parser and integration gates before committing the generated template.

## Account provisioning

Keep Supabase's email/password provider enabled while keeping public and anonymous signup disabled. The portal uses the provider as an internal password/session mechanism; neither students nor administrators enter an email address. A canonical login ID is mapped to `student.<login-id>@login.concept.invalid` in the browser and trusted server code. This synthetic address is not a mailbox, is never returned by the account-management API, and must not be used for email recovery.

The student lifecycle is:

1. A validated workbook creates or updates each student and active enrollment. The unified administrator opens **Student Access** and selects **Generate & download all credentials**.
2. The authenticated SPA calls the server-side `student-account` Edge Function for each included student through a bounded queue. The function rechecks the caller's live `admin` role, derives a collision-safe login ID from the roll number (batch-qualifying it when needed), creates or resets the internal Auth identity, links it to the student, and marks the credential as temporary.
3. Each response contains the login ID and a cryptographically generated temporary password once, with no-store response headers. Plaintext passwords are never written to Postgres, Storage, logs, browser persistence, or telemetry; they exist only in current page memory and the downloaded short-lived Excel. The administrator distributes each row only to the matching verified student.
4. The student signs in with the displayed login ID and temporary password. Database authorization hides all results while `must_change_password` is true. After the student saves a compliant private password, the browser discards the old session and requires an explicit sign-in with that new password.
5. A forgotten password is office-assisted: staff verify the student in person or through the institute's approved process, then use **Reset password** in the admin portal. The old credential is replaced, data access closes immediately, and the new temporary password follows the same mandatory-change and re-login flow. There is no student email or SMTP dependency.

The unified admin portal separates **Workbooks** from **Student Access**. Student Access has one institute-handover action: **Generate & download all credentials**. It creates missing roll-number logins and, after an explicit warning and acknowledgement, replaces every existing active student's password so one complete Excel file contains a working temporary credential for every included student. Suspended and disabled accounts are excluded. Existing passwords cannot be read or exported, so generating another complete file deliberately invalidates the previous file and passwords.

The browser processes distinct students through a bounded six-worker queue, retains successful one-time secrets in roster order, and automatically starts the `.xlsx` download only after the complete batch succeeds. The workbook stores roll/login/password values as text (including leading zeroes), labels created/reset rows, includes the student portal URL and handling instructions, and uses a timestamped filename. A **Download Excel again** fallback remains available while the secrets are still in page memory. Sign-out/navigation is blocked during generation and requires explicit discard confirmation afterward; another generation cannot start until the current in-memory set is saved and cleared. It is not a password-retrieval feature: Supabase Auth has no password-read operation and this application never stores plaintext passwords in Postgres, Storage, local storage, browser databases, logs, or telemetry. A partial batch is clearly labelled incomplete, does not masquerade as the all-student file, keeps successful rows available for an explicit partial download, and lists roll, batch, and a sanitized failure category for individual resolution; ambiguous credential mutations are never retried automatically.

Treat every downloaded credential workbook as a short-lived secret: download it on a trusted staff device, deliver each row directly to the verified student, do not email or place it in shared Drive, and securely delete it after distribution. Closing or refreshing the portal discards the in-memory copy and cannot recover it. If the file is lost, issue new credentials rather than trying to retrieve the old ones.

Never call the Supabase Admin API from the SPA or expose its service credential. Student account enumeration, Auth creation/reset, and credential-gate completion belong only in `student-account`; its supporting RPCs grant EXECUTE only to `service_role` and independently verify the supplied actor or credential state.

### Administrator bootstrap

After applying the roll-login migration, bootstrap the first local administrator from `student-portal/`:

```sh
CONCEPT_ADMIN_LOGIN_ID=admin \
CONCEPT_ADMIN_PASSWORD='<strong-one-time-password>' \
npm run bootstrap:admin
```

The command discovers a running local Supabase stack. It creates or updates the deterministic internal Auth identity, confirms it, assigns the `admin` role, records the login ID, and forces the supplied password through the same first-login replacement flow. It never prints the password. A rerun converges the account to the requested state but also rotates its temporary password and closes its portal access until it is changed, so rerun it deliberately.

For a hosted project, load `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY` fallback), `SUPABASE_DB_URL`, `CONCEPT_ADMIN_LOGIN_ID`, and `CONCEPT_ADMIN_PASSWORD` from the approved secret manager on a trusted single-user operations host, verify that the API and direct database URL identify the same project, then set `ALLOW_REMOTE_ADMIN_BOOTSTRAP=1` for that invocation. Do not place these values in `.env.local`, source control, CI logs, shell history, Netlify, or browser configuration. Clear the environment afterward.

One actual operator may use one protected administrator credential and the single unified admin portal may upload, review, publish, restore, and manage student access. If more than one human performs these duties, do not share that credential: provision named login IDs with the same `admin` role and UI so audit events retain individual attribution. Legacy named `uploader` and `publisher` roles remain supported and retain different-user publication separation; the unified `admin` role is the intentional same-user exception.

The repository has no public role/link administration RPC. Later role or link changes still require a reviewed privileged operation, and staff should remove access promptly. If the administrator forgets the password, recover it by rerunning the trusted bootstrap for that same login ID with a new one-time password; synthetic internal addresses cannot receive recovery mail.

See Supabase's current guidance for [server-side user creation](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [server-side user updates](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid), and [session behavior after password changes](https://supabase.com/docs/guides/auth/sessions).

## Production deployment sequence

Deploy the database and both Edge Functions before the frontend that consumes them.

1. Create the production Supabase project in the selected region. Store its project reference and operator credentials in the approved password/secret manager, not this repository.
2. Run every local gate above and create a tested encrypted backup before changing an existing hosted database.
3. Authenticate and link the CLI, then inspect and apply repository migrations:

   ```sh
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push --dry-run
   npx supabase db push
   ```

   Apply schema changes only through reviewed migrations; do not edit production tables in the Dashboard. Do not run the seed against production—it is deliberately non-PII development setup.

4. In **Integrations → Data API**, keep the Data API enabled and replace **Exposed schemas** with exactly `api`; remove `public`, `graphql_public`, and every other schema. The migration grants only the required `api` RPCs, but this hosted setting is separate and is not changed by `db push`. Verify an authenticated synthetic `.schema('api')` RPC succeeds, while `public` and `app_private` attempts fail with `PGRST106`, before deploying the SPA. See Supabase's [custom-schema API guidance](https://supabase.com/docs/guides/api/securing-your-api#use-a-dedicated-api-schema).
5. In hosted Auth settings, enable email/password login, disable public signup and anonymous sign-in, set the Site URL to exactly `https://students.conceptinstitute.co.in`, require at least 10 characters with lowercase, uppercase, and a digit, and enable secure password changes. Directly verify a weak password is rejected. Trusted server operations create student and synthetic-admin identities as confirmed, so this flow needs neither invitation/reset redirects nor SMTP. Do not blindly push the local `config.toml`: it intentionally contains localhost Auth URLs.
6. Set both functions' exact allowed browser origin and deploy both with gateway JWT verification disabled, as committed in `supabase/config.toml`:

   ```sh
   npx supabase secrets set \
     QPT_ALLOWED_ORIGINS=https://students.conceptinstitute.co.in \
     STUDENT_ACCOUNT_ALLOWED_ORIGINS=https://students.conceptinstitute.co.in
   npx supabase functions deploy parse-result-xlsx
   npx supabase functions deploy student-account
   ```

   Supabase supplies the hosted `SUPABASE_PUBLISHABLE_KEYS` and `SUPABASE_SECRET_KEYS` JSON maps. Both functions select the `default` publishable key; privileged clients prefer the dedicated `portal_backend` secret and fall back to `default`, then local single-key or legacy variables when the hosted maps are absent. Do not copy a service credential to Netlify or the SPA. Gateway verification stays off because the legacy gateway verifier does not support hosted asymmetric user JWTs; each handler still requires a bearer token and verifies it with `auth.getUser(token)`, while service-only RPCs independently recheck current authorization before privileged operations.

7. Run `npm run bootstrap:admin` from the trusted operations host using the hosted variables described above and `ALLOW_REMOTE_ADMIN_BOOTSTRAP=1`. Confirm the command names the intended project origin without printing the temporary password. Sign in using the admin ID—not the internal email—replace the temporary password, explicitly sign in again, and verify the `admin` role before continuing.
8. Create/connect the Netlify site with base directory `concept/student-portal` (the path from this repository's Git root). The committed [Netlify configuration](netlify.toml) uses `npm run build`, publishes `dist`, and supplies the SPA fallback. The validated build generates `dist/_headers` with the security headers and an exact-origin CSP, as required by Netlify's [custom-header file guidance](https://docs.netlify.com/manage/routing/headers/). For CLI releases, run `npm run deploy:production`: it builds with Netlify's production context, rejects the inert `build:synthetic` artifact or any bundle/CSP backend mismatch, and then uploads that already-validated directory with `--no-build`. Do not replace this with a one-step `netlify deploy` after browser tests, because those tests intentionally leave a synthetic `dist` directory behind.
9. Set only these frontend environment variables in Netlify and build a deploy preview:

   ```dotenv
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<production-publishable-key>
   ```

   Netlify does not automatically use a local `.env` during hosted builds, and both values become public browser configuration. Never add a database URL, service-role/secret key, or SMTP credential. Give the values the **Production** deploy context only and, when the Netlify plan supports scoped variables, restrict them to **Builds**. Netlify Free may apply these two public values to every scope; that is acceptable only because neither value is secret and this site has no Netlify Functions. Because every portal build fails closed without valid values, either disable Deploy Previews or define the same variable names in the **Deploy Previews** context using a separately governed non-production Supabase project and explicit non-production Auth/CORS URLs. Never let a preview build connect to production student data.

10. Add `students.conceptinstitute.co.in` as the custom domain in Netlify first. At the external DNS provider, add a CNAME for host `students` to the exact assigned `<site-name>.netlify.app` target. Wait for DNS and managed TLS to become healthy before launch.
11. Verify the existing `https://conceptinstitute.co.in` Login link points to the HTTPS student subdomain only after the production smoke test passes.
12. Run the release checklist with synthetic records, including account creation/reset and explicit post-change re-login, then record the deployed commit, migration version, both function versions, operators, and rollback owner outside the repository.

Relevant current references are Supabase's [migration deployment workflow](https://supabase.com/docs/guides/deployment/database-migrations) and [Edge Function deployment guide](https://supabase.com/docs/guides/functions/deploy), plus Netlify's [Vite guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/), [build environment variables](https://docs.netlify.com/build/configure-builds/environment-variables/), and [external DNS instructions](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/).

## Backup, restore, and recovery

Run the checked-in encrypted export at least daily and immediately before every production migration:

```sh
BACKUP_GPG_RECIPIENT='operations@example.invalid' \
SUPABASE_PROJECT_REF='<project-ref>' \
SUPABASE_DB_URL='postgresql://<private-connection-string>' \
./ops/backup-free-tier.sh /secure/off-site-staging
```

The script first proves that the explicit project reference, CLI-linked Storage project, and direct database host agree. It then exports Auth identities, private application data, and private Storage objects; creates a checksum manifest with the verified source identity; and leaves only an encrypted archive in the chosen off-site destination. Database backups alone do not include Storage objects. Never store the archive, decrypted data, connection string, or encryption key in this repository.

Perform a restore drill at least quarterly in a separate empty temporary project: verify the manifest; apply migrations; remove only the empty target's default Auth data while preserving Auth migrations; restore Auth identities before application data so synthetic login IDs retain their UUID links; restore Storage through the Storage API/CLI; compare aggregate counts; deploy both pinned functions; test admin-ID login, roll login, mandatory password change and explicit re-login, office reset, linked-student isolation, same-admin upload/publication, result visibility, and raw-object deletion; then destroy the drill project and securely remove plaintext. A backup is not considered usable until the drill succeeds. Follow the full [backup and restore runbook](ops/README.md).

For rollback, keep a known-good frontend deploy and pinned revisions of both Edge Functions available. Roll the frontend and its compatible functions together. Treat database migrations as forward-moving: use a reviewed corrective migration or the tested restore procedure instead of manually editing production schema/data. Restoring only Postgres without the matching Auth identities breaks roll/admin-ID sign-in; restore Auth before `app_private` as the runbook requires.

## Free-tier operating limits

The free services are suitable for a small pilot, not a reliability guarantee.

- Supabase Free currently permits two active free projects and includes quotas such as 500 MB database size, 1 GB Storage, 5 GB egress, 50,000 monthly active users, and 500,000 Edge Function invocations. Low-activity Free projects may pause after about seven days. Automatic daily backups/PITR and preview branching are not Free-tier recovery features. Monitor the project usage dashboard, keep independent encrypted backups, and upgrade before exams or other class-critical periods require assured availability. Verify current [billing quotas](https://supabase.com/docs/guides/platform/billing-on-supabase), [pausing behavior](https://supabase.com/docs/guides/platform/free-project-pausing), and [backup coverage](https://supabase.com/docs/guides/platform/backups) before launch.
- New Netlify Free accounts currently receive a 300-credit monthly hard limit; production deploys, bandwidth, and requests consume credits, and sites pause at the limit until the next cycle or an upgrade. Older accounts may remain on a different plan. Custom domains and managed SSL are available on Free, but monitor the actual account dashboard and current [plan](https://www.netlify.com/pricing/) rather than assuming capacity.

## Release checklist

- [ ] `npm test`, typecheck, lint, build, database tests, and database lint pass.
- [ ] The destructive local integration suite passes from a clean reset and proves the terminal raw workbook is unavailable even to a service reader.
- [ ] Playwright browser, responsive, keyboard, and automated accessibility checks pass in the deploy preview.
- [ ] A current encrypted off-site backup exists and the latest quarterly restore drill passed.
- [ ] No secrets, service keys, database URLs, student PII, raw workbooks, private QPT/source Drive identifiers, or private fixtures are in Git, built assets, logs, or source maps.
- [ ] Hosted email/password login is enabled only as the internal password/session provider; public/anonymous signup is disabled; the 10-character lower/upper/digit policy and secure password change match the app; a weak password is rejected; and no student flow depends on a mailbox, recovery email, or SMTP.
- [ ] `bootstrap:admin` was run from the trusted operations host against the verified project; its temporary password was changed; explicit re-login with the admin ID succeeded; and the administrator can upload, review, publish, restore, and manage student access.
- [ ] Exactly one human controls the single admin credential, or every human operator has a named login ID with the same `admin` role/UI. No credential is shared across people; least-privilege roles and student/guardian links were independently verified.
- [ ] Hosted Data API exposes exactly `api`; authenticated synthetic `.schema('api')` succeeds while `public` and `app_private` fail with `PGRST106`.
- [ ] Migrations were dry-run and applied before both Edge Functions; `QPT_ALLOWED_ORIGINS` and `STUDENT_ACCOUNT_ALLOWED_ORIGINS` are exact; gateway `verify_jwt` remains disabled while both handlers' `auth.getUser(token)` checks pass; and no service/secret key is present in Netlify or browser code.
- [ ] Netlify contains only the Supabase URL and publishable key; the deployed `_headers` CSP pins `connect-src` to that exact HTTPS origin with no wildcard/WebSocket allowance, and the remaining security headers plus SPA fallback are present.
- [ ] DNS, managed TLS, the main-site Login link, and the production subdomain work without redirect loops or mixed content.
- [ ] A synthetic production smoke test covers roll/admin-ID login, one-time credential issuance, the pre-change data gate, mandatory password change and explicit re-login, office reset, same-admin upload/publication, correct student visibility, cross-student denial, and raw-object deletion without logging its records.
- [ ] Quota/pausing monitoring, incident contacts, office credential-reset procedure, stale-import review, backup ownership, and frontend/function/database rollback owners are recorded.
- [ ] The deployed commit, migration set, both function revisions, release time, bootstrap operator, and approvals are recorded outside the repository.
