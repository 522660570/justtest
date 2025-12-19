# 一键续杯功能完整实现指南

## 🎯 问题描述

后端返回的数据是正确的，包含：
- `sessionToken`：完整的 WorkosCursorSessionToken
- `accessToken`：访问令牌
- `refreshToken`：刷新令牌
- `email`：邮箱
- `signUpType`：登录类型

但前端更新到 Cursor 数据库后，Cursor 显示未登录状态。

## ✅ 正确的实现方式（参考 cursor-free-vip-main）

### 1. SQLite 数据库需要更新的字段

参考 `cursor-free-vip-main/cursor_auth.py`，需要在 SQLite 数据库（`state.vscdb`）中更新：

```python
# cursor-free-vip-main 的实现
updates = [
    ("cursorAuth/cachedSignUpType", auth_type),  # 登录类型：Auth0、Auth_0等
    ("cursorAuth/cachedEmail", email),            # 邮箱
    ("cursorAuth/accessToken", access_token),     # AccessToken
    ("cursorAuth/refreshToken", refresh_token),   # RefreshToken
]
```

**🔑 关键发现：** `cursor-free-vip-main` 并没有直接写入 `WorkosCursorSessionToken`！

### 2. SessionToken 的正确使用方式

根据代码分析：

1. **SessionToken 的作用**：
   - SessionToken 格式：`user_01XXX::JWT`
   - 后面的 JWT 部分才是真正的 `accessToken`

2. **正确的提取方式**：
```python
# cursor-free-vip-main/get_user_token.py
def get_token_from_cookie(cookie_value):
    # 如果失败，fallback到直接提取
    if '%3A%3A' in cookie_value:
        return cookie_value.split('%3A%3A')[-1]
    elif '::' in cookie_value:
        return cookie_value.split('::')[-1]
    return cookie_value
```

## 📝 修复方案

### 方案1：使用完整的 SessionToken（推荐）

更新 `CursorService.updateAccountStorage()` 方法：

