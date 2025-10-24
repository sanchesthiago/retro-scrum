FROM node:22.20.0-alpine

WORKDIR /app

COPY . .

# ✅ Build do Angular com output explícito
RUN npm ci
RUN npx ng build --configuration production --output-path=dist/retro-scrum/browser

# ✅ Verificar se o build foi criado
RUN echo "📁 Estrutura após build:" && ls -la dist/ && ls -la dist/retro-scrum/browser

WORKDIR /app/combined-server
RUN npm ci --production

EXPOSE 8080
ENV NODE_ENV=production

CMD ["node", "combined-server.js"]
