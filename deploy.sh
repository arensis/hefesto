#!/bin/bash

# Nombre de la app PM2
APP_NAME="hefesto"
ECOSYSTEM_FILE="ecosystem.config.js"

echo "=============================="
echo "Deploying $APP_NAME..."
echo "=============================="

# 1️⃣ Actualizar código desde Git
echo "Fetching latest code..."
git fetch --all
git pull

# 2️⃣ Detener y eliminar la app en PM2
echo "Stopping PM2 app..."
pm2 stop $APP_NAME 2>/dev/null
pm2 delete $APP_NAME 2>/dev/null

# 3️⃣ Limpiar dist
echo "Removing old build..."
rm -rf dist

# 4️⃣ Instalar dependencias y build
echo "Installing dependencies and building..."
npm install
npm run build

# 5️⃣ Iniciar app con PM2 usando ecosystem
echo "Starting PM2 app..."
pm2 start $ECOSYSTEM_FILE --env production

# 6️⃣ Mostrar logs
echo "Displaying logs..."
pm2 logs $APP_NAME
