#!/bin/bash

#==============================================================================
# MyCursor Application Restart Script
# Author: Auto-generated
# Description: 重启MyCursor应用服务
#==============================================================================

APP_NAME="mycursor"

# 颜色输出
GREEN='\033[0;32m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

info "=========================================="
info "  ${APP_NAME} Restart Script"
info "=========================================="

# 停止应用
info "Step 1: Stopping application..."
./stop.sh

# 等待一秒
sleep 1

# 启动应用
info ""
info "Step 2: Starting application..."
./start.sh

info "=========================================="





















