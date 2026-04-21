#!/bin/sh
set -eu

cd /app

echo "Running database migrations..."
alembic upgrade head

echo "Starting Nginx + FastAPI..."
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
