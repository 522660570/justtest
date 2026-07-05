# Tauri 便携版打包脚本
# 用途：创建一个双击就能运行的便携版，不需要安装

Write-Host "🚀 开始构建 Tauri 便携版..." -ForegroundColor Green

# 1. 构建 Tauri 应用
Write-Host "`n📦 正在构建 Tauri 应用..." -ForegroundColor Cyan
npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败！" -ForegroundColor Red
    exit 1
}

# 2. 获取版本号
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$version = $packageJson.version
Write-Host "`n✅ 版本号: $version" -ForegroundColor Green

# 3. 创建便携版目录
$portableDir = "dist-portable\Cursor续杯_v${version}_portable"
Write-Host "`n📁 创建便携版目录: $portableDir" -ForegroundColor Cyan
if (Test-Path $portableDir) {
    Remove-Item -Recurse -Force $portableDir
}
New-Item -ItemType Directory -Force -Path $portableDir | Out-Null

# 4. 复制可执行文件
Write-Host "`n📋 复制可执行文件..." -ForegroundColor Cyan
$exePath = "src-tauri\target\release\cursor-manager.exe"
if (-not (Test-Path $exePath)) {
    $exePath = "src-tauri\target\release\app.exe"
}

if (Test-Path $exePath) {
    Copy-Item $exePath "$portableDir\Cursor续杯.exe"
    Write-Host "✅ 复制成功: Cursor续杯.exe" -ForegroundColor Green
} else {
    Write-Host "❌ 找不到可执行文件！" -ForegroundColor Red
    exit 1
}

# 5. 创建启动说明文件
Write-Host "`n📝 创建使用说明..." -ForegroundColor Cyan
$readme = @"
# Cursor续杯 - 便携版 v${version}

## 🚀 使用说明

1. **双击运行**：直接双击 `Cursor续杯.exe` 即可运行，无需安装
2. **首次运行**：可能需要安装 WebView2 运行时（程序会自动提示）
3. **数据保存**：配置文件保存在当前目录，方便备份和迁移

## ⚠️ 重要提示

### 系统要求
- Windows 10/11（64位）
- WebView2 运行时（首次运行会自动引导安装）

### WebView2 运行时安装
如果程序提示缺少 WebView2，请按以下步骤操作：

**方法 1：自动安装（推荐）**
- 程序会自动提示下载 WebView2
- 点击确定后会打开下载页面
- 下载并安装后重启程序

**方法 2：手动下载**
- 访问：https://go.microsoft.com/fwlink/p/?LinkId=2124703
- 下载 "Evergreen Standalone Installer"
- 双击安装后重启程序

**方法 3：离线安装包**
- 如果无法联网，可以使用离线安装包
- 下载地址：https://developer.microsoft.com/zh-cn/microsoft-edge/webview2/

### 常见问题

**Q: 双击后没有反应？**
A: 检查是否安装了 WebView2 运行时，查看任务管理器中是否有进程

**Q: 提示"缺少 dll 文件"？**
A: 安装 Visual C++ Redistributable
   下载：https://aka.ms/vs/17/release/vc_redist.x64.exe

**Q: 杀毒软件报毒？**
A: 这是误报，请添加到白名单
   本软件开源，代码可在 GitHub 查看

**Q: 如何卸载？**
A: 直接删除整个文件夹即可，不会留下任何残留

## ✨ 功能特性

- 🔄 **无感换号**：额度用完自动续杯，无需重启 Cursor
- ⚡ **一键续杯**：手动切换账号，支持热切换
- 🔑 **机器码重置**：每次换号自动重置机器码
- 📊 **实时监控**：自动监控额度使用情况

## 📞 技术支持

- QQ: 522660570
- 遇到问题请提供详细的错误信息截图

## 📄 更新日志

v${version}
- 优化便携版打包
- 修复已知问题
- 提升稳定性

---

**提示**：如果需要在多台电脑使用，直接复制整个文件夹即可！
"@

$readme | Out-File -FilePath "$portableDir\使用说明.txt" -Encoding UTF8
Write-Host "✅ 使用说明创建成功" -ForegroundColor Green

# 6. 创建一键启动脚本（可选）
$launcher = @"
@echo off
title Cursor续杯
echo.
echo ========================================
echo   Cursor续杯 v${version} - 便携版
echo ========================================
echo.
echo 正在启动，请稍候...
echo.

start "" "Cursor续杯.exe"
exit
"@

$launcher | Out-File -FilePath "$portableDir\一键启动.bat" -Encoding Default
Write-Host "✅ 一键启动脚本创建成功" -ForegroundColor Green

# 7. 获取文件信息
$exeSize = [math]::Round((Get-Item "$portableDir\Cursor续杯.exe").Length / 1MB, 2)
Write-Host "`n📊 文件信息：" -ForegroundColor Yellow
Write-Host "   可执行文件大小: $exeSize MB" -ForegroundColor White

# 8. 压缩为 ZIP（可选）
Write-Host "`n🗜️  正在压缩为 ZIP..." -ForegroundColor Cyan
$zipPath = "dist-portable\Cursor续杯_v${version}_windows_x64_portable.zip"
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

Compress-Archive -Path $portableDir -DestinationPath $zipPath -CompressionLevel Optimal
$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "✅ ZIP 创建成功" -ForegroundColor Green
Write-Host "   ZIP 大小: $zipSize MB" -ForegroundColor White

Write-Host "`n🎉 便携版构建完成！" -ForegroundColor Green
Write-Host "`n📦 输出位置：" -ForegroundColor Yellow
Write-Host "   文件夹: $portableDir" -ForegroundColor White
Write-Host "   ZIP 包: $zipPath" -ForegroundColor White
Write-Host "`n💡 提示：可以直接将 ZIP 包上传到 GitHub Release" -ForegroundColor Cyan
