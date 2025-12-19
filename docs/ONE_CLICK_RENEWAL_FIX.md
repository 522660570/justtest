# 🔧 一键续杯Token失效问题完整修复

## 🐛 问题现象

**症状**：一键换号后，WorkosCursorSessionToken和AccessToken立刻就失效了，打开Cursor后变成未登录状态

**触发场景**：特别是在Cursor中点击"退出登录"按钮后

## 🔍 根本原因分析

### cursor-free-vip vs 你的项目的区别

| 项目 | 功能 | 是否换账号 | 是否更新认证token |
|------|------|-----------|------------------|
| **cursor-free-vip** | 机器ID重置 | ❌ 否 | ❌ 否 |
| **你的项目** | 一键换号 | ✅ 是 | ✅ 是（必须） |

### 关键差异

1. **cursor-free-vip**:
   - 只重置机器ID（`telemetry.machineId`, `telemetry.macMachineId`等）
   - **不修改认证信息**（`WorkosCursorSessionToken`, `accessToken`等）
   - 所以不会导致token失效

2. **你的项目**:
   - 需要切换到新账号
   - **必须更新所有认证信息**
   - 如果更新不完整，会导致token失效

## ✅ 完整修复方案

### 修复逻辑（参考cursor-free-vip的实现方式）

#### 1. 基础字段（必须更新）
```javascript
['cursorAuth/cachedSignUpType', accountData.signUpType || 'Auth0'],
['cursorAuth/cachedEmail', accountData.email]
```

#### 2. SessionToken模式（最重要）
```javascript
// 🔑 如果有 sessionToken，添加 WorkosCursorSessionToken
if (accountData.sessionToken) {
  updates.push(['WorkosCursorSessionToken', accountData.sessionToken])
  console.log('🔑 检测到 SessionToken，将使用 SessionToken 模式认证')
}
```

#### 3. 完整Token模式（可选）
```javascript
// 🔑 如果有完整的 token，也添加进去
if (accountData.accessToken) {
  updates.push(['cursorAuth/accessToken', accountData.accessToken])
}
if (accountData.refreshToken) {
  updates.push(['cursorAuth/refreshToken', accountData.refreshToken])
}
```

### 数据库更新方式（参考cursor-free-vip）

**使用 `INSERT OR REPLACE` 而不是分别判断INSERT/UPDATE**：

```javascript
// ✅ 更可靠的方式（cursor-free-vip使用的方式）
const sql = "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)"
await api.sqliteQuery(this.cursorPaths.sqlite, sql, [key, value])
```

而不是：

```javascript
// ❌ 旧的方式（可能存在竞态条件）
const sql = exists 
  ? "UPDATE ItemTable SET value = ? WHERE key = ?"
  : "INSERT INTO ItemTable (key, value) VALUES (?, ?)"
```

## 📊 Cursor认证机制详解

### 认证优先级（基于cursor-free-vip研究）

1. **优先使用** `WorkosCursorSessionToken`（如果存在）
2. **其次使用** `accessToken` + `refreshToken`
3. **同时存在时**：Cursor会优先使用 `WorkosCursorSessionToken`

### 必须字段

| 字段 | 重要性 | 说明 |
|------|--------|------|
| `cursorAuth/cachedEmail` | ⭐⭐⭐⭐⭐ | 必须，邮箱地址 |
| `WorkosCursorSessionToken` | ⭐⭐⭐⭐⭐ | 最重要的认证字段 |
| `cursorAuth/cachedSignUpType` | ⭐⭐⭐⭐ | 注册类型（Auth0等） |
| `cursorAuth/accessToken` | ⭐⭐⭐ | 访问令牌（可选） |
| `cursorAuth/refreshToken` | ⭐⭐⭐ | 刷新令牌（可选） |

## 🔄 正确的一键换号流程

### 完整流程（参考cursor-free-vip优化）

