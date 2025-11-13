# 更新日志

## [2024-11-03] AccessToken 获取方式修复（重要）

### 🎯 重大修复

修复了 AccessToken 获取方式的**根本性错误**。

#### 问题
之前错误地认为可以直接从 `WorkosCursorSessionToken` 中提取 JWT 作为 accessToken，但这是**不正确的**。

#### 正确方式
参考 `cursor-free-vip-main` 开源项目，正确的方式是：
1. **优先**：调用 refresh API (`https://token.cursorpro.com.cn/reftoken`) 获取真正的 accessToken
2. **Fallback**：如果 API 失败，才提取 JWT 作为备用方案

### 📝 主要改动

#### 新增文件
- `src/main/java/com/mycursor/service/TokenRefreshService.java` - Token 刷新服务
  - `refreshAccessToken()` - 调用 refresh API
  - `extractJwtFromSessionToken()` - Fallback 方法
  - `getAccessToken()` - 综合方法（推荐使用）

#### 修改文件
- `src/main/java/com/mycursor/service/AccountService.java`
  - 方法重命名：`extractTokensFromSessionToken()` → `getTokensFromSessionToken()`
  - 使用 `TokenRefreshService` 替代直接提取逻辑
  - 支持自动 fallback

- `src/main/resources/application.yml`
  - 新增配置：`cursor.token.refresh-server`

#### 新增文档
- `docs/ACCESS_TOKEN_CORRECT_FIX.md` - 详细的修复说明
- `TEST_IMPORT_GUIDE.md` - 测试指南

### ✅ 效果

#### 修复前（错误）
```java
// ❌ 直接提取，认为 JWT 就是 accessToken
String jwt = sessionToken.split("::")[1];
account.setAccessToken(jwt);
```

#### 修复后（正确）
```java
// ✅ 优先使用 refresh API，失败时 fallback
Map<String, String> tokens = tokenRefreshService.getAccessToken(sessionToken);
String accessToken = tokens.get("accessToken");  // 真正的 accessToken
```

### 🔧 配置

```yaml
cursor:
  token:
    refresh-server: https://token.cursorpro.com.cn
```

### 📊 预期变化

- **AccessToken 长度**：从约 200-300 字符 → 约 500+ 字符（使用 refresh API 时）
- **Token 信息**：现在包含有效期（days_left）和过期时间（expire_time）
- **可靠性**：大幅提升，因为获取的是真正的 accessToken

### 🧪 测试

参见 `TEST_IMPORT_GUIDE.md` 获取详细的测试步骤。

### ⚠️ 注意事项

1. 后端需要能访问 `https://token.cursorpro.com.cn`
2. 如果 refresh API 不可用，会自动使用 fallback 模式
3. 建议启用 DEBUG 日志进行首次测试

### 📚 参考

- 参考项目：[cursor-free-vip-main](https://github.com/yeongpin/cursor-free-vip)
- 核心文件：`get_user_token.py`

---

## [历史版本]

### [2024-11-02] 其他功能
- 实现账号导入功能
- 实现换号功能
- 实现授权码管理
- ...








