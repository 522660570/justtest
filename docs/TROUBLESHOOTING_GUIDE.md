# 换号功能问题排查指南

## 🎯 问题描述

换号后 Cursor 显示未登录状态。

## 🔍 排查步骤

### 步骤 1：重新编译并启动后端

```bash
cd mycursor_java
mvn clean install
mvn spring-boot:run
```

### 步骤 2：检查数据库中的账号数据

连接数据库，查询一个测试账号：

```sql
SELECT 
  email, 
  LENGTH(access_token) as access_token_len,
  LENGTH(refresh_token) as refresh_token_len,
  LENGTH(session_token) as session_token_len,
  SUBSTR(access_token, 1, 50) as access_token_preview,
  SUBSTR(session_token, 1, 80) as session_token_preview
FROM cursor_account 
WHERE is_available = 1 
LIMIT 1;
```

**期望结果**：
- `access_token_len` > 0 或者 `session_token_len` > 0
- 如果只有 `session_token`，系统会自动从中提取 `access_token`

### 步骤 3：测试获取账号API

使用授权码测试获取账号：

```bash
curl http://localhost:8088/api/accounts/getAccountByCode/你的授权码/00:11:22:33:44:55/test@test.com
```

**检查返回数据**：
```json
{
  "code": 1,
  "message": "获取新账号成功",
  "data": {
    "email": "xxx@xxx.com",
    "accessToken": "eyJhbGci...",  // ✅ 必须存在
    "refreshToken": "eyJhbGci...", // ✅ 必须存在  
    "sessionToken": "user_01XXX...",
    "signUpType": "Auth_0"
  }
}
```

**检查后端日志**：
```log
DEBUG 原始账号数据 - email: xxx, accessToken: 有/无, refreshToken: 有/无, sessionToken: 有/无
INFO  检测到缺少 token，从 sessionToken 中提取...
INFO  ✅ 成功提取 accessToken (长度: 123)
INFO  ✅ 成功提取 refreshToken (长度: 123)
INFO  成功分配账号: xxx (accessToken: 有, refreshToken: 有, sessionToken: 有)
```

**如果看到错误日志**：
```log
ERROR ❌ 从 sessionToken 中提取 Token 失败！
ERROR ⚠️⚠️⚠️ 警告：返回的账号没有 accessToken，换号可能失败！
```

这说明：
1. 数据库中的账号既没有 `access_token`
2. 也没有 `session_token`
3. 或者 `session_token` 格式不对

### 步骤 4：检查前端日志

打开浏览器开发者工具的 Console，点击"Pro续期/一键换号"，观察日志：

**正常流程**：
```log
🔧 获取新账号: { licenseCode, currentEmail }
✅ 获取新账号成功: xxx@xxx.com
🔑 账号包含 SessionToken (已自动补全 accessToken/refreshToken)
🔧 步骤2: 正在彻底关闭所有Cursor进程...
✅ 所有Cursor进程已关闭
🔧 步骤3: 正在重置机器ID...
🔧 步骤4: 正在应用新账号: xxx@xxx.com
🔧 准备更新以下字段:
  - cursorAuth/cachedSignUpType: Auth_0
  - cursorAuth/cachedEmail: xxx@xxx.com
  - WorkosCursorSessionToken: user_01XXX...
  - cursorAuth/accessToken: eyJhbGci...
  - cursorAuth/refreshToken: eyJhbGci...
✅ 更新 cursorAuth/accessToken
✅ 更新 cursorAuth/refreshToken
✅ 更新 WorkosCursorSessionToken
✅ 账号存储更新成功
```

**异常情况**：
```log
❌ Pro续期失败: 获取的新账号缺少accessToken
```

这说明后端返回的数据中没有 `accessToken`。

### 步骤 5：手动检查 Cursor 数据库

Cursor 重启后，检查 SQLite 数据库：

**Windows**:
```powershell
$dbPath = "$env:APPDATA\Cursor\User\globalStorage\state.vscdb"
# 使用 SQLite 工具查看
```

**查询SQL**：
```sql
SELECT key, 
       CASE 
         WHEN LENGTH(value) > 50 THEN SUBSTR(value, 1, 50) || '...'
         ELSE value 
       END as value_preview
FROM ItemTable 
WHERE key IN (
  'cursorAuth/cachedEmail',
  'cursorAuth/accessToken',
  'cursorAuth/refreshToken',
  'WorkosCursorSessionToken'
);
```

