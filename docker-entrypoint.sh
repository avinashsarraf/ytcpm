#!/bin/sh
set -eu

echo "[entrypoint] starting ytcpm — NODE_ENV=${NODE_ENV:-production} PORT=${PORT:-3000}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] WARNING: DATABASE_URL is not set."
  echo "[entrypoint] The site and calculator will work; /monitor and logging will return 503."
else
  if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "[entrypoint] running database migrations..."
    if node scripts/migrate.mjs; then
      echo "[entrypoint] migrations OK"
    else
      echo "[entrypoint] WARNING: migrations failed — starting anyway so the site stays up."
    fi
  else
    echo "[entrypoint] RUN_MIGRATIONS=false — skipping migrations"
  fi
fi

exec node server.js
