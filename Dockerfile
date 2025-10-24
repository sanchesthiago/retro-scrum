FROM node:22.20.0-alpine

WORKDIR /app

# Copiar projeto
COPY . .

# Build rápido
RUN npm ci && npm run build

# Servidor
WORKDIR /app/combined-server
RUN npm ci --only=production

# Porta e health check
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start direto
CMD ["node", "combined-server.js"]
