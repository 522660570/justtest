# 📦 打包快速参考

## 🚀 一键检查图标

```bash
npm run check-icons
```

这会检查你是否准备好了所有必需的图标文件。

---

## 💻 Windows 打包

```bash
# 快速打包 (x64 便携版) - 你现在用的
npm run build-exe

# 打包安装程序 (x64)
npm run build-installer

# 打包所有架构 (x64 + ia32 + arm64)
npm run build:win-all

# 打包特定架构
npm run build:win-x64      # 64位
npm run build:win-ia32     # 32位
npm run build:win-arm64    # ARM64
```

**输出位置**: `dist-electron/`

**支持的格式**: 
- `.exe` (portable) - 便携版
- `.exe` (installer) - 安装程序
- `.zip` - 压缩包

---

## 🍎 macOS 打包

⚠️ **只能在 macOS 上打包，或使用 GitHub Actions**

```bash
# 打包所有架构和格式
npm run build:mac-all

# 打包特定架构
npm run build:mac-x64         # Intel Mac
npm run build:mac-arm64       # Apple Silicon (M1/M2/M3)
npm run build:mac-universal   # 通用版（推荐）
```

**输出位置**: `dist-electron/`

**支持的格式**:
- `.dmg` - 磁盘映像（推荐）
- `.zip` - 压缩包
- `.pkg` - 安装包

---

## 🐧 Linux 打包

```bash
# 打包所有架构
npm run build:linux-all

# 打包特定架构
npm run build:linux-x64      # 64位 (主流)
npm run build:linux-arm64    # ARM64
npm run build:linux-armv7l   # 树莓派等
```

**在 Windows 上通过 WSL 打包 Linux**:
```bash
wsl
cd /mnt/d/cursor-my/cursor-refill-tool
npm run build:linux-all
```

**输出位置**: `dist-electron/`

**支持的格式**:
- `.AppImage` - 单文件可执行（推荐）
- `.deb` - Debian/Ubuntu
- `.rpm` - RedHat/Fedora
- `.tar.gz` - 通用压缩包
- `.snap` - Snap Store

---

## 🌍 全平台打包

```bash
# 打包所有平台 (x64 + arm64)
npm run build:all-full

# 打包所有平台所有架构
npm run build:all-platforms
```

⚠️ **注意**: 跨平台打包有限制，推荐使用 CI/CD

---

## 🤖 GitHub Actions 自动化

### 方法一：推送标签

```bash
# 更新版本号
npm version patch  # 或 minor, major

# 推送标签（自动触发构建）
git push origin v1.0.0
```

### 方法二：手动触发

1. 访问 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Build Multi-Platform Release**
4. 点击 **Run workflow**
5. 等待构建完成
6. 在 **Releases** 页面下载所有平台的安装包

---

## 📁 输出文件示例

```
dist-electron/
├── Cursor Manager-1.0.0-x64.exe              # Windows 64位便携版
├── Cursor Manager-1.0.0-ia32.exe             # Windows 32位便携版
├── Cursor Manager-1.0.0-arm64.exe            # Windows ARM64便携版
├── Cursor Manager Setup 1.0.0-x64.exe        # Windows 64位安装程序
│
├── Cursor Manager-1.0.0-mac-x64.dmg          # macOS Intel DMG
├── Cursor Manager-1.0.0-mac-arm64.dmg        # macOS Apple Silicon DMG
├── Cursor Manager-1.0.0-mac-universal.dmg    # macOS 通用版 DMG
│
├── Cursor Manager-1.0.0-linux-x64.AppImage   # Linux 64位 AppImage
├── Cursor Manager-1.0.0-linux-x64.deb        # Linux 64位 DEB
├── Cursor Manager-1.0.0-linux-x64.rpm        # Linux 64位 RPM
└── ...
```

---

## 🎯 常用场景

### 场景1: 本地测试（快速）
```bash
# Windows
npm run build-exe

# macOS
npm run build:mac-universal

# Linux
npm run build:linux-x64
```

### 场景2: 完整发布
```bash
# 1. 检查图标
npm run check-icons

# 2. 推送代码
git add .
git commit -m "Ready for release"
git push

# 3. 创建版本标签
git tag v1.0.0
git push origin v1.0.0

# 4. 等待 GitHub Actions 自动构建
# 5. 在 Releases 页面下载所有安装包
```

### 场景3: 手动打包所有平台（需要多台机器）

**在 Windows 上:**
```bash
npm run build:win-all
```

**在 macOS 上:**
```bash
npm run build:mac-all
```

**在 Linux 上（或 WSL）:**
```bash
npm run build:linux-all
```

---

## 🛠️ 准备图标文件

需要准备三种格式的图标：

| 平台 | 文件名 | 格式 | 推荐尺寸 | 位置 |
|------|--------|------|----------|------|
| Windows | `icon.ico` | ICO | 256x256 | `build/icon.ico` |
| macOS | `icon.icns` | ICNS | 1024x1024 | `build/icon.icns` |
| Linux | `icon.png` | PNG | 512x512 | `build/icon.png` |

**在线转换工具**:
- ICO: https://www.aconvert.com/cn/icon/png-to-ico/
- ICNS: https://cloudconvert.com/png-to-icns
- PNG: 直接使用设计软件导出

---

## ❓ 常见问题

### Q: 打包前是否需要先运行 `npm run build`?
A: **不需要**！所有打包命令都会自动先构建前端。

### Q: 如何只打包一个架构？
A: 使用特定架构的命令，例如 `npm run build:win-x64`

### Q: 为什么 macOS 打包失败？
A: macOS 只能在 macOS 系统上打包，使用 GitHub Actions 或找台 Mac

### Q: 如何减小包体积？
A: 已经配置了最大压缩，可以进一步排除不需要的依赖

### Q: Windows Defender 报毒？
A: 未签名的 exe 可能被误报，可以：
  - 代码签名（需要证书）
  - 使用 zip 格式分发
  - 提交白名单给 Microsoft

---

## 📚 详细文档

- [BUILD_MULTI_PLATFORM_GUIDE.md](BUILD_MULTI_PLATFORM_GUIDE.md) - 完整打包指南
- [docs/BUILD_GUIDE.md](docs/BUILD_GUIDE.md) - 基础构建指南
- [BUILD_MAC_GUIDE.md](BUILD_MAC_GUIDE.md) - macOS 专用指南

---

## 🎉 快速开始

```bash
# 1. 检查图标
npm run check-icons

# 2. 打包当前平台
npm run build-exe              # Windows
npm run build:mac-universal    # macOS
npm run build:linux-x64        # Linux

# 3. 测试安装包
cd dist-electron
# 运行你刚打包的程序
```

就这么简单！🚀

