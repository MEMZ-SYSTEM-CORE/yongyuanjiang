name: yongyuanjiang

title: 永远酱系统

description: 文件分发系统

license: mit

docker:
  image: onjg/yongyuanjiang:latest

  port: 3000

  environment:
    - JWT_SECRET=your-secret-key
    - CORS_ORIGIN=https://${space_id}.hf.space

resources:
  cpu: 2
  memory: 4GB
  gpu: null

health_check:
  timeout: 10s
  retries: 3
  endpoint: /api/health

app:
  type: docker
  port: 3000
