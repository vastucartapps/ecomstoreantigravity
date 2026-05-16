#!/bin/sh
# Diagnostic boot — keeps the container alive on any failure so the actual
# error survives in `docker logs` / Coolify's logs viewer. Without this, a
# crash on medusa boot kills the container immediately, Coolify cleans it
# up, and the only feedback is the deploy log saying "unhealthy" with no
# stderr ever surfacing.

LOGFILE=/tmp/medusa-boot.log
exec > >(tee -a "$LOGFILE") 2>&1

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

# Wait for postgres TCP. Try service-name first, then alias.
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
  echo "[start.sh] Keeping container alive (sleep 600) so logs survive…"
  sleep 600
  exit 1
fi

echo "===================================================================="
echo "[start.sh] Running medusa db:migrate…"
if ! ./node_modules/.bin/medusa db:migrate; then
  rc=$?
  echo "[start.sh] FATAL: medusa db:migrate exited with $rc"
  echo "[start.sh] Last 80 lines of boot log:"
  tail -n 80 "$LOGFILE" || true
  echo "[start.sh] Keeping container alive (sleep 600) so logs survive…"
  sleep 600
  exit $rc
fi
echo "[start.sh] migrations OK"

echo "===================================================================="
echo "[start.sh] Starting medusa server…"
./node_modules/.bin/medusa start
rc=$?
echo "[start.sh] FATAL: medusa start exited with $rc"
echo "[start.sh] Last 120 lines of boot log:"
tail -n 120 "$LOGFILE" || true
echo "[start.sh] Keeping container alive (sleep 600) so logs survive…"
sleep 600
exit $rc
