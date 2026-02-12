ARG DOCKER_HUB_USERNAME=foreverjiang

FROM node:20-alpine AS builder

ARG DOCKER_HUB_USERNAME

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

FROM node:20-alpine AS production

ARG DOCKER_HUB_USERNAME

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY backend/data ./data
COPY backend/uploads ./uploads
COPY backend/logs ./logs

EXPOSE 3000

LABEL maintainer="${DOCKER_HUB_USERNAME}"
LABEL description="永远酱系统后端服务"
LABEL version="1.0.0"

CMD ["node", "dist/index.js"]
