# macOS 打包指南

## 📦 打包命令

### 方式1：打包 DMG 镜像（推荐）

```bash
npm run build-mac-dmg
```

**生成文件**：
- `dist-electron/Cursor Manager-1.0.0-x64.dmg`（Intel Mac）
- `dist-electron/Cursor Manager-1.0.0-arm64.dmg`（Apple Silicon M1/M2/M3）

### 方式2：打包 ZIP 压缩包

```bash
npm run build-mac-zip
```

**生成文件**：
- `dist-electron/Cursor Manager-1.0.0-x64.zip`
- `dist-electron/Cursor Manager-1.0.0-arm64.zip`

### 方式3：打包所有 macOS 格式

```bash
npm run build-mac
```

**生成文件**：
- DMG 镜像（x64 + arm64）
- ZIP 压缩包（x64 + arm64）

## 🖥️ 系统要求

### 在 macOS 上打包

如果你在 macOS 系统上：

```bash
# 1. 安装依赖
npm install

# 2. 打包
npm run build-mac-dmg
```

### 在 Windows 上打包 macOS 应用

**注意**：在 Windows 上打包 macOS 应用有限制：

1. **可以打包**：基本的 .app 应用
2. **不能打包**：需要代码签名的应用
3. **推荐**：在 macOS 系统上打包

```bash
# Windows 上也可以尝试
npm run build-mac
```

## 📂 打包输出

```
dist-electron/
├── Cursor Manager-1.0.0-x64.dmg          ← Intel Mac 安装镜像
├── Cursor Manager-1.0.0-arm64.dmg        ← Apple Silicon 安装镜像
├── Cursor Manager-1.0.0-x64.zip          ← Intel Mac 压缩包
├── Cursor Manager-1.0.0-arm64.zip        ← Apple Silicon 压缩包
└── mac/                                  ← 未打包的 .app 文件
    ├── Cursor Manager-x64.app
    └── Cursor Manager-arm64.app
```

## 🎯 打包架构说明

### x64（Intel）
- 适用于：Intel 芯片的 Mac
- 兼容性：2020年及之前的 Mac

### arm64（Apple Silicon）
- 适用于：M1/M2/M3 芯片的 Mac
- 兼容性：2020年底之后的 Mac
- 性能更好

### Universal（通用版本）

如果需要打包通用版本（同时支持 Intel 和 Apple Silicon）：

```json
// package.json 中修改
"mac": {
  "target": [
    {
      "target": "dmg",
      "arch": ["universal"]  // 改为 universal
    }
  ]
}
```

然后运行：
```bash
npm run build-mac-dmg
```

## ⚠️ 注意事项

### 1. 图标格式

macOS 需要 `.icns` 格式的图标，目前配置的是 `.ico`（Windows格式）。

**建议**：创建 macOS 图标

```bash
# 如果有 .png 图片（至少 1024x1024）
# 在 macOS 上运行：
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
iconutil -c icns icon.iconset
mv icon.icns build/icon.icns
```

然后修改 package.json：
```json
"icon": "build/icon.icns"  // macOS 用 .icns
```

### 2. 代码签名

macOS 应用需要代码签名才能正常运行（尤其是 macOS 10.15+）。

**开发测试**：可以跳过签名
```json
"mac": {
  "hardenedRuntime": false,
  "gatekeeperAssess": false
}
```

**正式发布**：需要 Apple Developer 账号进行签名

### 3. 权限问题

macOS 上修改 Cursor 配置文件可能需要权限。建议在打包时设置：

```json
"mac": {
  "entitlements": "build/entitlements.mac.plist",
  "entitlementsInherit": "build/entitlements.mac.inherit.plist"
}
```

## 🚀 快速打包（推荐）

### 在 macOS 系统上

```bash
# 1. 安装依赖
npm install

# 2. 打包 DMG（推荐）
npm run build-mac-dmg

# 生成文件在：dist-electron/
```

### 在 Windows 系统上

```bash
# 也可以尝试，但可能有限制
npm run build-mac

# 注意：可能无法生成 DMG，但可以生成 .app
```

## 📋 完整的跨平台打包

如果需要同时打包 Windows 和 macOS：

```bash
# 构建前端
npm run build

# 打包 Windows
electron-builder --win portable

# 打包 macOS（在 macOS 上）
electron-builder --mac dmg

# 或者一次性打包所有平台（在 macOS 上）
electron-builder --win --mac
```

## 💡 最佳实践

### 开发阶段
- Windows 用户：只打包 Windows 版本
- macOS 用户：只打包 macOS 版本

### 发布阶段
- 在 macOS 上打包 macOS 版本
- 在 Windows 上打包 Windows 版本
- 或使用 CI/CD 自动打包

## 🔍 验证打包结果

### macOS DMG
```bash
# 挂载 DMG
open dist-electron/Cursor\ Manager-1.0.0-arm64.dmg

# 拖拽 .app 到 Applications 文件夹
# 然后运行测试
```

### macOS ZIP
```bash
# 解压
unzip dist-electron/Cursor\ Manager-1.0.0-arm64.zip

# 运行
open Cursor\ Manager.app
```

## 📝 已添加的命令

| 命令 | 说明 | 生成文件 |
|------|------|---------|
| `npm run build-mac` | 打包所有 macOS 格式 | DMG + ZIP |
| `npm run build-mac-dmg` | 只打包 DMG | .dmg 文件 |
| `npm run build-mac-zip` | 只打包 ZIP | .zip 文件 |

---

**推荐**：
- **macOS 用户**：使用 `npm run build-mac-dmg`
- **Windows 用户**：如果要打 macOS 包，建议在 macOS 系统或 CI/CD 上打包


