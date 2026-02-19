#!/bin/sh
set -e

# Wait for PostgreSQL (safety net — depends_on healthcheck should handle this)
echo "Checking PostgreSQL connectivity..."
RETRIES=0
MAX_RETRIES=30
until node -e "
  const net = require('net');
  const s = net.createConnection(5432, 'postgres');
  s.on('connect', () => { s.destroy(); process.exit(0); });
  s.on('error', () => process.exit(1));
" 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo "ERROR: PostgreSQL not reachable after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Waiting for PostgreSQL... ($RETRIES/$MAX_RETRIES)"
  sleep 2
done
echo "PostgreSQL is ready."

echo "Running database migrations..."
./node_modules/.bin/medusa db:migrate

echo "Starting Medusa server..."
exec ./node_modules/.bin/medusa start
