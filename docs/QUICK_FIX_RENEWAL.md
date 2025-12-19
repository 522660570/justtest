# 一键续杯功能快速修复

## ✅ 已修复

修复了"一键续杯"功能中 Cursor 显示未登录的问题。

## 🔍 问题原因

后端返回的 `sessionToken` 格式为：`user_01XXX::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

前端直接将整个 `sessionToken` 写入数据库，但 Cursor 需要的是提取后的 JWT 部分（`::` 或 `%3A%3A` 后面的内容）。

## ✅ 修复内容

### 修改的文件

- `src/services/CursorService.js`
  - `updateAccountStorage()` 方法：添加 sessionToken 提取逻辑
  - `getCurrentAccountInfo()` 方法：移除对 WorkosCursorSessionToken 的依赖

### 核心修复逻辑

```javascript
// 从 sessionToken 中提取 JWT
if (accountData.sessionToken && !finalAccessToken) {
  if (accountData.sessionToken.includes('%3A%3A')) {
    const parts = accountData.sessionToken.split('%3A%3A')
    finalAccessToken = parts[parts.length - 1].trim()
  } else if (accountData.sessionToken.includes('::')) {
    const parts = accountData.sessionToken.split('::')
    finalAccessToken = parts[parts.length - 1].trim()
  }
}

// 更新数据库
const updates = [
  ['cursorAuth/cachedSignUpType', 'Auth0'],
  ['cursorAuth/cachedEmail', email],
  ['cursorAuth/accessToken', finalAccessToken],  // ✅ JWT 部分
  ['cursorAuth/refreshToken', finalRefreshToken] // ✅ JWT 部分
]
```

## 🧪 测试步骤

### 1. 启动应用

```bash
npm run electron:dev
```

### 2. 验证授权码

输入有效的授权码并点击"验证授权码"

### 3. 点击"一键续杯"

系统会自动执行以下步骤：
1. 从服务器获取新账号
2. **提取 JWT** 从 sessionToken
3. 关闭 Cursor 进程
4. 重置机器ID
5. **更新数据库**（写入提取后的 JWT）
6. 清理缓存
7. 重启 Cursor

### 4. 查看控制台日志

应该看到以下关键日志：

```
🔑 检测到只有 sessionToken，开始提取 JWT...
📊 SessionToken 格式: user_01K8Z3EXR8H8H5QN9A6M10RNSS%3A%3AeyJhbGciOiJI...
✅ 从 %3A%3A 分隔的 sessionToken 中提取 JWT
🔑 提取的 accessToken 长度: 245
✅ accessToken 格式验证通过
🔧 准备更新以下字段:
  - cursorAuth/cachedSignUpType: Auth0
  - cursorAuth/cachedEmail: test@example.com
  - cursorAuth/accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - cursorAuth/refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ 更新 cachedSignUpType
✅ 更新 cachedEmail
✅ 更新 accessToken
✅ 更新 refreshToken
✅ 账号存储更新完成！
```

### 5. 验证 Cursor 登录状态

1. 等待 Cursor 自动重启
2. 查看 Cursor 右上角是否显示登录的邮箱
3. 进入 Cursor Settings 验证账号信息

## 📊 后端返回数据格式

后端返回的数据（无需修改）：

```json
{
  "code": 1,
  "message": "获取新账号成功",
  "data": {
    "email": "test@example.com",
    "sessionToken": "user_01XXX%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "signUpType": "Auth0",
    "membershipType": "free_trial"
  }
}
```

**注意**：
- 如果 `accessToken` 已经存在，直接使用
- 如果 `accessToken` 不存在，从 `sessionToken` 中提取
- 提取后的 JWT 必须以 `eyJ` 开头

## 🔍 故障排查

### 问题：Cursor 仍显示未登录

**检查清单：**
1. 查看控制台日志，确认 JWT 提取成功
2. 确认 accessToken 以 `eyJ` 开头
3. 确认 Cursor 进程已完全关闭并重启
4. 使用 SQLite 工具检查数据库内容

### 问题：提取 JWT 失败

**可能原因：**
- sessionToken 格式不正确
- 分隔符不是 `::` 或 `%3A%3A`

**解决方法：**
- 查看控制台中打印的 sessionToken 格式
- 确认后端返回的数据正确

### 问题：数据库更新失败

**可能原因：**
- Cursor 进程没有完全关闭
- 数据库文件被占用
- 权限不足

**解决方法：**
- 手动结束所有 Cursor 进程
- 以管理员身份运行应用
- 检查数据库文件路径是否正确

## 📋 验证清单

- [ ] 修改了 `src/services/CursorService.js`
- [ ] 启动应用并输入授权码
- [ ] 执行"一键续杯"
- [ ] 查看控制台日志（JWT 提取成功）
- [ ] Cursor 自动重启
- [ ] Cursor 显示已登录状态
- [ ] 可以正常使用 Cursor AI 功能

## 💡 参考

- `cursor-free-vip-main/cursor_auth.py` - 数据库更新方法
- `cursor-free-vip-main/get_user_token.py` - JWT 提取方法

---

**修复时间**: 2024-11-03  
**状态**: ✅ 已完成







