#!/usr/bin/env pwsh

################################################################################
# 永远酱系统 - Docker镜像构建与上传脚本 (Windows PowerShell)
# 用于打包并上传镜像到Docker Hub
################################################################################

$ErrorActionPreference = "Stop"

# 颜色定义
$Green = [char]0x1B + "[0;32m"
$Yellow = [char]0x1B + "[1;33m"
$Blue = [char]0x1B + "[0;34m"
$Red = [char]0x1B + "[0;31m"
$NC = [char]0x1B + "[0m"

# 默认配置
$DOCKER_HUB_USERNAME = $env:DOCKER_HUB_USERNAME ?? "foreverjiang"
$IMAGE_BACKEND = "$DOCKER_HUB_USERNAME/forever-jiang-backend"
$IMAGE_FRONTEND = "$DOCKER_HUB_USERNAME/forever-jiang-frontend"
$VERSION = $env:VERSION ?? "latest"
$TAG_BACKEND = "$IMAGE_BACKEND`:$VERSION"
$TAG_FRONTEND = "$IMAGE_FRONTEND`:$VERSION"
$LATEST_BACKEND = "$IMAGE_BACKEND`:latest"
$LATEST_FRONTEND = "$IMAGE_FRONTEND`:latest"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "$([char]0x1B)[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$[char]0x1B)[0m" -NoNewline
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "$([char]0x1B)[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$[char]0x1B)[0m"
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# 检查必要工具
function Test-Requirements {
    Write-Step "检查必要工具"
    
    try {
        $dockerVersion = docker --version
        Write-Success "Docker已安装: $dockerVersion"
    }
    catch {
        Write-Error "Docker未安装，请先安装Docker"
        exit 1
    }
    
    try {
        docker info | Out-Null
        Write-Success "Docker服务运行中"
    }
    catch {
        Write-Error "Docker未运行，请启动Docker服务"
        exit 1
    }
    
    if ([string]::IsNullOrEmpty($DOCKER_HUB_USERNAME)) {
        Write-Error "DOCKER_HUB_USERNAME环境变量未设置"
        Write-Host "请设置: `$env:DOCKER_HUB_USERNAME='your-username'"
        exit 1
    }
    Write-Success "Docker Hub用户名: $DOCKER_HUB_USERNAME"
}

# 登录Docker Hub
function Invoke-Login {
    Write-Step "登录Docker Hub"
    
    if (-not [string]::IsNullOrEmpty($env:DOCKER_HUB_PASSWORD)) {
        $env:DOCKER_HUB_PASSWORD | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
        Write-Success "登录成功"
    }
    else {
        $dockerInfo = docker info 2>&1 | Out-String
        if ($dockerInfo -match "Username: $DOCKER_HUB_USERNAME") {
            Write-Success "已登录Docker Hub"
        }
        else {
            Write-Warning "未登录Docker Hub，请手动登录"
            docker login -u "$DOCKER_HUB_USERNAME"
        }
    }
}

# 构建后端镜像
function Invoke-BuildBackend {
    Write-Step "构建后端镜像: $TAG_BACKEND"
    
    $scriptPath = Split-Path -Parent (Get-Module -Name -ListAvailable | Where-Object {$_.Name -eq 'ThreadJob'} | Select-Object -First 1).Path 2>$null
    $rootPath = (Get-Location).Path
    
    docker build `
        --build-arg "DOCKER_HUB_USERNAME=$DOCKER_HUB_USERNAME" `
        -t $TAG_BACKEND `
        -t $LATEST_BACKEND `
        -f (Join-Path $rootPath "backend/Dockerfile") `
        $rootPath
    
    Write-Success "后端镜像构建完成: $TAG_BACKEND"
    docker images $IMAGE_BACKEND --format "table {{.Repository}}:{{.Tag}}	{{.Size}}	{{.ID}}"
}

# 构建前端镜像
function Invoke-BuildFrontend {
    Write-Step "构建前端镜像: $TAG_FRONTEND"
    
    $rootPath = (Get-Location).Path
    
    docker build `
        --build-arg "DOCKER_HUB_USERNAME=$DOCKER_HUB_USERNAME" `
        -t $TAG_FRONTEND `
        -t $LATEST_FRONTEND `
        -f (Join-Path $rootPath "frontend/Dockerfile") `
        $rootPath
    
    Write-Success "前端镜像构建完成: $TAG_FRONTEND"
    docker images $IMAGE_FRONTEND --format "table {{.Repository}}:{{.Tag}}	{{.Size}}	{{.ID}}"
}

