#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required." >&2
  exit 1
fi

if [[ -z "${BACKUP_GPG_RECIPIENT:-}" ]]; then
  echo "BACKUP_GPG_RECIPIENT is required." >&2
  exit 1
fi

if [[ $# -ne 1 ]]; then
  echo "Usage: BACKUP_GPG_RECIPIENT=... SUPABASE_DB_URL=... $0 OUTPUT_DIRECTORY" >&2
  exit 1
fi

for command in gpg node shasum tar; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "$command is required." >&2
    exit 1
  fi
done

output_directory=$1
mkdir -p "$output_directory"
output_directory=$(cd "$output_directory" && pwd)
script_directory=$(cd "$(dirname "$0")" && pwd)

storage_mode=${SUPABASE_STORAGE_MODE:-linked}
case "$storage_mode" in
  linked)
    storage_connection=(--linked)
    ;;
  local)
    storage_connection=(--local)
    ;;
  *)
    echo "SUPABASE_STORAGE_MODE must be either linked or local." >&2
    exit 1
    ;;
esac

# A database dump and a Storage copy are useful together only when they came
# from the same project. Linked mode requires three independent identities to
# agree: the explicit project ref, the CLI link, and the direct database host.
source_identity=$(SUPABASE_STORAGE_MODE="$storage_mode" \
  node "$script_directory/verify-backup-source.mjs")

timestamp=$(date -u +%Y%m%dT%H%M%SZ)
work_directory=$(mktemp -d "${TMPDIR:-/tmp}/concept-qpt-backup.XXXXXX")
archive_path="$work_directory/concept-qpt-$timestamp.tar.gz"
encrypted_path="$output_directory/concept-qpt-$timestamp.tar.gz.gpg"

cleanup() {
  rm -rf "$work_directory"
}
trap cleanup EXIT INT TERM
chmod 700 "$work_directory"
mkdir -p "$work_directory/storage"

echo "Exporting Auth identities…"
npx supabase db dump \
  --db-url "$SUPABASE_DB_URL" \
  --data-only \
  --schema auth \
  --use-copy \
  --file "$work_directory/auth-data.sql"

echo "Exporting portal data…"
npx supabase db dump \
  --db-url "$SUPABASE_DB_URL" \
  --data-only \
  --schema app_private \
  --use-copy \
  --file "$work_directory/app-private-data.sql"

echo "Exporting private Storage objects ($storage_mode mode)…"
npx supabase --experimental storage cp \
  "${storage_connection[@]}" \
  --recursive \
  ss:///qpt-imports \
  "$work_directory/storage"

(
  cd "$work_directory"
  # Storage object paths are generated UUID paths, so line-delimited hashing is
  # portable across the macOS and Linux operators used for this project.
  find auth-data.sql app-private-data.sql storage -type f -print \
    | LC_ALL=C sort \
    | xargs shasum -a 256 > MANIFEST.sha256
  printf 'created_at_utc=%s\n' "$timestamp" > BACKUP-METADATA.txt
  printf 'format_version=2\n' >> BACKUP-METADATA.txt
  printf 'source_identity=%s\n' "$source_identity" >> BACKUP-METADATA.txt
  tar -czf "$archive_path" \
    BACKUP-METADATA.txt \
    MANIFEST.sha256 \
    auth-data.sql \
    app-private-data.sql \
    storage
)

gpg --batch --yes --trust-model always \
  --recipient "$BACKUP_GPG_RECIPIENT" \
  --encrypt \
  --output "$encrypted_path" \
  "$archive_path"

chmod 600 "$encrypted_path"
shasum -a 256 "$encrypted_path" > "$encrypted_path.sha256"
chmod 600 "$encrypted_path.sha256"

echo "Encrypted backup written to $encrypted_path"
echo "Store the .gpg file and checksum off-site, then run a restore drill."
