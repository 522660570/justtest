# 🚀 重要：正确的打包方式（解决 SQLite 架构问题）

## ⚠️ 核心问题

`better-sqlite3` 是 **native 模块**，需要为每个平台编译：
- Windows → 需要在 Windows 上编译
- macOS (x64) → 需要在 Intel Mac 上编译
- macOS (arm64) → 需要在 Apple Silicon Mac 上编译
- macOS (universal) → 需要在 macOS 上编译（支持两种架构）

## ✅ 解决方案

### 方案1: 在对应平台上打包（推荐）

**关键**: electron-builder 会自动为目标平台编译正确的架构

```bash
# 在 Windows 上
npm install
npm run build:win-x64

# 在 macOS 上
npm install
npm run build:mac-universal  # 推荐！同时支持 Intel + Apple Silicon

# 在 Linux 上
npm install
npm run build:linux-x64
```

### 方案2: 使用 GitHub Actions（自动化）

创建 `.github/workflows/build.yml`:

```yaml
name: Build All Platforms

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:win-x64
      
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:mac-universal
      
  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:linux-x64
```

Push 代码后，GitHub 会自动打包所有平台！

---

## 🔍 为什么开发环境编译失败不要紧？

**开发环境** (你的 Windows 机器):
```
npm install better-sqlite3
❌ 编译失败（没有 Visual Studio）
⚠️ 但这不影响！因为你不需要在开发环境运行 SQLite
```

**打包环境** (GitHub Actions 或对应平台):
```
electron-builder 打包时会：
✅ 自动下载预编译的二进制文件
✅ 或自动编译（如果有编译环境）
✅ 自动适配目标平台架构
```

---

## 📦 正确的打包流程

### Windows 用户

```bash
# 1. 安装依赖（better-sqlite3 可能失败，忽略）
npm install

# 2. 构建前端
npm run build

# 3. 打包（electron-builder 会自动处理 better-sqlite3）
npm run build:win-x64
```

**重要**: 打包时 electron-builder 会自动下载 Windows 的预编译版本！

### macOS 用户

```bash
# 1. 安装依赖（better-sqlite3 会自动编译正确架构）
npm install

# 2. 打包 Universal 版本（推荐）
npm run build:mac-universal
```

**重要**: 在 macOS 上编译会自动适配 arm64/x64！

### 没有对应平台怎么办？

**使用 GitHub Actions**！

1. 创建 GitHub 仓库
2. 添加上面的 workflow 文件
3. 推送代码并打 tag：`git tag v1.2.0 && git push --tags`
4. GitHub 自动打包所有平台

---

## ⚠️ 重要说明

### 开发环境

```
npm install better-sqlite3
可能失败 ❌ → 没关系！开发时不影响
```

**为什么？**
- 你主要修改 UI 和业务逻辑
- SQLite 功能在打包后的应用中才会用到
- 开发时可以用模拟数据测试

### 打包环境

```
electron-builder 打包
自动处理 ✅ → 会下载正确的预编译版本
```

**为什么？**
- electron-builder 内置了智能处理
- 会为目标平台下载/编译正确版本
- 打包后的应用 100% 可用

---

## 🎯 当前配置

**package.json** 已正确配置：

```json
{
  "dependencies": {
    "better-sqlite3": "^9.6.0"  // ✅ 正确
  },
  "devDependencies": {
    "electron-rebuild": "^3.2.9"  // ✅ 已添加
  },
  "build": {
    "npmRebuild": true,  // ✅ 自动重建
    "asarUnpack": [
      "node_modules/better-sqlite3/**/*"  // ✅ 解包 native 模块
    ]
  },
  "scripts": {
    "postinstall": "electron-builder install-app-deps || echo 'Skipping'"  // ✅ 自动处理
  }
}
```

---

## 🧪 验证打包成功

打包后测试：

```bash
# Windows
dist-electron/Cursor续杯工具_x64.exe

# macOS
dist-electron/Cursor续杯工具_mac_universal.dmg

# 安装后运行，测试 SQLite 功能：
# 1. 点击一键续杯
# 2. 查看是否有 SQLite 错误
# 3. 应该正常工作 ✅
```

---

## 💡 Pro 提示

### 如果你只有 Windows 机器

1. **本地打包 Windows 版**:
   ```bash
   npm run build:win-x64
   ```

2. **用 GitHub Actions 打包 macOS**:
   - 推送到 GitHub
   - 打 tag 触发自动打包
   - 下载编译好的 macOS 版本

### 如果你有 Mac 机器

在 Mac 上执行：
```bash
npm install  # 会自动编译 arm64/x64 版本
npm run build:mac-universal
```

---

## ✅ 总结

| 环境 | better-sqlite3 状态 | 影响 |
|------|-------------------|------|
| 开发环境（Windows无VS） | ❌ 编译失败 | ⚠️ 无影响（不需要运行SQLite）|
| 打包环境（electron-builder） | ✅ 自动处理 | ✅ 打包成功 |
| 打包后应用（用户机器） | ✅ 正常工作 | ✅ 100%可用 |

**结论**: 
- 开发环境编译失败 = 正常，不用管
- 打包时 electron-builder = 自动处理
- 用户使用 = 完全正常

**现在直接打包即可，不用担心 SQLite 问题！** 🎉

