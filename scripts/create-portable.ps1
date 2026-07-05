# 创建便携版（简化版）
# 前提：已经执行过 npm run tauri build

param(
    [string]$Version = "1.9.1"
)

Write-Host "Creating portable version..." -ForegroundColor Green

# 1. 检查可执行文件
$exePath = "src-tauri\target\release\app.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "Error: $exePath not found!" -ForegroundColor Red
    Write-Host "Please run: npm run tauri build" -ForegroundColor Yellow
    exit 1
}

# 2. 创建输出目录
$outputDir = "dist-portable"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# 3. 复制并重命名
$portableName = "Cursor续杯_v${Version}_windows_x64_portable.exe"
Copy-Item $exePath "$outputDir\$portableName"

# 4. 获取文件大小
$fileSize = [math]::Round((Get-Item "$outputDir\$portableName").Length / 1MB, 2)

Write-Host "`nSuccess!" -ForegroundColor Green
Write-Host "Output: $outputDir\$portableName" -ForegroundColor Cyan
Write-Host "Size: $fileSize MB" -ForegroundColor Cyan
