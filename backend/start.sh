#!/bin/sh
# Instrumented for Coolify deploy debugging — every step prints a banner so
# docker compose's "Container backend is unhealthy" message can be tied to
# the actual failure stage. Without this, a crash inside medusa db:migrate
# or medusa start is invisible — the only feedback is the deploy log saying
# "unhealthy" with no stderr.

trap 'echo "[start.sh] EXIT trap fired with code $?"' EXIT

echo "===================================================================="
echo "[start.sh] VastuCart backend bootstrap"
echo "[start.sh] NODE_ENV=${NODE_ENV:-unset}"
echo "[start.sh] DATABASE_URL host=$(echo "${DATABASE_URL:-unset}" | sed -E 's#^[^@]+@([^:/]+).*#\1#')"
echo "[start.sh] BACKEND_URL=${BACKEND_URL:-UNSET}"
echo "[start.sh] STORE_URL=${STORE_URL:-UNSET}"
echo "[start.sh] RESEND_API_KEY=$([ -n "$RESEND_API_KEY" ] && echo SET || echo UNSET)"
echo "===================================================================="

# Wait for PostgreSQL. Service name "postgres" relies on docker-compose's
# service DNS — if Coolify's renaming breaks it, the alias "ecomstore-postgres"
# from the docker-compose aliases block is the fallback.
echo "[start.sh] Waiting for PostgreSQL TCP..."
RETRIES=0
MAX_RETRIES=30
PG_HOST=""
for host in postgres ecomstore-postgres; do
  if node -e "const s=require('net').createConnection(5432,'$host');s.on('connect',()=>{s.destroy();process.exit(0)});s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(2),3000);" 2>/dev/null; then
    PG_HOST="$host"
    echo "[start.sh] PostgreSQL reachable on host '$host'"
    break
  fi
done
if [ -z "$PG_HOST" ]; then
  until node -e "const s=require('net').createConnection(5432,'postgres');s.on('connect',()=>{s.destroy();process.exit(0)});s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(2),3000);" 2>/dev/null; do
    RETRIES=$((RETRIES + 1))
    if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
      echo "[start.sh] FATAL: PostgreSQL not reachable on 'postgres' after $MAX_RETRIES attempts"
      exit 1
    fi
    echo "[start.sh] PostgreSQL retry $RETRIES/$MAX_RETRIES…"
    sleep 2
  done
  PG_HOST="postgres"
fi

echo "===================================================================="
echo "[start.sh] Running database migrations…"
if ! ./node_modules/.bin/medusa db:migrate; then
  rc=$?
  echo "[start.sh] FATAL: medusa db:migrate exited with code $rc"
  exit $rc
fi
echo "[start.sh] Migrations OK."

echo "===================================================================="
echo "[start.sh] Starting Medusa server (exec)…"
exec ./node_modules/.bin/medusa start
