#!/bin/bash
# Deploy script for Chuvstvometr backend on VPS
set -e

echo "=== Chuvstvometr Backend Deploy ==="
echo "Time: $(date)"

# Navigate to project root
cd /opt/chuvstvometr

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Navigate to backend
cd backend

# Install dependencies
echo "Installing dependencies..."
npm install --production=false

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Restart PM2 process
echo "Restarting PM2 process..."
pm2 restart chuvstvometr-backend || pm2 start ecosystem.config.js

# Save PM2 state
pm2 save

echo "=== Deploy complete! ==="
pm2 status chuvstvometr-backend
