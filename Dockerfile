FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm install --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=frontend-builder /app/dist ./public

RUN mkdir -p data uploads logs && \
    chmod 777 data uploads logs

EXPOSE 3000

LABEL description="永远酱系统 - 完整前后端一体化部署包"
LABEL version="1.0.0"

CMD ["node", "dist/index.js"]
