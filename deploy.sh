#!/bin/bash

################################################################################
# 永远酱系统 - Docker镜像构建与上传脚本
# 用于打包并上传镜像到Docker Hub
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认配置
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-foreverjiang}"
IMAGE_BACKEND="${DOCKER_HUB_USERNAME}/forever-jiang-backend"
IMAGE_FRONTEND="${DOCKER_HUB_USERNAME}/forever-jiang-frontend"
VERSION="${VERSION:-latest}"
TAG_BACKEND="${IMAGE_BACKEND}:${VERSION}"
TAG_FRONTEND="${IMAGE_FRONTEND}:${VERSION}"
LATEST_BACKEND="${IMAGE_BACKEND}:latest"
LATEST_FRONTEND="${IMAGE_FRONTEND}:latest"

# 打印函数
print_step() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 检查必要工具
check_requirements() {
    print_step "检查必要工具"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    print_success "Docker已安装: $(docker --version)"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker未运行，请启动Docker服务"
        exit 1
    fi
    print_success "Docker服务运行中"
    
    if [ -z "$DOCKER_HUB_USERNAME" ]; then
        print_error "DOCKER_HUB_USERNAME环境变量未设置"
        echo "请设置: export DOCKER_HUB_USERNAME=your-username"
        exit 1
    fi
    print_success "Docker Hub用户名: $DOCKER_HUB_USERNAME"
}

# 登录Docker Hub
login_docker_hub() {
    print_step "登录Docker Hub"
    
    if [ -n "$DOCKER_HUB_PASSWORD" ]; then
        echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
        print_success "登录成功"
    else
        if docker info &> /dev/null | grep -q "Username: $DOCKER_HUB_USERNAME"; then
            print_success "已登录Docker Hub"
        else
            print_warning "未登录Docker Hub，请手动登录"
            docker login -u "$DOCKER_HUB_USERNAME"
        fi
    fi
}

# 构建后端镜像
build_backend() {
    print_step "构建后端镜像: $TAG_BACKEND"
    
    cd "$(dirname "$0")"
    
    docker build \
        --build-arg DOCKER_HUB_USERNAME="$DOCKER_HUB_USERNAME" \
        -t "$TAG_BACKEND" \
        -t "$LATEST_BACKEND" \
        -f backend/Dockerfile \
        .
    
    print_success "后端镜像构建完成: $TAG_BACKEND"
    docker images "$IMAGE_BACKEND" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.ID}}"
}

# 构建前端镜像
build_frontend() {
    print_step "构建前端镜像: $TAG_FRONTEND"
    
    cd "$(dirname "$0")"
    
    docker build \
        --build-arg DOCKER_HUB_USERNAME="$DOCKER_HUB_USERNAME" \
        -t "$TAG_FRONTEND" \
        -t "$LATEST_FRONTEND" \
        -f frontend/Dockerfile \
        .
    
    print_success "前端镜像构建完成: $TAG_FRONTEND"
    docker images "$IMAGE_FRONTEND" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.ID}}"
}

# 推送镜像
push_image() {
    local image_name="$1"
    local tag="$2"
    
    print_step "推送镜像: ${image_name}:${tag}"
    
    docker tag "$image_name" "${image_name}:${tag}"
    docker push "${image_name}:${tag}"
    
    print_success "推送完成: ${image_name}:${tag}"
}

# 打标签
tag_image() {
    local source_tag="$1"
    local target_tag="$2"
    
    print_step "打标签: $source_tag -> $target_tag"
    docker tag "$source_tag" "$target_tag"
    print_success "标签创建成功"
}

# 完整构建并上传
build_and_push_all() {
    print_step "开始完整构建与上传流程"
    
    check_requirements
    login_docker_hub
    
    print_step "构建所有镜像"
    build_backend
    build_frontend
    
    print_step "推送镜像到Docker Hub"
    push_image "$IMAGE_BACKEND" "$VERSION"
    push_image "$IMAGE_BACKEND" "latest"
    push_image "$IMAGE_FRONTEND" "$VERSION"
    push_image "$IMAGE_FRONTEND" "latest"
    
    print_step "上传完成"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  镜像已成功上传到Docker Hub${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "后端镜像: $TAG_BACKEND"
    echo "前端镜像: $TAG_FRONTEND"
    echo ""
    echo "拉取命令:"
    echo "  docker pull $IMAGE_BACKEND:$VERSION"
    echo "  docker pull $IMAGE_FRONTEND:$VERSION"
}

# 仅构建
build_only() {
    print_step "仅构建镜像（不上传）"
    
    check_requirements
    build_backend
    build_frontend
    
    print_step "构建完成"
    echo ""
    echo -e "${GREEN}镜像构建成功${NC}"
    echo ""
    echo "后端镜像: $TAG_BACKEND"
    echo "前端镜像: $TAG_FRONTEND"
}

# 仅上传
push_only() {
    print_step "仅上传已构建的镜像"
    
    check_requirements
    login_docker_hub
    
    print_step "推送镜像"
    push_image "$IMAGE_BACKEND" "$VERSION"
    push_image "$IMAGE_BACKEND" "latest"
    push_image "$IMAGE_FRONTEND" "$VERSION"
    push_image "$IMAGE_FRONTEND" "latest"
    
    print_step "推送完成"
}

# 显示帮助
show_help() {
    echo ""
    echo "永远酱系统 - Docker镜像构建与上传脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  all           构建并上传所有镜像（默认）"
    echo "  build         仅构建镜像，不上传"
    echo "  push          仅上传已构建的镜像"
    echo "  login         登录Docker Hub"
    echo "  help          显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DOCKER_HUB_USERNAME    Docker Hub用户名（必填）"
    echo "  DOCKER_HUB_PASSWORD   Docker Hub密码（可选，通过环境变量登录）"
    echo "  VERSION               镜像版本标签（默认: latest）"
    echo ""
    echo "示例:"
    echo "  DOCKER_HUB_USERNAME=myuser ./deploy.sh all"
    echo "  DOCKER_HUB_USERNAME=myuser VERSION=v1.0.0 ./deploy.sh all"
    echo ""
}

# 主程序
main() {
    cd "$(dirname "$0")"
    
    case "${1:-all}" in
        all)
            build_and_push_all
            ;;
        build)
            build_only
            ;;
        push)
            push_only
            ;;
        login)
            login_docker_hub
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
