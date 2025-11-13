#!/bin/bash

#==============================================================================
# MyCursor Application Stop Script
# Author: Auto-generated
# Description: 停止MyCursor应用服务
#==============================================================================

# 配置变量
APP_NAME="mycursor"
PID_FILE="./mycursor.pid"
WAIT_TIME=30  # 等待进程停止的最大时间（秒）

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

#==============================================================================
# 函数定义
#==============================================================================

# 打印信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# 打印警告
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 打印错误
error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查应用是否在运行
check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# 停止应用
stop_app() {
    if [ ! -f "$PID_FILE" ]; then
        warn "${APP_NAME} is not running (PID file not found)"
        return 0
    fi
    
    PID=$(cat "$PID_FILE")
    
    if ! ps -p "$PID" > /dev/null 2>&1; then
        warn "${APP_NAME} is not running (process not found)"
        rm -f "$PID_FILE"
        return 0
    fi
    
    info "Stopping ${APP_NAME} (PID: ${PID})..."
    
    # 发送TERM信号
    kill "$PID"
    
    # 等待进程停止
    local count=0
    while ps -p "$PID" > /dev/null 2>&1; do
        sleep 1
        count=$((count + 1))
        
        if [ $count -ge $WAIT_TIME ]; then
            warn "Process did not stop gracefully, forcing kill..."
            kill -9 "$PID"
            sleep 2
            break
        fi
        
        if [ $((count % 5)) -eq 0 ]; then
            info "Waiting for process to stop... (${count}s)"
        fi
    done
    
    # 检查进程是否已停止
    if ps -p "$PID" > /dev/null 2>&1; then
        error "✗ Failed to stop ${APP_NAME}!"
        return 1
    else
        rm -f "$PID_FILE"
        info "✓ ${APP_NAME} stopped successfully!"
        return 0
    fi
}

#==============================================================================
# 主程序
#==============================================================================

info "=========================================="
info "  ${APP_NAME} Stop Script"
info "=========================================="

stop_app

info "=========================================="

exit 0





















