FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY services/catalog-api/package.json ./services/catalog-api/
RUN npm ci -w @qalago/catalog-api
COPY services/catalog-api ./services/catalog-api
RUN npm run build -w @qalago/catalog-api
RUN npx prisma generate -w @qalago/catalog-api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY services/catalog-api/package.json ./services/catalog-api/
RUN npm ci -w @qalago/catalog-api --omit=dev
COPY --from=builder /app/services/catalog-api/dist ./services/catalog-api/dist
COPY --from=builder /app/services/catalog-api/node_modules/.prisma ./services/catalog-api/node_modules/.prisma
COPY services/catalog-api/prisma ./services/catalog-api/prisma
RUN mkdir -p /app/services/catalog-api/uploads
WORKDIR /app/services/catalog-api
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
