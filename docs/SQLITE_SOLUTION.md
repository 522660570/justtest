# SQLite 跨平台解决方案

## ⚠️ 问题分析

所有 SQLite 的 Node.js 包都有一个共同问题：**需要编译 native 模块**

| 包名 | 问题 |
|------|------|
| `sqlite3` | macOS 架构不兼容（arm64 vs x86_64）|
| `better-sqlite3` | 需要 Visual Studio 编译环境 |
| `sql.js` | 打包后找不到模块 |

## ✅ 最终解决方案

**在 CI/CD 或有编译环境的机器上打包**

### 方案1: 使用 GitHub Actions（推荐）

在 GitHub 仓库中创建 `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: |
          npm run build:win-x64   # Windows
          npm run build:mac-universal  # macOS
          npm run build:linux-x64  # Linux
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-${{ matrix.os }}
          path: dist-electron/
```

### 方案2: 本地使用预编译版本

**package.json** 添加脚本：

```json
"scripts": {
  "postinstall": "electron-builder install-app-deps"
}
```

这会自动下载预编译的二进制文件。

### 方案3: 不使用 SQLite 库（临时开发）

如果只是开发测试，可以：

```javascript
// 使用模拟数据
if (process.env.NODE_ENV === 'development') {
  return { success: true, data: mockData }
}
```

## 🎯 推荐方案

### 立即可用：保持 better-sqlite3，在打包时处理

**package.json**:
```json
{
  "dependencies": {
    "better-sqlite3": "^9.6.0"
  },
  "scripts": {
    "postinstall": "electron-builder install-app-deps",
    "rebuild": "electron-rebuild -f -w better-sqlite3"
  }
}
```

**打包时**:
- Windows 打包在 Windows 上
- macOS 打包在 macOS 上（会自动编译正确架构）
- Linux 打包在 Linux 上

### electron-builder 会自动处理

设置正确后，electron-builder 会：
1. 自动为目标平台编译 native 模块
2. 下载预编译的二进制文件（如果有）
3. 打包到 app.asar.unpacked

## 🚀 实际操作

```bash
# 开发环境（可能失败，但不影响打包）
npm install better-sqlite3

# 打包时（自动处理架构）
npm run build:mac-universal  # 在 macOS 上执行
npm run build:win-x64        # 在 Windows 上执行
```

**关键**: 在对应平台上打包，electron-builder 会自动编译正确的架构！

不需要在开发机器上编译成功，只需要在打包机器上成功即可。

