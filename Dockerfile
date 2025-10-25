FROM node:22.20.0-alpine

WORKDIR /app

COPY . .

# ✅ Build do Angular - estrutura natural
RUN npm ci
RUN npx ng build --configuration production

# ✅ Verificação rápida
RUN echo "✅ Build completo. Estrutura:" && \
    ls -la /app/dist/retro-scrum/browser/ | head -10

WORKDIR /app/combined-server
RUN npm ci --production

EXPOSE 8080
ENV NODE_ENV=production

CMD ["node", "combined-server.js"]
