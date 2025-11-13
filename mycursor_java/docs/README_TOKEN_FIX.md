# AccessToken 修复 - 快速参考

## 🎯 核心问题

**之前的理解是错误的！** 不能简单地从 `WorkosCursorSessionToken` 中提取 JWT 作为 accessToken。

## ✅ 正确方式

### Python 参考实现（cursor-free-vip-main）

```python
def get_token_from_cookie(cookie_value):
    # 1. 优先：调用 refresh API
    refreshed_token = refresh_token(cookie_value)
    if refreshed_token:
        return refreshed_token
    
    # 2. Fallback：提取 JWT
    return cookie_value.split('::')[-1]

def refresh_token(token):
    url = f"https://token.cursorpro.com.cn/reftoken?token={token}"
    response = requests.get(url)
    data = response.json()
    return data['data']['accessToken']  # 真正的 accessToken
```

### Java 实现（当前项目）

```java
@Service
public class TokenRefreshService {
    
    // 优先使用 refresh API，失败时 fallback
    public Map<String, String> getAccessToken(String sessionToken) {
        // 1. 调用 refresh API
        Map<String, Object> result = refreshAccessToken(sessionToken);
        if (success) {
            return extractFromResult(result);
        }
        
        // 2. Fallback
        String jwt = extractJwtFromSessionToken(sessionToken);
        return buildTokens(jwt);
    }
}
```

## 🔄 API 详情

### Refresh API

**请求：**
```
GET https://token.cursorpro.com.cn/reftoken?token=user_01XXX%3A%3AeyJXXX...
```

**响应：**
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "days_left": 14,
    "expire_time": "2024-11-17"
  }
}
```

## 📋 使用方式

### 导入账号

```json
[
  {
    "email": "test@example.com",
    "WorkosCursorSessionToken": "user_01JBXM7WCPF9Y6VGW12345678::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
]
```

### 查看日志

**成功（使用 refresh API）：**
```
🔄 调用 Token Refresh API: https://token.cursorpro.com.cn...
✅ Token 刷新成功! accessToken 长度: 523, 剩余天数: 14
```

**Fallback（API 失败）：**
```
⚠️ Refresh API 失败，尝试直接提取 JWT 作为 fallback...
✅ 通过直接提取获取 JWT (fallback 方式)
```

## 🔧 配置

```yaml
# src/main/resources/application.yml
cursor:
  token:
    refresh-server: https://token.cursorpro.com.cn
```

## 📂 修改文件

### 新增
- `src/main/java/com/mycursor/service/TokenRefreshService.java`

### 修改
- `src/main/java/com/mycursor/service/AccountService.java`
- `src/main/resources/application.yml`

## 🧪 快速测试

```bash
# 1. 启动服务
cd mycursor_java && mvn spring-boot:run

# 2. 导入账号（使用真实的 SessionToken）
curl -X POST http://localhost:8088/api/importAccountsFromJson \
  -H "Content-Type: application/json" \
  -d '[{"email":"test@example.com","WorkosCursorSessionToken":"你的真实token"}]'

# 3. 查看日志
tail -f logs/mycursor.log
```

## ⚠️ 重要提示

1. **SessionToken 必须完整**：包含 `user_01XXX::` 部分
2. **网络要求**：能访问 `https://token.cursorpro.com.cn`
3. **自动 Fallback**：API 失败时自动降级
4. **Token 长度**：refresh API 获取的通常 > 400 字符

## 📚 详细文档

- [ACCESS_TOKEN_CORRECT_FIX.md](docs/ACCESS_TOKEN_CORRECT_FIX.md) - 完整修复说明
- [TEST_IMPORT_GUIDE.md](mycursor_java/docs/TEST_IMPORT_GUIDE.mdEST_IMPORT_GUIDE.md) - 测试指南
- [CHANGELOG.md](mycursor_java/docs/CHANGELOG.md) - 更新日志

## 🙏 致谢

感谢用户指出之前的错误理解！

参考项目：[cursor-free-vip-main](https://github.com/yeongpin/cursor-free-vip)

---

**修复日期**: 2024-11-03  
**状态**: ✅ 已完成








