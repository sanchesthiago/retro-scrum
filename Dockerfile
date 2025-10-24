FROM node:22.20.0-alpine

WORKDIR /app

COPY . .

RUN npm ci && npm run build

WORKDIR /app/combined-server
RUN npm ci --only=production

EXPOSE 3000

# ✅ FORÇAR VARIÁVEIS DE PRODUÇÃO
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "combined-server.js"]
