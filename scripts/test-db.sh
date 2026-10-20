#!/usr/bin/env bash
# Migratsiyalar va RLS siyosatlarini lokal PostgreSQL'da tekshiradi.
# Ulanish standart libpq o'zgaruvchilari orqali: PGHOST, PGPORT, PGUSER (superuser).
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres ./scripts/test-db.sh
set -euo pipefail
DB="rs_test_$$"
psql -d postgres -qc "create database $DB" >/dev/null
trap 'psql -d postgres -qc "drop database if exists $DB" >/dev/null' EXIT
cd "$(dirname "$0")/.."
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f supabase/tests/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$f"; done
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f supabase/tests/10_rls_test.sql
