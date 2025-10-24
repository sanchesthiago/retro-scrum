FROM node:22.20.0-alpine

WORKDIR /app

COPY . .

RUN npm ci && npm run build

WORKDIR /app/combined-server
RUN npm ci --only=production

EXPOSE 3000

# ✅ FORÇAR PORTA 3000 EXPLICITAMENTE
ENV NODE_ENV=production
ENV PORT=3000

# ✅ HEALTH CHECK para Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "combined-server.js"]
