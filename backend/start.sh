#!/bin/sh
# Production boot for the VastuCart Medusa backend.
#
# POSIX-only — runs under Alpine's busybox ash, NOT bash. Do not introduce
# bash-only constructs (process substitution, [[ ]], $'...' ANSI quoting,
# `local`, arrays, etc.). Validate with `sh -n start.sh` and `dash -n
# start.sh` before pushing. Past regression: an `exec > >(tee …) 2>&1`
# line crashed ash with "Syntax error: redirection unexpected" on line 9,
# so start.sh never ran at all — the container Errored in ~14s with no
# stderr surfacing. See memory: project_deployment_failures.md.
#
# Failure behaviour: on any boot error, exec exits with the underlying
# non-zero status. Docker captures stdout/stderr to the container log
# driver (retained for exited containers), Coolify's "Logs" tab on the
# stopped container shows the last run, and the `restart: always` policy
# in docker-compose.yml will spin a fresh container. No sleep-after-error
# hacks — those mask real crashes behind a 10-minute alive window and
# delay alerting.

set -e

echo "===================================================================="
echo "[start.sh] VastuCart backend bootstrap — $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "[start.sh] NODE_ENV=${NODE_ENV:-unset}"
echo "[start.sh] BACKEND_URL=${BACKEND_URL:-UNSET}"
echo "[start.sh] STORE_URL=${STORE_URL:-UNSET}"
echo "[start.sh] RESEND_API_KEY=$([ -n "$RESEND_API_KEY" ] && echo SET || echo UNSET)"
echo "[start.sh] DATABASE_URL host=$(echo "${DATABASE_URL:-unset}" | sed -E 's#^[^@]+@([^:/]+).*#\1#' 2>/dev/null)"
echo "[start.sh] Free memory:"
free -m 2>/dev/null || echo "  (free unavailable)"
echo "===================================================================="

# Wait for postgres TCP. depends_on: service_healthy in docker-compose.yml
# already guarantees this, but we double-check defensively — the alias may
# resolve differently across networks during a Coolify network rebuild.
PG_HOST=""
for host in postgres ecomstore-postgres; do
  if node -e "const s=require('net').createConnection(5432,'$host');s.on('connect',()=>{s.destroy();process.exit(0)});s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(2),3000);" 2>/dev/null; then
    PG_HOST="$host"
    echo "[start.sh] PostgreSQL reachable at $host:5432"
    break
  fi
done
if [ -z "$PG_HOST" ]; then
  echo "[start.sh] FATAL: PostgreSQL not reachable at postgres OR ecomstore-postgres"
  exit 1
fi

echo "===================================================================="
echo "[start.sh] Running medusa db:migrate…"
./node_modules/.bin/medusa db:migrate
echo "[start.sh] migrations OK"

echo "===================================================================="
echo "[start.sh] Starting medusa server…"
exec ./node_modules/.bin/medusa start