**期望结果**：
| key | value_preview |
|-----|---------------|
| cursorAuth/cachedEmail | xxx@xxx.com |
| cursorAuth/accessToken | eyJhbGci... |
| cursorAuth/refreshToken | eyJhbGci... |
| WorkosCursorSessionToken | user_01XXX... |

**如果缺少 `cursorAuth/accessToken` 或 `cursorAuth/refreshToken`**，Cursor 会显示未登录状态！

## 🔧 可能的问题和解决方案

### 问题 1：数据库中账号没有 token

**症状**：
- 数据库中 `access_token`, `refresh_token`, `session_token` 都是 NULL

**解决方案**：
重新导入账号数据，确保包含认证信息：

```json
[
  {
    "email": "test@example.com",
    "auth_info": {
      "cursorAuth/accessToken": "eyJhbGci...",
      "cursorAuth/refreshToken": "eyJhbGci...",
      "WorkosCursorSessionToken": "user_01XXX..."
    }
  }
]
```

### 问题 2：sessionToken 格式不正确

**症状**：
- 有 `session_token` 但提取失败
- 日志显示："❌ 从 sessionToken 中提取 Token 失败"

**SessionToken 正确格式**：
- `user_01K4SCY50Y0MC6R44J47C0K41E%3A%3AeyJhbGci...` (URL 编码)
- `user_01K4SCY50Y0MC6R44J47C0K41E::eyJhbGci...` (普通格式)
- `eyJhbGci...` (纯 JWT)

**解决方案**：
检查数据库中的 `session_token` 字段，确保格式正确。

### 问题 3：前端写入数据库失败

**症状**：
- 后端返回数据正常
- 前端日志显示成功
- 但 Cursor 数据库中没有数据

**检查**：
1. Cursor 是否真的完全关闭了？
2. SQLite 数据库文件路径是否正确？
3. 是否有权限问题？

**解决方案**：
```bash
# 手动彻底关闭 Cursor
taskkill /F /IM Cursor.exe

# 检查进程是否真的结束
tasklist | findstr Cursor

# 然后再次尝试换号
```

### 问题 4：Token 已过期

**症状**：
- 数据写入成功
- 但 Cursor 仍显示未登录

**可能原因**：
Token 已过期，需要刷新或重新获取账号。

## 📊 完整的数据流

```
数据库账号
  ├─ access_token: eyJhbGci... (有)
  ├─ refresh_token: eyJhbGci... (有)  
  └─ session_token: user_01XXX... (有)
      ↓
后端 getAccountByCode
  ├─ 直接返回已有的 tokens ✅
  └─ 或从 session_token 中提取 ✅
      ↓
前端接收数据
  ├─ accessToken: "eyJhbGci..."
  ├─ refreshToken: "eyJhbGci..."
  └─ sessionToken: "user_01XXX..."
      ↓
CursorService 写入数据库
  ├─ cursorAuth/accessToken → eyJhbGci...
  ├─ cursorAuth/refreshToken → eyJhbGci...
  └─ WorkosCursorSessionToken → user_01XXX...
      ↓
Cursor 重启
  └─ 读取数据库 → 显示已登录 ✅
```

## 🚨 紧急回滚方案

如果所有方法都失败，可以临时禁用自动补全逻辑：

在 `AccountService.java` 的 `getAccountByCode` 方法中，注释掉补全逻辑：

```java
// 临时禁用自动补全
// if ((accessToken == null || refreshToken == null) && sessionToken != null) {
//     Map<String, String> tokens = getTokensFromSessionToken(sessionToken);
//     ...
// }
```

然后确保数据库中的账号本身就有完整的 `access_token` 和 `refresh_token`。

## 📝 需要提供的信息

如果问题仍未解决，请提供以下信息：

1. **数据库查询结果**（步骤2的输出）
2. **后端API返回数据**（步骤3的返回JSON）
3. **后端日志**（启动后端后的完整日志）
4. **前端Console日志**（浏览器开发者工具中的日志）
5. **Cursor数据库查询结果**（步骤5的查询结果）

---

**提示**：问题很可能出在数据源头（数据库中的账号数据不完整）或数据写入（Cursor进程未完全关闭）。



