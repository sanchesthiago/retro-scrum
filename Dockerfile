FROM node:22.20.0-alpine

WORKDIR /app

COPY . .

RUN npm ci && npm run build

WORKDIR /app/combined-server
RUN npm ci --only=production

EXPOSE 8080

# ✅ APENAS NODE_ENV (Railway controla a PORT)
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "combined-server.js"]
