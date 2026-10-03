#!/bin/sh
# Nightly backups inside the `backup` service: a custom-format dump of the database and a tar
# of uploads and proposals, named by date, older than BACKUP_KEEP_DAYS removed. Runs once at
# start, then every day at BACKUP_TIME (server time).
set -eu

BACKUP_TIME="${BACKUP_TIME:-03:00}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
export PGHOST=postgres PGUSER="$POSTGRES_USER" PGPASSWORD="$POSTGRES_PASSWORD" PGDATABASE="$POSTGRES_DB"

backup() {
  stamp="$(date +%Y-%m-%d_%H%M)"
  pg_dump --format=custom --file="/backups/db_${stamp}.dump.partial"
  mv "/backups/db_${stamp}.dump.partial" "/backups/db_${stamp}.dump"
  tar -czf "/backups/files_${stamp}.tar.gz.partial" -C /data media documents
  mv "/backups/files_${stamp}.tar.gz.partial" "/backups/files_${stamp}.tar.gz"
  find /backups -type f -mtime +"$BACKUP_KEEP_DAYS" -delete
  echo "backup ${stamp}: done"
}

backup || echo "backup failed, retrying at ${BACKUP_TIME}" >&2
while true; do
  now="$(date +%s)"
  next="$(date -d "today ${BACKUP_TIME}" +%s)"
  [ "$next" -gt "$now" ] || next="$(date -d "tomorrow ${BACKUP_TIME}" +%s)"
  sleep $((next - now))
  backup || echo "backup failed, retrying tomorrow" >&2
done