```javascript
// 1. 获取新账号（从后端）
const newAccount = await getAccountFromBackend()
// 返回: { email, sessionToken, accessToken, refreshToken, signUpType }

// 2. 关闭Cursor进程
await cursorService.killCursorProcess()

// 3. 重置机器ID（参考cursor-free-vip的实现）
await cursorService.resetMachineId()

// 4. 🔑 更新账号信息（关键步骤）
const updates = [
  ['cursorAuth/cachedEmail', newAccount.email],
  ['cursorAuth/cachedSignUpType', newAccount.signUpType || 'Auth0']
]

// 🔑 如果有sessionToken，这是最重要的
if (newAccount.sessionToken) {
  updates.push(['WorkosCursorSessionToken', newAccount.sessionToken])
}

// 如果有accessToken和refreshToken，也添加
if (newAccount.accessToken) updates.push(['cursorAuth/accessToken', newAccount.accessToken])
if (newAccount.refreshToken) updates.push(['cursorAuth/refreshToken', newAccount.refreshToken])

// 逐一更新数据库
for (const [key, value] of updates) {
  await api.sqliteQuery(dbPath, 
    "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", 
    [key, value])
}

// 5. 清理缓存（可选，但建议）
await cursorService.cleanCursorCache()

// 6. 启动Cursor
await cursorService.startCursor()

// 7. 验证账号切换（等待Cursor加载）
await delay(15000)
const currentAccount = await cursorService.getCurrentAccountInfo()
// 检查是否切换成功
```

## 🎯 关键修复点总结

### ✅ 已修复

1. **添加WorkosCursorSessionToken更新** - 这是最关键的字段
2. **使用INSERT OR REPLACE** - 更可靠的数据库更新方式
3. **按需添加字段** - 根据账号数据动态决定更新哪些字段
4. **使用后端返回的signUpType** - 而不是硬编码
5. **改进日志输出** - 更详细的调试信息

### 🔑 核心逻辑

```javascript
// 基础字段总是更新
updates = [
  ['cursorAuth/cachedEmail', email],
  ['cursorAuth/cachedSignUpType', signUpType]
]

// 按需添加认证字段
if (sessionToken) updates.push(['WorkosCursorSessionToken', sessionToken])
if (accessToken) updates.push(['cursorAuth/accessToken', accessToken])
if (refreshToken) updates.push(['cursorAuth/refreshToken', refreshToken])
```

## 🧪 验证方法

### 1. 查看控制台日志

一键换号时应该看到：

```
🔧 开始更新账号存储配置（参考cursor-free-vip的正确实现）...
📧 目标账号: newaccount@example.com
🔑 SessionToken: 有
🔑 AccessToken: 有
📂 SQLite数据库路径: C:\Users\xxx\AppData\Roaming\Cursor\User\globalStorage\state.vscdb
✅ 数据库文件存在，开始更新
🔑 检测到 SessionToken，将使用 SessionToken 模式认证
🔧 准备更新以下字段:
  - cursorAuth/cachedSignUpType: Auth0
  - cursorAuth/cachedEmail: newaccount@example.com
  - WorkosCursorSessionToken: user_01K860SSW4F...
  - cursorAuth/accessToken: eyJhbGci...
  - cursorAuth/refreshToken: eyJhbGci...
🔄 开始数据库事务...
✅ 更新 cachedSignUpType
✅ 更新 cachedEmail
✅ 更新 WorkosCursorSessionToken
✅ 更新 accessToken
✅ 更新 refreshToken
✅ 账号存储更新完成！
✅ 更新的字段数: 5
📊 更新的字段: cachedSignUpType, cachedEmail, WorkosCursorSessionToken, accessToken, refreshToken
```

### 2. 检查数据库

```sql
SELECT key, substr(value, 1, 50) as value_preview 
FROM ItemTable 
WHERE key IN (
  'WorkosCursorSessionToken',
  'cursorAuth/accessToken',
  'cursorAuth/refreshToken',
  'cursorAuth/cachedEmail',
  'cursorAuth/cachedSignUpType'
)
ORDER BY key;
```

### 3. 验证Cursor登录状态

- 换号后启动Cursor
- 应该自动登录新账号
- Pro功能正常可用
- 不会自动退出登录

## 📝 对比cursor-free-vip

| 方面 | cursor-free-vip | 你的项目（修复后） |
|------|----------------|-------------------|
| 功能 | 机器ID重置 | 一键换号 |
| 账号信息 | 不修改 | 完全替换 |
| WorkosCursorSessionToken | 不修改 | ✅ 更新 |
| accessToken | 不修改 | ✅ 更新（如果有） |
| refreshToken | 不修改 | ✅ 更新（如果有） |
| 数据库更新方式 | INSERT OR REPLACE | ✅ INSERT OR REPLACE |
| 事务处理 | 使用事务 | ✅ 使用事务 |

## 🚀 使用建议

1. **清理旧数据**: 如果之前有失败的尝试，建议先清理Cursor缓存
2. **重启应用**: 修复后需要重新构建并运行应用
3. **测试流程**: 先用一个测试账号验证功能正常
4. **监控日志**: 注意查看控制台输出的详细日志

现在按照cursor-free-vip的正确实现方式，一键换号功能应该完全正常了！🎉
