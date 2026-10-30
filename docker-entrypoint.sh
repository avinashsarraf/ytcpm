#!/bin/sh
set -eu

echo "[entrypoint] starting ytcpm — NODE_ENV=${NODE_ENV:-production} PORT=${PORT:-3000}"

# Mask credentials before printing the target so Coolify logs stay safe.
mask_url() {
  printf '%s' "$1" | sed -E 's#(://)[^:/@]+(:[^@]*)?@#\1***:***@#'
}

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] DATABASE_URL is NOT set."
  echo "[entrypoint]   → the site and calculator work, but /monitor shows a fallback, POST /api/calculate skips logging,"
  echo "[entrypoint]     and GET /api/health reports 503 (database not_configured)."
  echo "[entrypoint]   → add DATABASE_URL in Coolify → your app → Environment Variables."
else
  echo "[entrypoint] database target: $(mask_url "$DATABASE_URL")"

  if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "[entrypoint] running migrations..."
    if node scripts/migrate.mjs; then
      echo "[entrypoint] migrations OK — schema is up to date"
    else
      echo "[entrypoint] WARNING: migrations failed (see the error above)."
      echo "[entrypoint]   → starting anyway so pages and the calculator stay available."
      echo "[entrypoint]   → check the database is running, the password is correct,"
      echo "[entrypoint]     and set DATABASE_SSL=true for providers that require TLS."
    fi
  else
    echo "[entrypoint] RUN_MIGRATIONS=false — skipping migrations"
  fi
fi

echo "[entrypoint] handing over to the Next.js server"
exec node server.js
