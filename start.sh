#!/bin/bash

echo "🚀 Iniciando Retro Scrum..."
echo "📦 Node.js: $(node --version)"
echo "📦 npm: $(npm --version)"

npm run build

# Iniciar servidor
echo "🎯 Starting server..."
node combined-server/combined-server.js
