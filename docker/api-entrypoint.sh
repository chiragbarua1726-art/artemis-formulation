#!/bin/sh
set -eu

cd /app/apps/api
npx prisma db push --skip-generate
exec node dist/server.js
