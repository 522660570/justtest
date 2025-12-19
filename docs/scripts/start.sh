#!/bin/bash

echo "========================================"
echo "    Cursor Manager - 启动脚本"
echo "========================================"
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到Node.js，请先安装Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "[信息] Node.js版本:"
node --version
echo

# 检查npm是否可用
if ! command -v npm &> /dev/null; then
    echo "[错误] npm不可用，请检查Node.js安装"
    exit 1
fi

echo "[信息] npm版本:"
npm --version
echo

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "[信息] 首次运行，正在安装依赖..."
    echo
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        exit 1
    fi
    echo
    echo "[成功] 依赖安装完成"
    echo
fi

# 启动开发服务器
echo "[信息] 正在启动Cursor Manager..."
echo "[提示] 请等待应用窗口打开"
echo "[提示] 按Ctrl+C可以停止服务"
echo

# 在后台启动开发服务器
npm run dev &

# 等待开发服务器启动
sleep 5

# 启动Electron
npm run electron

