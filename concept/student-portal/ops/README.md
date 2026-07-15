# Operations runbook

Supabase Free is appropriate for the pilot, but it does not provide a downloadable automatic recovery point for this portal. Run an encrypted off-site export at least daily and before every database migration.

## Backup

Prerequisites:

- the project has been linked with `npx supabase link`;
- `SUPABASE_PROJECT_REF` is the exact linked project reference;
- `SUPABASE_DB_URL` is that project's direct, percent-encoded PostgreSQL connection string using host `db.<project-ref>.supabase.co` (a pooler URL is deliberately rejected);
- GPG is installed and `BACKUP_GPG_RECIPIENT` identifies a tested encryption key;
- the operator is signed in to the Supabase CLI so the private Storage bucket can be copied.
- the pinned CLI's Storage copy command is currently experimental; keep the
  backup smoke test in the release checklist when upgrading the CLI.

Run from `student-portal`:

```bash
BACKUP_GPG_RECIPIENT='operations@example.invalid' \
SUPABASE_PROJECT_REF='<project-ref>' \
SUPABASE_DB_URL='postgresql://...' \
./ops/backup-free-tier.sh /secure/off-site-staging
```

For a local restore drill, set `SUPABASE_STORAGE_MODE=local`. Production uses
the default `linked` mode and requires a linked project.

Before reading data, the script fails closed unless the explicit project reference, CLI-linked Storage project, and direct database hostname all agree. It then exports `auth` identities (preserving user UUIDs), application data, and every private `qpt-imports` object; records the verified source identity, creates a SHA-256 manifest, and writes only a GPG-encrypted archive to the requested destination. Never put an archive or connection string in this repository.

Run this only on a trusted, single-user operations host. The pinned Supabase CLI accepts the database URL as a command-line argument, so another privileged local user may be able to observe it briefly in the process list. Supply it from the approved secret manager, never a shell-history literal, and clear the environment when the command finishes.

Supabase documents that Free projects should make their own logical exports and that database backups do not contain Storage objects: <https://supabase.com/docs/guides/platform/backups>. Storage download options are documented at <https://supabase.com/docs/guides/storage/management/download-objects>.

## Restore drill

Perform this quarterly in a separate, disposable Supabase project. Confirm the
target has no real users or application data before continuing:

1. Decrypt the archive into a temporary `0700` directory, verify `MANIFEST.sha256`, and confirm `BACKUP-METADATA.txt` names the expected source project before touching the restore target.
2. Apply the repository migrations to the empty project.
3. A newly initialized target can contain default rows in Auth. In the empty
   drill target only, clear Auth data tables while preserving
   `auth.schema_migrations`; otherwise the Auth dump can conflict with those
   defaults. This is a privileged, destructive operation and must never run
   against a populated project.
4. Restore `auth-data.sql` first, then `app-private-data.sql`, using the direct
   database connection. The generated dumps set `session_replication_role` so
   UUIDs and foreign-key relationships restore without firing provisioning
   triggers a second time.
5. Compare pre-backup and post-restore aggregate counts before allowing any
   new write. Copy `storage/qpt-imports` back through the Storage API/CLI so
   Storage metadata is recreated correctly; never insert Storage metadata with
   SQL.
6. Regenerate TypeScript database types and deploy the pinned revisions of both
   `parse-result-xlsx` and `student-account`, with their exact-origin secrets and
   JWT verification intact.
7. Verify a restored admin ID and roll ID still resolve to their restored Auth
   UUIDs. Exercise a fresh one-time student credential, the pre-change data
   gate, mandatory password change and explicit re-login, office-assisted reset,
   linked-student isolation, one restored published result, same-admin
   upload/publication, and terminal raw-file deletion using service credentials.
8. Destroy the drill project and securely erase the decrypted directory.

Do not treat a backup as valid until this drill passes. Record the date, operator, encrypted archive checksum, record counts, object counts, and drill result outside the repository.
