#!/bin/bash

echo "🚀 Iniciando Retro Scrum..."
echo "📦 Node.js: $(node --version)"
echo "📦 npm: $(npm --version)"

# Build do Angular (já feito no Dockerfile, mas mantemos por segurança)
npm run build

# Iniciar servidor
echo "🎯 Starting server..."
node combined-server/combined-server.js
