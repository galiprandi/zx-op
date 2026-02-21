#!/bin/bash
# start-app.sh

cd /home/zx/zx-op

# Detect the main local IP address
IP=$(hostname -I | awk '{print $1}')

# Recreate or update the .env file
echo "PUBLIC_API_BASE_URL=http://$IP" > .env

# Run database schema push before starting services
# We use --accept-data-loss to ensure it never asks for confirmation (as requested)
docker compose run --rm api npx prisma db push --accept-data-loss

# Start the docker containers
docker compose up -d --build
