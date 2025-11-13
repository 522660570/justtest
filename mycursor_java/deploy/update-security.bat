@echo off
chcp 65001 >nul
echo =========================================
echo   MyCursor Java服务安全更新部署
echo =========================================
echo.

cd /d "%~dp0.."

echo 步骤1: 检查配置文件...
findstr /C:"password: SwaggerAdmin@2025" src\main\resources\application.yml >nul
if %errorlevel% equ 0 (
    echo [警告] 检测到使用默认密码，强烈建议修改！
    echo 请编辑 src\main\resources\application.yml 修改密码
    echo.
    set /p continue="是否继续部署？(y/n): "
    if /i not "%continue%"=="y" (
        echo 部署已取消
        exit /b 1
    )
)
echo [✓] 配置检查完成
echo.

echo 步骤2: 停止现有服务...
if exist "deploy\stop.bat" (
    call deploy\stop.bat
    timeout /t 2 /nobreak >nul
    echo [✓] 服务已停止
) else (
    echo [提示] 未找到停止脚本
    if exist "app.pid" (
        for /f %%i in (app.pid) do taskkill /F /PID %%i >nul 2>&1
        del app.pid
        timeout /t 2 /nobreak >nul
        echo [✓] 服务已停止
    ) else (
        echo [提示] 未找到运行中的服务
    )
)
echo.

echo 步骤3: 编译项目...
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo [✗] 编译失败！
    echo 请检查代码和依赖是否正确
    pause
    exit /b 1
)
echo [✓] 编译成功
echo.

echo 步骤4: 备份旧版本...
if exist "target\mycursor-0.0.1-SNAPSHOT.jar" (
    if not exist "backups" mkdir backups
    for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set mydate=%%a%%b%%c)
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a%%b)
    copy target\mycursor-0.0.1-SNAPSHOT.jar backups\mycursor-backup-%mydate%_%mytime%.jar >nul
    echo [✓] 已备份到 backups\mycursor-backup-%mydate%_%mytime%.jar
) else (
    echo [提示] 未找到旧版本JAR包，跳过备份
)
echo.

echo 步骤5: 启动服务...
if exist "deploy\start.bat" (
    call deploy\start.bat
    timeout /t 3 /nobreak >nul
    echo [✓] 服务已启动
) else (
    echo [提示] 未找到启动脚本，使用默认启动方式...
    start /b javaw -jar target\mycursor-0.0.1-SNAPSHOT.jar
    timeout /t 3 /nobreak >nul
    echo [✓] 服务已启动
)
echo.

echo 步骤6: 检查服务状态...
if exist "deploy\status.bat" (
    call deploy\status.bat
) else (
    netstat -ano | findstr :8088 >nul
    if %errorlevel% equ 0 (
        echo [✓] 服务运行中，端口8088已监听
    ) else (
        echo [✗] 服务可能未正常启动
    )
)
echo.

echo =========================================
echo 部署完成！
echo =========================================
echo.
echo 访问信息：
echo   Swagger UI: http://localhost:8088/swagger-ui.html
echo   Druid监控: http://localhost:8088/druid/index.html
echo.
echo 认证信息：
echo   用户名: admin
echo   密码: (请查看 application.yml)
echo.
echo 查看日志：
echo   type logs\mycursor.log
echo.
echo [提示] 如果使用默认密码，请尽快修改！
echo.
pause

