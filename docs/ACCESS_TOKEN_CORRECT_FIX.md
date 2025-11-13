# AccessToken 正确获取方式修复

## 🎯 问题重述

之前的实现**错误地理解了 AccessToken 的获取方式**。我误以为直接从 `WorkosCursorSessionToken` 中提取 `::` 后面的 JWT 部分就是 accessToken，但这是**错误的**！

## ✅ 正确的实现方式

参考 `cursor-free-vip-main` 项目的 `get_user_token.py`，正确的流程是：

### 1. 调用 Refresh API（优先方式）

```
GET https://token.cursorpro.com.cn/reftoken?token={完整的WorkosCursorSessionToken}
```

**请求示例：**
```
GET https://token.cursorpro.com.cn/reftoken?token=user_01JBXM7WCPF9Y6VGW12345678%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例：**
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...[真正的accessToken]",
    "days_left": 14,
    "expire_time": "2024-11-17"
  }
}
```

### 2. Fallback 方式（API 失败时）

如果 refresh API 不可用或失败，才使用提取 JWT 的方式作为 fallback：

```java
// 从 user_01XXX::eyJXXX 中提取 eyJXXX 部分
String jwt = sessionToken.split("::")[-1];
```

## 🔧 实现的修复

### 1. 新建 `TokenRefreshService`

创建了专门的服务类来处理 Token 刷新：

**文件位置**: `mycursor_java/src/main/java/com/mycursor/service/TokenRefreshService.java`

**主要方法**：

#### `refreshAccessToken(String sessionToken)`
- 调用 refresh API 获取真正的 accessToken
- 返回包含 accessToken、refreshToken、daysLeft、expireTime 的 Map

#### `extractJwtFromSessionToken(String sessionToken)`
- Fallback 方法：直接提取 JWT 部分
- 当 refresh API 失败时使用

#### `getAccessToken(String sessionToken)`
- 综合方法：优先使用 refresh API，失败时使用 fallback
- 这是其他服务应该调用的方法

### 2. 修改 `AccountService`

修改了 `AccountService` 中的 token 处理逻辑：

**修改前（错误）**：
```java
private Map<String, String> extractTokensFromSessionToken(String sessionToken) {
    // 直接提取 :: 后面的 JWT（错误！）
    String[] parts = sessionToken.split("::");
    jwt = parts[parts.length - 1];
    tokens.put("accessToken", jwt);
    return tokens;
}
```

**修改后（正确）**：
```java
private Map<String, String> getTokensFromSessionToken(String sessionToken) {
    // 使用 TokenRefreshService（优先调用 refresh API）
    return tokenRefreshService.getAccessToken(sessionToken);
}
```

### 3. 添加配置参数

在 `application.yml` 中添加了 refresh server 配置：

```yaml
cursor:
  token:
    refresh-server: https://token.cursorpro.com.cn
```

## 📊 对比：错误 vs 正确

### 错误的方式（之前的实现）

```java
// ❌ 直接提取 JWT，认为它就是 accessToken
String sessionToken = "user_01XXX::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
String accessToken = sessionToken.split("::")[1];  // 错误！
```

**问题**：
- 这个 JWT 可能不是真正的 accessToken
- 没有验证有效期
- 无法获取过期时间等信息

### 正确的方式（当前实现）

```java
// ✅ 调用 refresh API 获取真正的 accessToken
String sessionToken = "user_01XXX::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// 方法1：优先调用 API
Map<String, Object> result = tokenRefreshService.refreshAccessToken(sessionToken);
if (result.get("success")) {
    String accessToken = (String) result.get("accessToken");  // 真正的 accessToken ✅
    int daysLeft = (int) result.get("daysLeft");
    String expireTime = (String) result.get("expireTime");
}

// 方法2：如果 API 失败，fallback 到提取 JWT
else {
    String jwt = tokenRefreshService.extractJwtFromSessionToken(sessionToken);
}
```

## 🧪 测试步骤

### 1. 准备测试数据

创建 `test_accounts_real.json`：

```json
[
  {
    "email": "test@example.com",
    "WorkosCursorSessionToken": "user_01JBXM7WCPF9Y6VGW12345678::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[你的真实token]"
  }
]
```

### 2. 启动后端服务

```bash
cd mycursor_java
mvn spring-boot:run
```

### 3. 导入账号

```bash
curl -X POST http://localhost:8088/api/importAccountsFromJson \
  -H "Content-Type: application/json" \
  -d @test_accounts_real.json
```

### 4. 查看日志

日志应该显示：

```
🔑 开始从 SessionToken 获取 accessToken...
🔄 调用 Token Refresh API: https://token.cursorpro.com.cn...
✅ Token 刷新成功! accessToken 长度: 500, 剩余天数: 14, 过期时间: 2024-11-17
✅ 通过 Refresh API 成功获取 accessToken
✅ 成功获取 accessToken (长度: 500)
```

如果 API 失败，会看到 fallback：

```
🔄 调用 Token Refresh API: https://token.cursorpro.com.cn...
⚠️ Refresh API 失败，尝试直接提取 JWT 作为 fallback...
✅ 通过直接提取获取 JWT (fallback 方式)
```

