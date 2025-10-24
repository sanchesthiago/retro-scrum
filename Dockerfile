FROM node:22.20.0-alpine

WORKDIR /app

# Copiar tudo
COPY . .

# Instalar dependências e buildar Angular
RUN npm ci
RUN npm run build

# Instalar dependências do servidor
WORKDIR /app/combined-server
RUN npm ci --only=production

# Voltar para raiz
WORKDIR /app

# Tornar start.sh executável
RUN chmod +x start.sh

EXPOSE 3000
ENV NODE_ENV=production

# Usar SEU script start (que chama start.sh)
CMD ["npm", "start"]
