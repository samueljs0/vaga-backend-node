#!/bin/bash
set -e

echo "Waiting for Postgres..."
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" >/dev/null 2>&1; do
  sleep 1
done

echo "Postgres is ready. Running migrations..."
# Run migrations using ts-node so knexfile.ts works
npx ts-node -r tsconfig-paths/register node_modules/knex/bin/cli.js migrate:latest --knexfile knexfile.ts

echo "Running seeds (if any)"
npx ts-node -r tsconfig-paths/register node_modules/knex/bin/cli.js seed:run --knexfile knexfile.ts || true

if [ "$RUN_TESTS" = "1" ]; then
    echo "Running tests inside container"
      npm test --silent
    exit $?
fi

echo "Starting server"
node -r ts-node/register src/server.ts
