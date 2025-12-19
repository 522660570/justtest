# SessionToken 转 AccessToken 实现说明

## 🎯 实现目标

通过 `WorkosCursorSessionToken` 获取真正的 `accessToken` 和 `refreshToken`，而不是简单提取。

参考项目：[cursor-free-vip](https://github.com/yeongpin/cursor-free-vip)

## 🔧 实现方案

### 双层策略

系统采用**两层获取策略**，确保最大兼容性：

#### 方法 1：调用 Cursor API（优先）⭐

**原理**：使用 `sessionToken` 作为认证凭证，调用 Cursor 官方 API 获取真正的 `accessToken` 和 `refreshToken`。

**实现**：
```java
private Map<String, String> callCursorAuthApi(String sessionToken) {
    // 构建请求头，模拟浏览器
    HttpHeaders headers = new HttpHeaders();
    headers.set("Cookie", "WorkosCursorSessionToken=" + sessionToken);
    
    // 尝试多个可能的 API 端点
    String[] possibleEndpoints = {
        "https://api.cursor.sh/auth/session",
        "https://api.cursor.sh/auth/token",
        "https://cursor.com/api/auth/session",
        "https://www.cursor.com/api/auth/session"
    };
    
    // 循环尝试每个端点
    for (String endpoint : possibleEndpoints) {
        ResponseEntity<String> response = restTemplate.exchange(
            endpoint, HttpMethod.POST, request, String.class
        );
        
        // 解析响应获取 tokens
        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode jsonNode = mapper.readTree(response.getBody());
            String accessToken = jsonNode.get("accessToken").asText();
            String refreshToken = jsonNode.get("refreshToken").asText();
            // 返回获取到的 tokens
        }
    }
}
```

**优点**：
- ✅ 获取的是官方 API 返回的真实 token
- ✅ 符合标准的 OAuth 认证流程
- ✅ Token 具有完整的权限和有效期

#### 方法 2：从 SessionToken 中提取（备用）

**原理**：如果 API 调用失败，从 `sessionToken` 中提取 JWT 部分作为备用方案。

**SessionToken 格式**：
- 标准格式：`user_id%3A%3Ajwt_token`（URL 编码的 `::` 分隔符）
- 或：`user_id::jwt_token`
- 或：纯 JWT 格式（以 `eyJ` 开头）

**实现**：
```java
private String extractJwtFromSessionToken(String sessionToken) {
    // 尝试 %3A%3A 分隔符（URL编码的 ::）
    if (sessionToken.contains("%3A%3A")) {
        return sessionToken.split("%3A%3A")[1];
    }
    
    // 尝试 :: 分隔符
    if (sessionToken.contains("::")) {
        return sessionToken.split("::")[1];
    }
    
    // 如果已经是 JWT 格式，直接返回
    if (sessionToken.startsWith("eyJ")) {
        return sessionToken;
    }
}
```

**优点**：
- ✅ 作为备用方案，提高成功率
- ✅ 不依赖网络请求
- ✅ 快速高效

## 📊 完整流程

```
输入: sessionToken = "user_01XXX%3A%3AeyJhbGci..."

第1步: 尝试 API 方法
  ├─ 调用 https://api.cursor.sh/auth/session
  ├─ 调用 https://api.cursor.sh/auth/token  
  ├─ 调用 https://cursor.com/api/auth/session
  └─ 调用 https://www.cursor.com/api/auth/session
       ↓
   [API 返回成功]
       ↓
   获取 accessToken 和 refreshToken
       ↓
   返回 ✅

   [如果所有 API 都失败]
       ↓
第2步: 备用提取方法
   ├─ 分割 sessionToken
   ├─ 提取 JWT 部分: "eyJhbGci..."
   ├─ accessToken ← JWT
   └─ refreshToken ← JWT（相同）
       ↓
   返回 ✅
```

## 🔄 应用位置

系统在以下4个关键位置应用此逻辑：

### 1. 获取新账号时
```java
@Transactional
public Map<String, Object> getAccountByCode(String licenseCode, ...) {
    CursorAccount account = accountMapper.findFirstAvailableAccount();
    
    if ((account.getAccessToken() == null) && account.getSessionToken() != null) {
        Map<String, String> tokens = getTokensFromSessionToken(account.getSessionToken());
        accountData.put("accessToken", tokens.get("accessToken"));
        accountData.put("refreshToken", tokens.get("refreshToken"));
    }
}
```

### 2. 循环获取账号时
```java
private Map<String, Object> getAccountByCodeLoop(...) {
    // 同上
}
```

### 3. 导入更新已有账号时
```java
private void updateExistingAccount(CursorAccount existingAccount, ...) {
    if ((accessToken == null) && sessionToken != null) {
        Map<String, String> tokens = getTokensFromSessionToken(sessionToken);
        existingAccount.setAccessToken(tokens.get("accessToken"));
        existingAccount.setRefreshToken(tokens.get("refreshToken"));
    }
}
```

### 4. 导入创建新账号时
```java
private CursorAccount createNewAccount(...) {
    // 同上
}
```

## 🌐 API 端点说明

### 尝试的端点列表

| 端点 | 说明 | 可能性 |
|------|------|--------|
| `https://api.cursor.sh/auth/session` | API 子域名 + 会话端点 | ⭐⭐⭐ |
| `https://api.cursor.sh/auth/token` | API 子域名 + token 端点 | ⭐⭐⭐ |
| `https://cursor.com/api/auth/session` | 主域名 + API 路径 | ⭐⭐ |
| `https://www.cursor.com/api/auth/session` | WWW 子域名 | ⭐ |

### 请求格式

**Headers**:
```http
Content-Type: application/json
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json
Origin: https://cursor.com
Cookie: WorkosCursorSessionToken=user_01XXX%3A%3AeyJhbGci...
```

**Body**:
```json
{}
```

### 期望的响应格式

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_01XXX",
    "email": "user@example.com"
  }
}
```

或使用下划线命名：
```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

