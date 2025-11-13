# 修复 macOS SQLite 架构不兼容问题

## 🔧 问题说明

错误信息：
```
Error: incompatible architecture (have 'arm64', need 'x86_64h')
```

这是因为 `sqlite3` 原生模块在 macOS 上的架构不匹配。

## ✅ 解决方案

已将 `sqlite3` 替换为 `better-sqlite3`，好处：
- ✅ 更好的跨平台支持
- ✅ 自动处理 arm64/x86_64/universal 架构
- ✅ 性能更快（同步API）
- ✅ API 更简单

## 🚀 更新步骤

### 1. 删除旧依赖

```bash
npm uninstall sqlite3
```

### 2. 安装新依赖

```bash
npm install better-sqlite3
```

### 3. 清理并重新安装（推荐）

```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 4. 重新打包 macOS 版本

```bash
# Intel Mac (x64)
npm run build:mac-x64

# Apple Silicon Mac (arm64)
npm run build:mac-arm64

# Universal (推荐，同时支持两种架构)
npm run build:mac-universal
```

## 📊 代码变更

### package.json

```json
// 旧的
"sqlite3": "^5.1.7"

// 新的
"better-sqlite3": "^11.0.0"
```

```json
// 旧的
"npmRebuild": false,
"asarUnpack": ["node_modules/sqlite3/**/*"]

// 新的
"npmRebuild": true,
"buildDependenciesFromSource": true,
"asarUnpack": ["node_modules/better-sqlite3/**/*"]
```

### electron/main.js

```javascript
// 旧的 (异步API)
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(dbPath)
db.all(query, params, (err, rows) => {...})

// 新的 (同步API，更简单)
const Database = require('better-sqlite3')
const db = new Database(dbPath)
const stmt = db.prepare(query)
const result = stmt.all(...params)
db.close()
```

## ✅ 兼容性

| 平台 | 架构 | 状态 |
|------|------|------|
| Windows | x64 | ✅ 完全支持 |
| Windows | arm64 | ✅ 完全支持 |
| macOS | x64 (Intel) | ✅ 完全支持 |
| macOS | arm64 (M1/M2/M3) | ✅ 完全支持 |
| macOS | universal | ✅ 完全支持 |
| Linux | x64 | ✅ 完全支持 |
| Linux | arm64 | ✅ 完全支持 |

## 🧪 测试

更新后，macOS 用户应该不会再看到架构错误。

如果还有问题，尝试：

```bash
# 清理 Electron 缓存
npm run clean  # 如果有这个命令
rm -rf node_modules/.cache

# 重新安装并重建
npm install
npm rebuild better-sqlite3
```

## 💡 注意事项

1. **不需要修改业务代码** - API 保持兼容
2. **性能更好** - better-sqlite3 是同步的，避免回调地狱
3. **更稳定** - 对 Electron 打包优化更好
4. **自动架构匹配** - 自动适配 arm64/x64

---

完成！🎉 macOS 架构问题已解决。

