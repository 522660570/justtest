# 🚀 多平台打包完整指南

本指南将帮助你在不同平台上打包 Cursor Manager 应用程序。

## 📋 目录

- [支持的平台和架构](#支持的平台和架构)
- [准备工作](#准备工作)
- [Windows 打包](#windows-打包)
- [macOS 打包](#macos-打包)
- [Linux 打包](#linux-打包)
- [全平台打包](#全平台打包)
- [CI/CD 自动化](#cicd-自动化)
- [常见问题](#常见问题)

---

## 📦 支持的平台和架构

### Windows
- **架构**: x64 (64位), ia32 (32位), arm64 (ARM架构)
- **格式**: 
  - `portable` - 便携版（无需安装）
  - `nsis` - 安装程序
  - `zip` - 压缩包

### macOS
- **架构**: x64 (Intel), arm64 (Apple Silicon), universal (通用二进制)
- **格式**:
  - `dmg` - 磁盘映像
  - `zip` - 压缩包
  - `pkg` - 安装包

### Linux
- **架构**: x64, arm64, armv7l (树莓派等)
- **格式**:
  - `AppImage` - 单文件可执行
  - `deb` - Debian/Ubuntu
  - `rpm` - RedHat/Fedora/CentOS
  - `tar.gz` - 通用压缩包
  - `snap` - Snap Store

---

## 🔧 准备工作

### 1. 安装依赖
```bash
npm install
```

### 2. 准备图标文件

需要准备三种格式的图标：

#### Windows 图标 (icon.ico)
- 已存在: `build/icon.ico`
- 格式: ICO
- 推荐尺寸: 256x256

#### macOS 图标 (icon.icns)
需要创建 `build/icon.icns`，可以使用以下方法：

**方法一：在线转换**
1. 访问 https://cloudconvert.com/png-to-icns
2. 上传你的 PNG 图标（推荐 1024x1024）
3. 转换并下载 `icon.icns`
4. 放到 `build/` 目录

**方法二：使用命令行（仅 macOS）**
```bash
# 准备一个 1024x1024 的 PNG 图标
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o build/icon.icns
```

#### Linux 图标 (icon.png)
需要创建 `build/icon.png`：

```bash
# 从 ICO 转换（Windows 上）
# 使用在线工具或 ImageMagick
convert build/icon.ico -resize 512x512 build/icon.png

# 或直接准备一个 512x512 的 PNG
```

---

## 💻 Windows 打包

### 在 Windows 上打包

#### 打包单个架构
```bash
# x64 (64位)
npm run build:win-x64

# ia32 (32位)
npm run build:win-ia32

# ARM64
npm run build:win-arm64
```

#### 打包所有架构
```bash
npm run build:win-all
```

#### 使用原有命令（兼容性保留）
```bash
# 打包便携版 (x64)
npm run build-exe

# 打包安装版 (x64)
npm run build-installer
```

### 输出位置
```
dist-electron/
  ├── Cursor Manager-1.0.0-x64.exe        # 64位便携版
  ├── Cursor Manager-1.0.0-ia32.exe       # 32位便携版
  ├── Cursor Manager-1.0.0-arm64.exe      # ARM64便携版
  ├── Cursor Manager Setup 1.0.0-x64.exe  # 64位安装程序
  └── ...
```

### 跨平台限制
- ✅ 在 Windows 上可以打包所有 Windows 架构
- ⚠️ 在其他平台上打包 Windows 需要 Wine

---

## 🍎 macOS 打包

### 在 macOS 上打包

#### 打包单个架构
```bash
# Intel (x64)
npm run build:mac-x64

# Apple Silicon (arm64)
npm run build:mac-arm64

# Universal (同时支持 Intel 和 Apple Silicon)
npm run build:mac-universal
```

#### 打包所有架构
```bash
npm run build:mac-all
```

### 输出位置
```
dist-electron/
  ├── Cursor Manager-1.0.0-mac-x64.dmg        # Intel DMG
  ├── Cursor Manager-1.0.0-mac-arm64.dmg      # Apple Silicon DMG
  ├── Cursor Manager-1.0.0-mac-universal.dmg  # 通用 DMG
  ├── Cursor Manager-1.0.0-mac-x64.zip        # Intel ZIP
  └── ...
```

### 跨平台限制
- ⚠️ 只能在 macOS 上打包 macOS 应用
- ⚠️ 在其他平台上打包会失败或功能不完整

### 代码签名（可选）
如果需要发布到 App Store 或避免"未识别的开发者"警告：

```bash
# 需要 Apple Developer 账号
# 在 package.json 的 mac 配置中添加：
{
  "mac": {
    "identity": "你的开发者ID",
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.inherit.plist"
  }
}
```

---

## 🐧 Linux 打包

### 在 Linux 上打包

#### 打包单个架构
```bash
# x64 (64位)
npm run build:linux-x64

# ARM64
npm run build:linux-arm64

# ARMv7l (树莓派等)
npm run build:linux-armv7l
```

#### 打包所有架构
```bash
npm run build:linux-all
```

### 输出位置
```
dist-electron/
  ├── Cursor Manager-1.0.0-linux-x64.AppImage  # 单文件可执行
  ├── Cursor Manager-1.0.0-linux-x64.deb       # Debian/Ubuntu
  ├── Cursor Manager-1.0.0-linux-x64.rpm       # RedHat/Fedora
  ├── Cursor Manager-1.0.0-linux-x64.tar.gz    # 通用压缩包
  └── ...
```

### 跨平台限制
- ⚠️ 在 Windows 上打包 Linux 应用需要 WSL 或 Docker
- ✅ 在 macOS 和 Linux 上都可以打包 Linux 应用

### 在 Windows 上通过 WSL 打包
```bash
# 1. 启用 WSL
wsl --install

# 2. 进入 WSL
wsl

# 3. 在 WSL 中打包
cd /mnt/d/cursor-my/cursor-refill-tool
npm run build:linux-all
```

---

## 🌍 全平台打包

### 打包所有平台（推荐在 CI/CD 中使用）

```bash
# 打包所有平台的主要架构 (x64 + arm64)
npm run build:all-full

# 打包所有平台的所有架构
npm run build:all-platforms
```

### 注意事项
- **在单个平台上打包所有平台会有限制**
- **推荐使用 CI/CD 自动化**（见下文）

---

## 🤖 CI/CD 自动化

使用 GitHub Actions 自动打包所有平台是最佳实践。

### 创建 `.github/workflows/build.yml`

```yaml
name: Build Multi-Platform

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:win-all
      - uses: actions/upload-artifact@v3
        with:
          name: windows-builds
          path: dist-electron/*.exe

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:mac-all
      - uses: actions/upload-artifact@v3
        with:
          name: macos-builds
          path: |
            dist-electron/*.dmg
            dist-electron/*.zip
            dist-electron/*.pkg

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:linux-all
      - uses: actions/upload-artifact@v3
        with:
          name: linux-builds
          path: |
            dist-electron/*.AppImage
            dist-electron/*.deb
            dist-electron/*.rpm
            dist-electron/*.tar.gz

  release:
    needs: [build-windows, build-macos, build-linux]
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - uses: actions/download-artifact@v3
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            windows-builds/*
            macos-builds/*
            linux-builds/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 使用方法

1. **推送标签触发构建**
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. **手动触发**
   - 在 GitHub 仓库页面
   - Actions → Build Multi-Platform → Run workflow

3. **自动发布**
   - 构建完成后自动创建 Release
   - 包含所有平台的安装包

---

## ❓ 常见问题

### Q1: 打包时报错 "Application entry file not found"
**解决方案**:
```bash
# 先构建前端
npm run build
# 再打包
npm run build:win-x64
```

### Q2: macOS 打包提示需要 .icns 图标
**解决方案**: 参考 [准备工作 - macOS 图标](#macos-图标-iconicns)

### Q3: Linux 打包提示需要 .png 图标
**解决方案**: 参考 [准备工作 - Linux 图标](#linux-图标-iconpng)

### Q4: 在 Windows 上如何打包 macOS 版本？
**答**: 无法在 Windows 上直接打包 macOS 版本，需要：
- 使用 macOS 机器
- 或使用 GitHub Actions CI/CD

### Q5: 打包后的文件太大
**解决方案**:
- 已配置 `compression: "maximum"`
- 已启用 `asar: true`
- 可以进一步排除不需要的 node_modules

### Q6: 如何减小包体积？
```json
// 在 package.json 的 files 配置中排除更多文件
"files": [
  "dist/**/*",
  "electron/**/*",
  "!node_modules/**/*.md",
  "!node_modules/**/test/**/*"
]
```

### Q7: Windows Defender 误报病毒
**原因**: 未签名的 exe 文件
**解决方案**: 
- 代码签名（需要证书）
- 或提交给 Microsoft SmartScreen
- 或使用 zip 格式分发

---

## 📊 架构选择建议

### Windows
- **x64**: 主流 64位 Windows（推荐）
- **ia32**: 老旧 32位系统（可选）
- **arm64**: Windows on ARM 设备（如 Surface Pro X）

### macOS
- **x64**: Intel Mac（2020年前）
- **arm64**: Apple Silicon Mac（M1/M2/M3）
- **universal**: 同时支持两者（**推荐**，但体积大）

### Linux
- **x64**: 主流台式机/服务器（推荐）
- **arm64**: ARM服务器、树莓派4等
- **armv7l**: 树莓派3等老设备

---

## 🎯 快速开始

### 最简单的方式（当前平台）

```bash
# Windows
npm run build-exe

# macOS
npm run build:mac-universal

# Linux
npm run build:linux-x64
```

### 完整发布流程

```bash
# 1. 准备图标（确保 .ico, .icns, .png 都存在）
# 2. 推送代码到 GitHub
git push

# 3. 创建版本标签
git tag v1.0.0
git push origin v1.0.0

# 4. GitHub Actions 自动构建所有平台
# 5. 在 Releases 页面下载所有安装包
```

---

## 📝 输出文件命名规则

```
Cursor Manager-${version}-${platform}-${arch}.${ext}

示例:
- Cursor Manager-1.0.0-x64.exe              # Windows 64位
- Cursor Manager-1.0.0-mac-universal.dmg    # macOS 通用版
- Cursor Manager-1.0.0-linux-x64.AppImage   # Linux 64位
```

---

## 🔗 相关文档

- [BUILD_GUIDE.md](docs/BUILD_GUIDE.md) - 基础构建指南
- [BUILD_MAC_GUIDE.md](BUILD_MAC_GUIDE.md) - macOS 专用指南
- [BUILD_RELEASE.md](BUILD_RELEASE.md) - 发布流程

---

## 💡 建议

1. **本地开发**: 只打包当前平台，速度快
2. **测试**: 打包主要架构 (x64 + arm64)
3. **发布**: 使用 CI/CD 打包所有平台和架构

---

## 📞 需要帮助？

如遇到问题，请查看：
- [TROUBLESHOOTING_GUIDE.md](docs/TROUBLESHOOTING_GUIDE.md)
- 或在 Issues 中反馈