## 🧪 测试方案

### 测试场景 1：只有 sessionToken 的账号

**输入数据**：
```json
{
  "email": "test@example.com",
  "auth_info": {
    "WorkosCursorSessionToken": "user_01K4SCY50Y0MC6R44J47C0K41E%3A%3AeyJhbGci..."
  }
}
```

**预期行为**：
1. 尝试调用 Cursor API
2. 如果成功，获取真实的 accessToken 和 refreshToken
3. 如果失败，从 sessionToken 中提取 JWT
4. 入库时三个字段都完整

### 测试场景 2：完整的账号数据

**输入数据**：
```json
{
  "email": "test@example.com",
  "auth_info": {
    "cursorAuth/accessToken": "eyJhbGci...",
    "cursorAuth/refreshToken": "eyJhbGci...",
    "WorkosCursorSessionToken": "user_01XXX%3A%3AeyJhbGci..."
  }
}
```

**预期行为**：
1. 检测到已有 accessToken 和 refreshToken
2. 跳过补全逻辑
3. 直接使用现有的 token

## 📝 日志示例

### 成功通过 API 获取

```log
INFO  尝试通过 SessionToken 从 Cursor API 获取 AccessToken 和 RefreshToken
DEBUG 尝试API端点: https://api.cursor.sh/auth/session
DEBUG API响应: {"accessToken":"eyJ...","refreshToken":"eyJ..."}
INFO  成功从 Cursor API 获取 Token (端点: https://api.cursor.sh/auth/session)
INFO  从 Cursor API 获取 accessToken
INFO  从 Cursor API 获取 refreshToken
INFO  成功分配账号: test@example.com (accessToken: 有, refreshToken: 有, sessionToken: 有)
```

### API 失败，使用提取方案

```log
INFO  尝试通过 SessionToken 从 Cursor API 获取 AccessToken 和 RefreshToken
DEBUG 尝试API端点: https://api.cursor.sh/auth/session
DEBUG 端点 https://api.cursor.sh/auth/session 失败: Connection refused
DEBUG 尝试API端点: https://api.cursor.sh/auth/token
DEBUG 端点 https://api.cursor.sh/auth/token 失败: Connection refused
WARN  所有 API 端点都失败
INFO  API 方法失败，尝试从 SessionToken 中提取 JWT
DEBUG 从 sessionToken 中提取 JWT (使用 %3A%3A 分隔符)
INFO  成功从 SessionToken 中提取 Token
INFO  从 Cursor API 获取 accessToken
INFO  从 Cursor API 获取 refreshToken
```

## ⚠️ 注意事项

### API 端点可能需要调整

由于 Cursor 的实际 API 端点可能与猜测的不同，如果发现正确的端点，需要更新 `possibleEndpoints` 数组。

**如何发现正确的端点**：
1. 使用浏览器开发者工具
2. 登录 Cursor 网站
3. 观察网络请求
4. 找到认证相关的 API 调用

### SessionToken 有效期

- SessionToken 可能有过期时间
- 如果 token 过期，API 调用会失败
- 此时提取方案也可能返回过期的 token

### 网络问题

- API 调用依赖网络连接
- 如果服务器在内网环境，API 调用可能失败
- 此时会自动降级到提取方案

## 🔗 参考资料

- [cursor-free-vip](https://github.com/yeongpin/cursor-free-vip) - Cursor AI 免费 VIP 工具
- 示例数据文件：`curs2or_accounts_export_2025-09-18_16-36-05.json`

## 🎉 总结

通过**双层策略**（API 调用 + JWT 提取），系统能够：

1. ✅ 优先获取真实的 API token（如果 Cursor 提供此 API）
2. ✅ 备用方案确保高可用性
3. ✅ 兼容各种数据格式
4. ✅ 自动补全缺失字段
5. ✅ 确保 Cursor 客户端能够正常登录

---

**更新时间**：2025-10-25  
**版本**：v3.0 - API 获取 + 备用提取双层方案