```javascript
// src/services/CursorService.js

async updateAccountStorage(accountData) {
  await this.initialize()
  
  try {
    console.log('🔧 开始更新账号存储配置...')
    console.log('📊 接收到的账号数据:', {
      email: accountData.email,
      hasSessionToken: !!accountData.sessionToken,
      hasAccessToken: !!accountData.accessToken,
      signUpType: accountData.signUpType
    })
    
    // 🔑 关键修复：如果后端返回的是 sessionToken，需要提取 JWT 部分作为 accessToken
    let finalAccessToken = accountData.accessToken
    let finalRefreshToken = accountData.refreshToken
    
    if (accountData.sessionToken && !accountData.accessToken) {
      console.log('🔑 检测到只有 sessionToken，开始提取 JWT...')
      
      // 从 sessionToken 中提取 JWT（格式: user_01XXX::JWT 或 user_01XXX%3A%3AJWT）
      if (accountData.sessionToken.includes('%3A%3A')) {
        const parts = accountData.sessionToken.split('%3A%3A')
        finalAccessToken = parts[parts.length - 1]
        console.log('✅ 从 %3A%3A 分隔的 sessionToken 中提取 JWT')
      } else if (accountData.sessionToken.includes('::')) {
        const parts = accountData.sessionToken.split('::')
        finalAccessToken = parts[parts.length - 1]
        console.log('✅ 从 :: 分隔的 sessionToken 中提取 JWT')
      } else if (accountData.sessionToken.startsWith('eyJ')) {
        finalAccessToken = accountData.sessionToken
        console.log('✅ sessionToken 本身就是 JWT')
      }
      
      finalRefreshToken = finalAccessToken // refreshToken 使用相同的值
      
      console.log('🔑 提取的 accessToken 长度:', finalAccessToken?.length)
    }
    
    // 验证 JWT 格式
    if (!finalAccessToken || !finalAccessToken.startsWith('eyJ')) {
      throw new Error('无效的 accessToken 格式（JWT应该以 eyJ 开头）')
    }
    
    // 准备更新的字段（参考 cursor-free-vip-main）
    const updates = [
      ['cursorAuth/cachedSignUpType', accountData.signUpType || 'Auth0'],
      ['cursorAuth/cachedEmail', accountData.email],
      ['cursorAuth/accessToken', finalAccessToken],
      ['cursorAuth/refreshToken', finalRefreshToken || finalAccessToken]
    ]
    
    console.log('🔧 准备更新以下字段:')
    updates.forEach(([key, value]) => {
      console.log(`  - ${key}: ${value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null'}`)
    })
    
    // 逐一更新每个字段
    for (const [key, value] of updates) {
      if (value) {
        const sql = "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)"
        await api.sqliteQuery(this.cursorPaths.sqlite, sql, [key, value])
        console.log(`✅ 更新 ${key.split('/').pop()}`)
      }
    }
    
    console.log('✅ 账号存储更新完成！')
    
    return {
      success: true,
      message: 'Account storage updated successfully',
      updatedFields: updates.map(([key]) => key),
      storagePath: this.cursorPaths.sqlite
    }
    
  } catch (error) {
    console.error('❌ 更新账号存储失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
```

### 方案2：后端直接返回提取好的 accessToken（更简单）

修改后端 `AccountService.java`，在返回账号数据之前就提取好：

```java
// AccountService.java

Map<String, Object> accountData = new HashMap<>();
accountData.put("email", account.getEmail());

String accessToken = account.getAccessToken();
String refreshToken = account.getRefreshToken();
String sessionToken = account.getSessionToken();

// 🔑 关键：如果只有 sessionToken，从中提取 accessToken
if ((accessToken == null || accessToken.trim().isEmpty()) && 
    (sessionToken != null && !sessionToken.trim().isEmpty())) {
    
    Map<String, String> extractedTokens = getTokensFromSessionToken(sessionToken);
    accessToken = extractedTokens.get("accessToken");
    refreshToken = extractedTokens.get("refreshToken");
    
    // 不需要返回 sessionToken，只返回提取后的 accessToken
    sessionToken = null;
}

// 返回数据
accountData.put("accessToken", accessToken);
accountData.put("refreshToken", refreshToken);
accountData.put("sessionToken", sessionToken);  // 可以不返回或设置为null
accountData.put("signUpType", account.getSignUpType());
```

## 🧪 测试步骤

### 1. 验证后端返回数据

```json
{
  "code": 1,
  "message": "获取新账号成功",
  "data": {
    "email": "test@example.com",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // ✅ 必须有
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // ✅ 必须有
    "signUpType": "Auth0",  // ✅ 必须有
    "sessionToken": "user_01XXX::eyJ..."  // ⚠️ 可选，如果有需要提取JWT
  }
}
```

### 2. 检查前端日志

执行"一键续杯"后，查看浏览器控制台：

```
🔧 开始更新账号存储配置...
📊 接收到的账号数据: {email: "test@example.com", hasAccessToken: true, ...}
🔧 准备更新以下字段:
  - cursorAuth/cachedSignUpType: Auth0
  - cursorAuth/cachedEmail: test@example.com
  - cursorAuth/accessToken: eyJhbGciOiJI...
  - cursorAuth/refreshToken: eyJhbGciOiJI...
✅ 更新 cachedSignUpType
✅ 更新 cachedEmail
✅ 更新 accessToken
✅ 更新 refreshToken
✅ 账号存储更新完成！
```

### 3. 验证数据库

使用 SQLite 工具查询 `state.vscdb`：

```sql
SELECT key, substr(value, 1, 50) as value_preview
FROM ItemTable
WHERE key LIKE 'cursorAuth%'
ORDER BY key;
```

应该看到：
```
cursorAuth/cachedEmail          | test@example.com
cursorAuth/cachedSignUpType     | Auth0
cursorAuth/accessToken          | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
cursorAuth/refreshToken         | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 验证 Cursor 登录状态

1. 关闭所有 Cursor 进程
2. 重启 Cursor
3. 检查右上角是否显示登录的邮箱
4. 进入 Settings 查看账号信息

## 🔍 故障排查

### 问题1：Cursor 仍显示未登录

**可能原因：**
- accessToken 格式不正确（不是有效的 JWT）
- accessToken 已过期
- 数据库更新失败
- Cursor 进程没有完全关闭

**解决方法：**
1. 检查 accessToken 是否以 `eyJ` 开头
2. 验证 accessToken 长度（通常 > 200 字符）
3. 查看前端控制台日志
4. 强制结束所有 Cursor 进程后重试

### 问题2：数据库更新失败

**可能原因：**
- 数据库文件被占用
- 数据库路径不正确
- 权限不足

**解决方法：**
1. 确保 Cursor 已完全关闭
2. 检查数据库路径是否正确
3. 以管理员身份运行程序

### 问题3：accessToken 提取失败

**可能原因：**
- sessionToken 格式不正确
- 分隔符不是 `::` 或 `%3A%3A`

**解决方法：**
1. 打印 sessionToken 的值
2. 检查分隔符
3. 确认后端返回的数据格式

## 📋 实现清单

- [ ] 方案1：前端提取 JWT（修改 CursorService.js）
- [ ] 方案2：后端提取 JWT（修改 AccountService.java）
- [ ] 验证后端返回数据格式
- [ ] 测试数据库更新
- [ ] 测试完整的续杯流程
- [ ] 验证 Cursor 登录状态

## 💡 推荐方案

**推荐使用方案2（后端提取）**，因为：
1. 前端逻辑更简单
2. 数据在返回前就已经处理好
3. 减少前端出错的可能性
4. 更符合职责分离原则

## 📚 参考代码

- `cursor-free-vip-main/cursor_auth.py` - 数据库更新
- `cursor-free-vip-main/get_user_token.py` - Token 提取
- `cursor-free-vip-main/totally_reset_cursor.py` - 机器ID重置

---

**更新时间**: 2024-11-03  
**状态**: ✅ 完整方案







