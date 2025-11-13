#!/bin/bash

#==============================================================================
# MyCursor Application Startup Script
# Author: Auto-generated
# Description: 启动MyCursor应用服务，支持日志滚动和后台运行
#==============================================================================

# 配置变量
APP_NAME="mycursor"
JAR_NAME="mycursor-0.0.1-SNAPSHOT.jar"
JAR_PATH="../target/${JAR_NAME}"
PID_FILE="./mycursor.pid"
LOG_DIR="./logs"
STARTUP_LOG="${LOG_DIR}/startup.log"

# JVM参数配置
JVM_OPTS="-Xms512m -Xmx1024m"
JVM_OPTS="${JVM_OPTS} -XX:+UseG1GC"
JVM_OPTS="${JVM_OPTS} -XX:MaxGCPauseMillis=200"
JVM_OPTS="${JVM_OPTS} -XX:+HeapDumpOnOutOfMemoryError"
JVM_OPTS="${JVM_OPTS} -XX:HeapDumpPath=${LOG_DIR}/heap-dump.hprof"

# Spring Boot配置
SPRING_OPTS="--spring.profiles.active=prod"

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

# 检查Java环境
check_java() {
    if [ -z "$JAVA_HOME" ]; then
        warn "JAVA_HOME is not set, trying to find java in PATH..."
        JAVA_CMD=$(which java)
        if [ -z "$JAVA_CMD" ]; then
            error "Java is not installed or not in PATH!"
            exit 1
        fi
    else
        JAVA_CMD="${JAVA_HOME}/bin/java"
    fi
    
    # 检查Java版本
    JAVA_VERSION=$($JAVA_CMD -version 2>&1 | awk -F '"' '/version/ {print $2}')
    info "Using Java version: ${JAVA_VERSION}"
}

# 检查应用是否已运行
check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        else
            # PID文件存在但进程不存在，清理PID文件
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# 创建必要的目录
create_dirs() {
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        info "Created log directory: ${LOG_DIR}"
    fi
}

# 启动应用
start_app() {
    info "Starting ${APP_NAME}..."
    
    # 检查JAR文件是否存在
    if [ ! -f "$JAR_PATH" ]; then
        error "JAR file not found: ${JAR_PATH}"
        error "Please build the project first: cd .. && mvn clean package"
        exit 1
    fi
    
    # 启动应用
    nohup $JAVA_CMD $JVM_OPTS -jar "$JAR_PATH" $SPRING_OPTS >> "$STARTUP_LOG" 2>&1 &
    
    # 保存PID
    echo $! > "$PID_FILE"
    PID=$(cat "$PID_FILE")
    
    info "Application starting with PID: ${PID}"
    info "Startup log: ${STARTUP_LOG}"
    
    # 等待应用启动
    sleep 3
    
    # 检查是否启动成功
    if ps -p "$PID" > /dev/null 2>&1; then
        info "✓ ${APP_NAME} started successfully!"
        info "PID: ${PID}"
        info "Log directory: ${LOG_DIR}"
        info "You can check logs with: tail -f ${LOG_DIR}/${APP_NAME}.log"
    else
        error "✗ Failed to start ${APP_NAME}!"
        error "Please check the startup log: ${STARTUP_LOG}"
        rm -f "$PID_FILE"
        exit 1
    fi
}

#==============================================================================
# 主程序
#==============================================================================

info "=========================================="
info "  ${APP_NAME} Startup Script"
info "=========================================="

# 1. 检查Java环境
check_java

# 2. 检查应用是否已运行
if check_running; then
    PID=$(cat "$PID_FILE")
    warn "${APP_NAME} is already running with PID: ${PID}"
    warn "If you want to restart, please run: ./stop.sh && ./start.sh"
    exit 1
fi

# 3. 创建必要的目录
create_dirs

# 4. 启动应用
start_app

info "=========================================="





















