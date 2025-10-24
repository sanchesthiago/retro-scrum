#!/bin/bash

echo "🚀 Iniciando EasyRetro Clone..."
echo "📦 Node.js version: $(node --version)"
echo "📦 npm version: $(npm --version)"

# Build do Angular
echo "🏗️  Building Angular app..."
npm run build

# Iniciar servidor
echo "🎯 Iniciando servidor..."
cd backend
node server.js