# 推送镜像
function Invoke-PushImage {
    param(
        [string]$ImageName,
        [string]$Tag
    )
    
    Write-Step "推送镜像: ${ImageName}:${Tag}"
    docker push "${ImageName}:${Tag}"
    Write-Success "推送完成: ${ImageName}:${Tag}"
}

# 完整构建并上传
function Invoke-BuildAndPushAll {
    Write-Step "开始完整构建与上传流程"
    
    Test-Requirements
    Invoke-Login
    
    Write-Step "构建所有镜像"
    Invoke-BuildBackend
    Invoke-BuildFrontend
    
    Write-Step "推送镜像到Docker Hub"
    Invoke-PushImage -ImageName $IMAGE_BACKEND -Tag $VERSION
    Invoke-PushImage -ImageName $IMAGE_BACKEND -Tag "latest"
    Invoke-PushImage -ImageName $IMAGE_FRONTEND -Tag $VERSION
    Invoke-PushImage -ImageName $IMAGE_FRONTEND -Tag "latest"
    
    Write-Step "上传完成"
    Write-Host ""
    Write-Host "$([char]0x1B)[0;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$[char]0x1B)[0m" -NoNewline
    Write-Host "  镜像已成功上传到Docker Hub" -ForegroundColor Green
    Write-Host "$([char]0x1B)[0;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$[char]0x1B)[0m"
    Write-Host ""
    Write-Host "后端镜像: $TAG_BACKEND"
    Write-Host "前端镜像: $TAG_FRONTEND"
    Write-Host ""
    Write-Host "拉取命令:"
    Write-Host "  docker pull $IMAGE_BACKEND`:$VERSION"
    Write-Host "  docker pull $IMAGE_FRONTEND`:$VERSION"
}

# 仅构建
function Invoke-BuildOnly {
    Write-Step "仅构建镜像（不上传）"
    
    Test-Requirements
    Invoke-BuildBackend
    Invoke-BuildFrontend
    
    Write-Step "构建完成"
    Write-Host ""
    Write-Success "镜像构建成功"
    Write-Host ""
    Write-Host "后端镜像: $TAG_BACKEND"
    Write-Host "前端镜像: $TAG_FRONTEND"
}

# 仅上传
function Invoke-PushOnly {
    Write-Step "仅上传已构建的镜像"
    
    Test-Requirements
    Invoke-Login
    
    Write-Step "推送镜像"
    Invoke-PushImage -ImageName $IMAGE_BACKEND -Tag $VERSION
    Invoke-PushImage -ImageName $IMAGE_BACKEND -Tag "latest"
    Invoke-PushImage -ImageName $IMAGE_FRONTEND -Tag $VERSION
    Invoke-PushImage -ImageName $IMAGE_FRONTEND -Tag "latest"
    
    Write-Step "推送完成"
}

# 显示帮助
function Show-Help {
    Write-Host ""
    Write-Host "永远酱系统 - Docker镜像构建与上传脚本 (Windows PowerShell)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "用法: .\deploy.ps1 [命令]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "可用命令:" -ForegroundColor Yellow
    Write-Host "  all           构建并上传所有镜像（默认）"
    Write-Host "  build         仅构建镜像，不上传"
    Write-Host "  push          仅上传已构建的镜像"
    Write-Host "  login         登录Docker Hub"
    Write-Host "  help          显示此帮助信息"
    Write-Host ""
    Write-Host "环境变量:" -ForegroundColor Yellow
    Write-Host "  DOCKER_HUB_USERNAME    Docker Hub用户名（必填）"
    Write-Host "  DOCKER_HUB_PASSWORD   Docker Hub密码（可选，通过环境变量登录）"
    Write-Host "  VERSION               镜像版本标签（默认: latest）"
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  `$env:DOCKER_HUB_USERNAME='myuser'; `.\deploy.ps1 all"
    Write-Host "  `$env:DOCKER_HUB_USERNAME='myuser'; `$env:VERSION='v1.0.0'; `.\deploy.ps1 all"
    Write-Host ""
}

# 主程序
$command = $args[0] ?? "all"

switch ($command.ToLower()) {
    "all" {
        Invoke-BuildAndPushAll
        break
    }
    "build" {
        Invoke-BuildOnly
        break
    }
    "push" {
        Invoke-PushOnly
        break
    }
    "login" {
        Invoke-Login
        break
    }
    "help" {
        Show-Help
        break
    }
    default {
        Write-Error "未知命令: $command"
        Show-Help
        exit 1
    }
}
