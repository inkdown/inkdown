# Etapa 1: Construção
FROM node:18 AS builder

WORKDIR /app

# Copiar arquivos essenciais (note que agora o tsconfig.json é copiado)
COPY . .

# Instalar dependências e construir o projeto
RUN npm install
RUN npm run build

# Etapa 2: Imagem final
FROM node:18

WORKDIR /app

# Copiar arquivos do estágio de construção
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copiar .env gerado no CI/CD
COPY .env .

# Copiar package.json e package-lock.json para instalar dependências de produção
COPY package*.json ./
RUN npm install --production

# Expor a porta da aplicação
EXPOSE 3333

# Comando para rodar a aplicação
CMD ["node", "dist/server.js"]
