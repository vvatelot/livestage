#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set — skipping Supabase migrations"
  exit 0
fi

echo "Applying Supabase migrations..."
supabase db push --db-url "$DATABASE_URL" --yes --workdir /app
