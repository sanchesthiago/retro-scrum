#!/bin/bash

echo "🚀 Iniciando EasyRetro Clone no Railway..."

# Instalar dependências do Angular globalmente se necessário
echo "📦 Verificando dependências..."

# Build do Angular
echo "🏗️  Building Angular app..."
npm run build

# Instalar dependências do backend
echo "📥 Instalando dependências do backend..."
cd backend
npm install --production

# Iniciar servidor
echo "🎯 Iniciando servidor..."
node combined-server.js
