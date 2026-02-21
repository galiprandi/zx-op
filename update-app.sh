#!/bin/bash
# update-app.sh - Script for manual and automatic updates via Git

cd /home/zx/zx-op

echo "Checking for updates..."
git pull origin main

# Re-run the start script to apply changes (IP, migrations, build)
./start-app.sh
