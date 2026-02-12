ARG DOCKER_HUB_USERNAME=foreverjiang

FROM node:20-alpine AS builder

ARG DOCKER_HUB_USERNAME

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

FROM node:20-alpine AS frontend-builder

ARG DOCKER_HUB_USERNAME

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS production

ARG DOCKER_HUB_USERNAME

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

LABEL maintainer="${DOCKER_HUB_USERNAME}"
LABEL description="永远酱系统 - 完整前后端一体化部署包"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/${DOCKER_HUB_USERNAME}/forever-jiang-system"

CMD ["node", "dist/index.js"]
