#!/bin/bash

APP_NAME="hefesto"
ECOSYSTEM_FILE="ecosystem.config.js"

echo "=============================="
echo "Deploying $APP_NAME..."
echo "=============================="

echo "Fetching latest code..."
git fetch --all
git pull

echo "Stopping PM2 app..."
pm2 stop $APP_NAME 2>/dev/null
pm2 delete $APP_NAME 2>/dev/null

echo "Removing old build..."
rm -rf dist

echo "Installing dependencies and building..."
npm install
npm run build

echo "Starting PM2 app..."
pm2 start $ECOSYSTEM_FILE --env production

echo "Displaying logs..."
pm2 logs $APP_NAME
