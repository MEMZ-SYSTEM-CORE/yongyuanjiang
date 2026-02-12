ARG DOCKER_HUB_USERNAME=foreverjiang

FROM node:20-alpine AS builder

ARG DOCKER_HUB_USERNAME

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:alpine AS production

ARG DOCKER_HUB_USERNAME

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

LABEL maintainer="${DOCKER_HUB_USERNAME}"
LABEL description="永远酱系统前端界面"
LABEL version="1.0.0"

CMD ["nginx", "-g", "daemon off;"]
