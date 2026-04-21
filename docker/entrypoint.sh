#!/bin/sh
set -eu

cd /app

echo "Starting Nginx immediately; backend will run migrations before Uvicorn boots..."
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