### 5. 验证数据库

```sql
SELECT 
    email,
    LEFT(access_token, 50) as token_preview,
    LENGTH(access_token) as token_length,
    session_token IS NOT NULL as has_session_token
FROM cursor_account 
WHERE email = 'test@example.com';
```

## 🔍 如何判断是否正确

### 正确的 AccessToken 特征

1. **长度更长**：通常 500+ 字符（相比直接提取的 JWT 可能只有 200+ 字符）
2. **格式不同**：refresh API 返回的 token 可能使用不同的签名算法
3. **有效期信息**：refresh API 会返回 `days_left` 和 `expire_time`

### 测试方法

使用获取到的 accessToken 调用 Cursor API：

```bash
curl -X GET https://www.cursor.com/api/usage \
  -H "Cookie: WorkosCursorSessionToken=user_01XXX%3A%3A${ACCESS_TOKEN}"
```

如果返回用户使用情况，说明 token 有效；如果返回 401 或其他错误，说明 token 无效。

## 📝 修改文件清单

### 新增文件
- ✅ `mycursor_java/src/main/java/com/mycursor/service/TokenRefreshService.java`
- ✅ `docs/ACCESS_TOKEN_CORRECT_FIX.md`（本文档）

### 修改文件
- ✅ `mycursor_java/src/main/java/com/mycursor/service/AccountService.java`
  - 修改方法名：`extractTokensFromSessionToken` → `getTokensFromSessionToken`
  - 修改实现：使用 `TokenRefreshService` 代替直接提取
- ✅ `mycursor_java/src/main/resources/application.yml`
  - 添加 `cursor.token.refresh-server` 配置

### 废弃的文档（之前的错误理解）
- ⚠️ `docs/IMPORT_ACCOUNT_FIX.md` - 基于错误理解编写，不再适用
- ⚠️ `docs/ACCESS_TOKEN_FIX_SUMMARY.md` - 基于错误理解编写，不再适用

## 🔄 与 Python 版本的对应关系

### Python 版本（cursor-free-vip-main）

```python
# get_user_token.py
def get_token_from_cookie(cookie_value, translator=None):
    # 1. 优先使用 refresh API
    refreshed_token = refresh_token(cookie_value, translator)
    if refreshed_token and refreshed_token != cookie_value:
        return refreshed_token
    
    # 2. Fallback 到直接提取
    if '::' in cookie_value:
        return cookie_value.split('::')[-1]
    return cookie_value
```

### Java 版本（当前实现）

```java
// TokenRefreshService.java
public Map<String, String> getAccessToken(String sessionToken) {
    // 1. 优先使用 refresh API
    Map<String, Object> refreshResult = refreshAccessToken(sessionToken);
    if (Boolean.TRUE.equals(refreshResult.get("success"))) {
        return extractTokens(refreshResult);
    }
    
    // 2. Fallback 到直接提取
    String jwt = extractJwtFromSessionToken(sessionToken);
    return buildTokenMap(jwt);
}
```

## ⚠️ 重要注意事项

### 1. Refresh API 的可用性

- refresh API 服务器地址：`https://token.cursorpro.com.cn`
- 如果该服务器不可用，会自动 fallback 到直接提取 JWT
- 可以通过配置修改 refresh server 地址

### 2. SessionToken 的格式

确保 `WorkosCursorSessionToken` 是**完整的**，包括 user_id 部分：

✅ **正确**：`user_01JBXM7WCPF9Y6VGW12345678::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

❌ **错误**：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（只有 JWT 部分）

### 3. 网络要求

- 后端服务器需要能够访问 `https://token.cursorpro.com.cn`
- 如果在内网环境，可能需要配置代理
- 超时时间设置为 30 秒

### 4. 日志级别

建议测试时启用 DEBUG 日志：

```yaml
logging:
  level:
    com.mycursor.service.TokenRefreshService: DEBUG
    com.mycursor.service.AccountService: DEBUG
```

## 🎉 修复效果

### 修复前（错误）
- ❌ 直接提取 JWT，认为它就是 accessToken
- ❌ 无法获取 token 有效期信息
- ❌ 可能导致 token 无效

### 修复后（正确）
- ✅ 调用 refresh API 获取真正的 accessToken
- ✅ 获取 token 有效期和过期时间
- ✅ 如果 API 失败，自动 fallback 到提取 JWT
- ✅ 完整的日志记录，便于调试

## 📖 参考资料

- [cursor-free-vip-main 项目](https://github.com/yeongpin/cursor-free-vip)
- `cursor-free-vip-main/get_user_token.py` - Python 版本实现
- Refresh API: `https://token.cursorpro.com.cn/reftoken`

## 💬 反馈与改进

如果在使用过程中遇到问题：

1. 检查日志中的详细信息
2. 确认 refresh API 是否可访问
3. 验证 SessionToken 格式是否正确
4. 尝试使用真实的 SessionToken 测试

---

**修复完成时间**: 2024-11-03  
**参考项目**: cursor-free-vip-main  
**修复状态**: ✅ 已正确实现  
**感谢**: @用户指出之前的错误理解








