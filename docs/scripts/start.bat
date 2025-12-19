@echo off
echo ========================================
echo    Cursor Manager - 启动脚本
echo ========================================
echo.

:: 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [信息] Node.js版本:
node --version
echo.

:: 检查npm是否可用
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] npm不可用，请检查Node.js安装
    pause
    exit /b 1
)

echo [信息] npm版本:
npm --version
echo.

:: 检查是否已安装依赖
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装依赖...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
    echo [成功] 依赖安装完成
    echo.
)

:: 启动开发服务器
echo [信息] 正在启动Cursor Manager...
echo [提示] 请等待浏览器窗口打开
echo [提示] 按Ctrl+C可以停止服务
echo.

start /b npm run dev

:: 等待开发服务器启动
timeout /t 5 /nobreak >nul

:: 启动Electron
npm run electron

pause

