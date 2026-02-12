# Docker Hub 镜像上传指南

本指南详细说明如何将永远酱系统的Docker镜像打包并上传到Docker Hub。

## 一、准备工作

### 1.1 创建Docker Hub账户

如果您还没有Docker Hub账户，请访问 [Docker Hub官网](https://hub.docker.com) 注册一个账户。注册完成后，创建一个仓库（Repository），建议仓库命名为：
- `forever-jiang-backend` - 后端服务镜像
- `forever-jiang-frontend` - 前端界面镜像

### 1.2 安装Docker环境

确保您的服务器或本地机器已安装Docker和Docker Compose。验证安装命令如下：

```bash
docker --version
docker-compose --version
```

推荐版本要求：
- Docker Engine 20.10 或更高版本
- Docker Compose 2.0 或更高版本

### 1.3 获取项目代码

克隆或下载永远酱系统源代码到本地：

```bash
git clone <repository-url>
cd forever-jiang-system
```

## 二、配置Docker Hub信息

### 2.1 设置环境变量

在上传镜像之前，需要设置Docker Hub用户名环境变量。打开终端执行：

**Linux/macOS (Bash):**
```bash
export DOCKER_HUB_USERNAME="your-dockerhub-username"
```

**Windows (PowerShell):**
```powershell
$env:DOCKER_HUB_USERNAME="your-dockerhub-username"
```

或者创建一个`.env`文件（项目根目录已存在）：

```bash
DOCKER_HUB_USERNAME=your-dockerhub-username
```

### 2.2 可选配置项

除必需的用户名外，以下环境变量可用于自定义构建过程：

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| `DOCKER_HUB_USERNAME` | Docker Hub用户名 | foreverjiang |
| `VERSION` | 镜像版本标签 | latest |
| `DOCKER_HUB_PASSWORD` | Docker Hub密码（用于脚本自动登录） | - |

## 三、镜像打包

### 3.1 使用部署脚本（推荐）

项目提供了两个部署脚本，分别适用于不同的操作系统：

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows PowerShell:**
```powershell
.\deploy.ps1
```

脚本支持以下命令：
- `all` - 构建并上传所有镜像（默认）
- `build` - 仅构建镜像，不上传
- `push` - 仅上传已构建的镜像
- `login` - 仅登录Docker Hub
- `help` - 显示帮助信息

**完整构建并上传示例：**
```bash
DOCKER_HUB_USERNAME=myusername VERSION=v1.0.0 ./deploy.sh all
```

### 3.2 手动构建

如果需要手动构建镜像，请按以下步骤操作：

**步骤一：构建后端镜像**

```bash
cd /path/to/forever-jiang-system

docker build \
    --build-arg DOCKER_HUB_USERNAME=$DOCKER_HUB_USERNAME \
    -t $DOCKER_HUB_USERNAME/forever-jiang-backend:latest \
    -t $DOCKER_HUB_USERNAME/forever-jiang-backend:v1.0.0 \
    -f backend/Dockerfile .
```

**步骤二：构建前端镜像**

```bash
docker build \
    --build-arg DOCKER_HUB_USERNAME=$DOCKER_HUB_USERNAME \
    -t $DOCKER_HUB_USERNAME/forever-jiang-frontend:latest \
    -t $DOCKER_HUB_USERNAME/forever-jiang-frontend:v1.0.0 \
    -f frontend/Dockerfile .
```

**验证构建结果：**
```bash
docker images | grep forever-jiang
```

### 3.3 镜像标签说明

Docker Hub支持多种标签，常见的标签策略包括：

| 标签类型 | 示例 | 说明 |
|---------|------|------|
| latest | `:latest` | 最新稳定版（默认使用） |
| 版本号 | `:v1.0.0` | 具体版本发布 |
| 日期标签 | `:20240212` | 构建日期 |
| Git提交 | `:gabc1234` | Git提交哈希 |

建议使用语义化版本控制（SemVer），例如：
- `:1.0.0` - 首次正式发布
- `:1.0.1` - 修复补丁
- `:1.1.0` - 新功能更新

## 四、镜像上传

### 4.1 登录Docker Hub

在上传镜像之前，需要先登录Docker Hub：

```bash
docker login -u $DOCKER_HUB_USERNAME
```

系统会提示输入密码。密码输入时不可见，输入完成后按回车确认。

如果使用脚本，可通过环境变量提供密码（不推荐，可能泄露密码）：

```bash
export DOCKER_HUB_PASSWORD="your-password"
./deploy.sh all
```

### 4.2 推送镜像

登录成功后，执行以下命令推送镜像：

**推送后端镜像：**
```bash
docker push $DOCKER_HUB_USERNAME/forever-jiang-backend:latest
docker push $DOCKER_HUB_USERNAME/forever-jiang-backend:v1.0.0
```

**推送前端镜像：**
```bash
docker push $DOCKER_HUB_USERNAME/forever-jiang-frontend:latest
docker push $DOCKER_HUB_USERNAME/forever-jiang-frontend:v1.0.0
```

### 4.3 验证上传

访问Docker Hub网站，登录您的账户，检查仓库是否已成功上传镜像：

- 后端镜像仓库：https://hub.docker.com/r/[用户名]/forever-jiang-backend
- 前端镜像仓库：https://hub.docker.com/r/[用户名]/forever-jiang-frontend

## 五、从Docker Hub拉取使用

### 5.1 拉取镜像

其他机器或服务器可以使用以下命令拉取已上传的镜像：

```bash
# 拉取后端镜像
docker pull $DOCKER_HUB_USERNAME/forever-jiang-backend:latest

# 拉取前端镜像
docker pull $DOCKER_HUB_USERNAME/forever-jiang-frontend:latest
```

### 5.2 使用Docker Compose部署

创建或修改`docker-compose.yml`文件，从Docker Hub拉取镜像：

```yaml
version: '3.8'

services:
  backend:
    image: your-username/forever-jiang-backend:latest
    container_name: forever-jiang-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
    volumes:
      - uploads:/app/uploads
      - data:/app/data
      - logs:/app/logs

  frontend:
    image: your-username/forever-jiang-frontend:latest
    container_name: forever-jiang-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  uploads:
  data:
  logs:
```

启动服务：
```bash
docker-compose up -d
```

### 5.3 使用覆盖配置

项目提供了`docker-compose.hub.yml`用于从Docker Hub拉取镜像：

```bash
# 设置环境变量
export DOCKER_HUB_USERNAME=your-username
export TAG=v1.0.0

# 使用覆盖配置启动
docker-compose -f docker-compose.yml -f docker-compose.hub.yml up -d
```

## 六、常见问题

### 6.1 上传失败

**问题：推送镜像时出现 "denied: requested access to the resource is denied" 错误**

解决方法：
1. 确认Docker Hub用户名正确
2. 确保已登录：`docker login`
3. 检查镜像标签是否与您的仓库名称匹配
4. 如果使用组织账户，确保有该仓库的推送权限

**问题：镜像过大导致上传超时**

解决方法：
1. 检查网络连接
2. 考虑使用Docker Hub的自动构建功能
3. 上传前压缩镜像：`docker save | gzip | docker load`

### 6.2 镜像标签错误

**问题：如何修改已推送的标签？**

Docker Hub不支持修改已推送标签。如需修改，需要：
1. 删除原有标签（通过Docker Hub界面）
2. 重新推送正确的标签

**问题：能否同时推送多个标签？**

可以，在推送时使用循环：

```bash
for tag in latest v1.0.0 v1.0.1; do
    docker tag backend:latest $DOCKER_HUB_USERNAME/forever-jiang-backend:$tag
    docker push $DOCKER_HUB_USERNAME/forever-jiang-backend:$tag
done
```

### 6.3 磁盘空间不足

**问题：构建镜像时磁盘空间不足**

解决方法：
1. 清理未使用的Docker对象：`docker system prune -a`
2. 删除悬空镜像：`docker image prune`
3. 删除停止的容器：`docker container prune`

## 七、自动化构建（可选）

### 7.1 Docker Hub自动构建

Docker Hub支持自动构建，可以实现代码提交后自动构建镜像：

1. 登录Docker Hub，进入您的仓库设置
2. 链接到GitHub/GitLab仓库
3. 配置构建规则：
   - 设置源代码分支（如 `main`）
   - 设置Dockerfile路径（`backend/Dockerfile` 或 `frontend/Dockerfile`）
   - 配置标签规则（如 `main -> latest`）
4. 保存设置并触发首次构建

### 7.2 GitHub Actions

如果使用GitHub，可以配置Actions自动推送到Docker Hub。创建`.github/workflows/docker.yml`：

```yaml
name: Docker Build and Push

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
        
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_PASSWORD }}
          
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKER_HUB_USERNAME }}/forever-jiang-backend:latest
          
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ${{ secrets.DOCKER_HUB_USERNAME }}/forever-jiang-frontend:latest
```

## 八、安全建议

### 8.1 镜像安全

- 定期更新基础镜像以获取安全补丁
- 使用最小化基础镜像（如 `node:20-alpine`）
- 避免在镜像中包含敏感信息
- 使用多阶段构建减小镜像体积

### 8.2 凭证管理

- 不要在代码中硬编码Docker Hub密码
- 使用GitHub Secrets或环境变量存储敏感信息
- 定期轮换Docker Hub访问令牌

## 九、镜像信息

上传到Docker Hub后，镜像信息如下：

### 后端镜像

| 属性 | 值 |
|-----|-----|
| 镜像名称 | `[用户名]/forever-jiang-backend` |
| 基础镜像 | node:20-alpine |
| 暴露端口 | 3000 |
| 默认命令 | `node dist/index.js` |

### 前端镜像

| 属性 | 值 |
|-----|-----|
| 镜像名称 | `[用户名]/forever-jiang-frontend` |
| 基础镜像 | nginx:alpine |
| 暴露端口 | 80 |
| 默认命令 | `nginx -g "daemon off;"` |

## 十、相关资源

- Docker Hub官网：https://hub.docker.com
- Docker官方文档：https://docs.docker.com
- Docker Hub API文档：https://docs.docker.com/docker-hub/api/latest/
