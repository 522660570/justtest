#!/bin/bash

#==============================================================================
# MyCursor Application Status Script
# Author: Auto-generated
# Description: 查看MyCursor应用服务状态
#==============================================================================

# 配置变量
APP_NAME="mycursor"
PID_FILE="./mycursor.pid"
LOG_DIR="./logs"
APP_LOG="${LOG_DIR}/${APP_NAME}.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

#==============================================================================
# 函数定义
#==============================================================================

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 获取进程信息
get_process_info() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            # 获取进程详细信息
            CPU=$(ps -p "$PID" -o %cpu --no-headers | tr -d ' ')
            MEM=$(ps -p "$PID" -o %mem --no-headers | tr -d ' ')
            RSS=$(ps -p "$PID" -o rss --no-headers | tr -d ' ')
            RSS_MB=$((RSS / 1024))
            UPTIME=$(ps -p "$PID" -o etime --no-headers | tr -d ' ')
            USER=$(ps -p "$PID" -o user --no-headers | tr -d ' ')
            
            return 0
        fi
    fi
    return 1
}

# 获取日志文件信息
get_log_info() {
    if [ -d "$LOG_DIR" ]; then
        LOG_COUNT=$(find "$LOG_DIR" -name "*.log" -type f | wc -l)
        LOG_SIZE=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1)
    else
        LOG_COUNT=0
        LOG_SIZE="N/A"
    fi
}

# 显示应用状态
show_status() {
    echo ""
    echo "=========================================="
    echo "  ${APP_NAME} Application Status"
    echo "=========================================="
    echo ""
    
    if get_process_info; then
        success "Status: RUNNING"
        echo "  PID:          ${PID}"
        echo "  User:         ${USER}"
        echo "  Uptime:       ${UPTIME}"
        echo "  CPU Usage:    ${CPU}%"
        echo "  Memory Usage: ${MEM}% (${RSS_MB} MB)"
        echo ""
    else
        error "Status: STOPPED"
        if [ -f "$PID_FILE" ]; then
            warning "PID file exists but process not found"
        fi
        echo ""
    fi
    
    # 日志信息
    get_log_info
    echo "Log Information:"
    echo "  Log Directory: ${LOG_DIR}"
    echo "  Log Files:     ${LOG_COUNT}"
    echo "  Total Size:    ${LOG_SIZE}"
    
    if [ -f "$APP_LOG" ]; then
        LAST_MODIFIED=$(stat -c %y "$APP_LOG" 2>/dev/null | cut -d'.' -f1)
        echo "  Last Modified: ${LAST_MODIFIED}"
    fi
    
    echo ""
    echo "=========================================="
    
    # 显示最近的日志
    if [ -f "$APP_LOG" ]; then
        echo ""
        info "Recent Logs (last 20 lines):"
        echo "=========================================="
        tail -n 20 "$APP_LOG"
        echo "=========================================="
    fi
}

# 显示帮助信息
show_help() {
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -f, --follow   Follow log output (like tail -f)"
    echo "  -l, --logs     Show last 50 lines of logs"
    echo ""
}

#==============================================================================
# 主程序
#==============================================================================

# 处理参数
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    -f|--follow)
        if [ -f "$APP_LOG" ]; then
            info "Following logs (Ctrl+C to stop)..."
            tail -f "$APP_LOG"
        else
            error "Log file not found: ${APP_LOG}"
            exit 1
        fi
        ;;
    -l|--logs)
        if [ -f "$APP_LOG" ]; then
            tail -n 50 "$APP_LOG"
        else
            error "Log file not found: ${APP_LOG}"
            exit 1
        fi
        ;;
    *)
        show_status
        ;;
esac

exit 0





















