# 🚀 Cursor Manager 单文件exe构建指南

## 📋 目录
- [快速开始](#快速开始)
- [构建选项](#构建选项)
- [详细步骤](#详细步骤)
- [构建配置](#构建配置)
- [常见问题](#常见问题)
- [优化建议](#优化建议)

## 🎯 快速开始

### Windows用户
```bash
# 方法1：使用构建脚本
.\docs\scripts\build.bat

# 方法2：手动命令
npm run build-exe
```

### Linux/macOS用户
```bash
# 方法1：使用构建脚本
chmod +x build.sh
./docs/scripts/build.sh

# 方法2：手动命令
npm run build-exe
```

## 📦 构建选项

### 可用的构建命令

| 命令 | 说明 | 输出文件 |
|------|------|----------|
| `npm run build-exe` | 构建便携式单文件exe | `Cursor Manager-1.0.0-portable.exe` |
| `npm run build-installer` | 构建安装程序 | `Cursor Manager-1.0.0-installer.exe` |
| `npm run build-all` | 构建所有格式 | 便携式exe + 安装程序 |

### 文件命名规则

- **便携式exe**: `${productName}-${version}-portable.exe`
- **安装程序**: `${productName}-${version}-installer.exe`
- **输出目录**: `dist-electron/`

## 🔧 详细步骤

### 1. 环境准备

确保已安装必要的依赖：
```bash
# 检查Node.js版本
node --version  # 需要 >= 16

# 检查npm版本
npm --version

# 安装项目依赖
npm install
```

### 2. 前端构建

```bash
# 构建Vue.js前端
npm run build

# 验证构建结果
ls dist/  # 应该包含 index.html 和 assets/
```

### 3. Electron打包

```bash
# 构建便携式exe
npm run build-exe

# 构建过程中会看到类似输出：
# • electron-builder  version=24.9.0 os=10.0.26100
# • loaded configuration  file=package.json ("build" field)
# • building        target=portable arch=x64 file=dist-electron\Cursor Manager-1.0.0-portable.exe
```

### 4. 验证构建结果

```bash
# 检查输出文件
dir dist-electron\*.exe

# 文件大小通常在 100-200MB 之间（包含Node.js运行时）
```

## ⚙️ 构建配置

### package.json配置说明

```json
{
  "build": {
    "appId": "com.cursor.manager",
    "productName": "Cursor Manager",
    "directories": {
      "output": "dist-electron"          // 输出目录
    },
    "files": [
      "dist/**/*",                       // 前端构建文件
      "electron/**/*",                   // Electron主进程文件
      "node_modules/**/*",               // Node.js依赖
      "!node_modules/@types/**/*",       // 排除类型定义
      "!node_modules/.cache/**/*"        // 排除缓存文件
    ],
    "win": {
      "target": [
        {
          "target": "portable",          // 便携式exe
          "arch": ["x64"]                // 64位架构
        }
      ],
      "requestedExecutionLevel": "requireAdministrator"  // 需要管理员权限
    },
    "portable": {
      "artifactName": "${productName}-${version}-portable.exe"
    },
    "compression": "maximum",            // 最大压缩
    "npmRebuild": false                  // 不重新构建native模块
  }
}
```

### 关键配置项

- **target: "portable"** - 生成便携式单文件exe
- **arch: ["x64"]** - 仅构建64位版本
- **compression: "maximum"** - 最大压缩以减小文件体积
- **requestedExecutionLevel** - 请求管理员权限（Cursor操作需要）

## 🎨 自定义图标

### 1. 准备图标文件

将图标文件放置在 `build/` 目录：
```
build/
  └── icon.ico    # Windows图标（推荐 256x256）
```

### 2. 图标要求

- **格式**: ICO
- **分辨率**: 256x256, 128x128, 64x64, 48x48, 32x32, 16x16
- **色深**: 32位（支持透明背景）

### 3. 在线图标生成

如果没有ICO文件，可以使用在线工具：
- [Favicon.io](https://favicon.io/favicon-converter/)
- [ICO Convert](https://icoconvert.com/)

## 🐛 常见问题

### 问题1：构建失败 - "node-gyp rebuild failed"

**原因**: native模块编译失败

**解决方案**:
```bash
# 方法1：使用预编译版本
npm install --prefer-binary

# 方法2：设置npmRebuild为false
# 已在package.json中配置

# 方法3：安装构建工具
npm install -g windows-build-tools
```

### 问题2：exe文件过大（>300MB）

**原因**: 包含了不必要的依赖

**解决方案**:
```bash
# 1. 清理依赖
npm prune --production

# 2. 检查大文件
npx electron-builder --dir
du -sh dist-electron/win-unpacked/node_modules/*

# 3. 排除不必要的文件
# 在package.json的build.files中添加排除规则
```

### 问题3：exe运行时报错

**原因**: 缺少运行时依赖或权限不足

**解决方案**:
```bash
# 1. 以管理员身份运行
# 右键 -> "以管理员身份运行"

# 2. 检查Windows Defender
# 将exe文件添加到排除列表

# 3. 检查依赖
# 确保目标机器有Visual C++ Redistributable
```

### 问题4：打包后找不到文件

**原因**: 资源文件路径不正确

**解决方案**:
```javascript
// 在Electron主进程中使用正确的路径
const isDev = process.env.NODE_ENV === 'development'
const resourcePath = isDev 
  ? path.join(__dirname, '../resources')
  : path.join(process.resourcesPath, 'resources')
```

## 🚀 优化建议

### 1. 减小文件体积

```json
// package.json - 排除更多不必要的文件
"files": [
  "dist/**/*",
  "electron/**/*",
  "node_modules/**/*",
  "!node_modules/@types/**/*",
  "!node_modules/.cache/**/*",
  "!node_modules/*/README.md",
  "!node_modules/*/CHANGELOG.md",
  "!node_modules/*/*.d.ts"
]
```

### 2. 启用ASAR打包

```json
"asar": true,
"asarUnpack": [
  "node_modules/sqlite3/**/*"
]
```

### 3. 代码分割和懒加载

```javascript
// Vue.js中使用动态导入
const ComponentA = () => import('./ComponentA.vue')
```

### 4. 构建缓存

```bash
# 使用electron-builder缓存
export ELECTRON_CACHE=./.electron-cache
export ELECTRON_BUILDER_CACHE=./.electron-builder-cache
```

## 📊 构建性能

### 典型构建时间
- **前端构建**: 30-60秒
- **Electron打包**: 2-5分钟
- **总时间**: 3-6分钟

### 文件大小预期
- **便携式exe**: 120-200MB
- **安装程序**: 80-150MB
- **解压后**: 200-400MB

## 🎯 发布流程

### 1. 版本更新
```bash
# 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 2. 构建发布版本
```bash
# 构建所有格式
npm run build-all

# 检查输出
ls -la dist-electron/
```

### 3. 测试exe文件
```bash
# 在干净的Windows环境中测试
# 1. 复制exe到另一台机器
# 2. 以管理员身份运行
# 3. 验证所有功能正常
```

### 4. 发布清单
- [ ] 版本号已更新
- [ ] 构建无错误
- [ ] exe文件可正常运行
- [ ] 功能测试通过
- [ ] 文档已更新

## 🔗 相关资源

- [Electron Builder文档](https://www.electron.build/)
- [Electron打包指南](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- [Vue.js构建指南](https://vitejs.dev/guide/build.html)

---

## ✅ 构建完成检查清单

- [ ] 前端构建成功 (`dist/` 目录存在)
- [ ] Electron打包成功 (`dist-electron/` 目录存在)
- [ ] exe文件生成 (文件大小合理)
- [ ] exe文件可运行 (双击启动正常)
- [ ] 功能测试通过 (所有功能正常)
- [ ] 管理员权限正常 (可操作Cursor)

🎉 **恭喜！您的Cursor Manager已成功打包为单文件exe！**
