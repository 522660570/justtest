@echo off
chcp 65001 > nul
echo 🚀 开始构建 Cursor Manager 单文件exe...

echo.
echo 📦 步骤 1/4: 清理旧的构建文件...
if exist "dist" rmdir /s /q "dist"
if exist "dist-electron" rmdir /s /q "dist-electron"

echo.
echo 🔧 步骤 2/4: 构建前端项目...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 前端构建失败！
    pause
    exit /b 1
)

echo.
echo 📱 步骤 3/4: 构建便携式exe文件...
call npm run build-exe
if %ERRORLEVEL% NEQ 0 (
    echo ❌ exe构建失败！
    pause
    exit /b 1
)

echo.
echo 📋 步骤 4/4: 显示构建结果...
echo.
echo ✅ 构建完成！
echo.
echo 📁 输出目录: dist-electron\
dir "dist-electron\*.exe" /b 2>nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 便携式exe文件构建成功！
    echo 💡 您可以直接运行exe文件，无需安装
) else (
    echo ⚠️  未找到exe文件，请检查构建日志
)

echo.
pause


