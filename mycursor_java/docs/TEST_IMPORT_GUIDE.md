# 账号导入测试指南

## ✅ 已修复：正确的 AccessToken 获取方式

现在系统会通过 **refresh API** 从 `WorkosCursorSessionToken` 获取真正的 `accessToken`，而不是简单地提取 JWT 部分。

## 🧪 快速测试

### 1. 获取真实的 WorkosCursorSessionToken

#### 方法A：从浏览器获取

1. 访问 https://cursor.com 并登录
2. 打开浏览器开发者工具（F12）
3. 切换到 "Application" 或 "存储" 标签
4. 找到 Cookies → https://cursor.com
5. 复制 `WorkosCursorSessionToken` 的值

**格式示例：**
```
user_01JBXM7WCPF9Y6VGW12345678::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

或 URL 编码格式：
```
user_01JBXM7WCPF9Y6VGW12345678%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 方法B：从 Cursor 应用数据库获取

**Windows:**
```powershell
# 打开 SQLite 数据库
$dbPath = "$env:APPDATA\Cursor\User\globalStorage\state.vscdb"
# 使用 SQLite 工具查询
SELECT value FROM ItemTable WHERE key = 'WorkosCursorSessionToken';
```

**macOS/Linux:**
```bash
# macOS
sqlite3 ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb \
  "SELECT value FROM ItemTable WHERE key = 'WorkosCursorSessionToken';"

# Linux
sqlite3 ~/.config/Cursor/User/globalStorage/state.vscdb \
  "SELECT value FROM ItemTable WHERE key = 'WorkosCursorSessionToken';"
```

### 2. 创建测试 JSON 文件

将获取到的 SessionToken 保存到 `test_import_real.json`：

```json
[
  {
    "email": "your_real_email@example.com",
    "WorkosCursorSessionToken": "粘贴你获取到的完整 SessionToken",
    "registration_time": "2024-11-03 10:00:00"
  }
]
```

### 3. 启动后端服务

```bash
cd mycursor_java
mvn spring-boot:run
```

### 4. 导入测试账号

```bash
curl -X POST http://localhost:8088/api/importAccountsFromJson \
  -H "Content-Type: application/json" \
  -d @test_import_real.json
```

### 5. 查看日志输出

**成功的日志示例（使用 refresh API）：**

```
🔑 开始从 SessionToken 获取 accessToken...
SessionToken 前50字符: user_01JBXM7WCPF9Y6VGW12345678::eyJhbGciOiJI...
🔄 调用 Token Refresh API: https://token.cursorpro.com.cn...
API 响应状态码: 200
API 响应: code=0, msg=获取成功
✅ Token 刷新成功! accessToken 长度: 523, 剩余天数: 14, 过期时间: 2024-11-17
✅ 通过 Refresh API 成功获取 accessToken
✅ 成功获取 accessToken (长度: 523)
✅ 成功为账号 your_real_email@example.com 提取 accessToken (长度: 523)
创建新账号: your_real_email@example.com
```

**Fallback 的日志示例（API 失败时）：**

```
🔑 开始从 SessionToken 获取 accessToken...
🔄 调用 Token Refresh API: https://token.cursorpro.com.cn...
⚠️ Refresh API 失败，尝试直接提取 JWT 作为 fallback...
使用 :: 分隔符提取 JWT
✅ 成功提取 JWT (长度: 245)
✅ 通过直接提取获取 JWT (fallback 方式)
✅ 成功获取 accessToken (长度: 245)
```

### 6. 验证导入结果

#### 检查API响应

```json
{
  "code": 0,
  "message": "导入成功",
  "data": {
    "totalCount": 1,
    "successCount": 1,
    "insertCount": 1,
    "updateCount": 0,
    "skipCount": 0,
    "errorCount": 0,
    "errors": []
  }
}
```

#### 查询数据库

```sql
SELECT 
    email,
    LEFT(access_token, 50) as token_start,
    LENGTH(access_token) as token_length,
    LEFT(session_token, 50) as session_start
FROM cursor_account 
WHERE email = 'your_real_email@example.com';
```

**预期结果：**
- `token_length` 应该大于 200（如果通过 refresh API，通常是 500+）
- `access_token` 应该不为 NULL
- `session_token` 也应该被保存

## 🔍 测试要点

### 1. Refresh API 成功的标志

- ✅ 日志显示 "Token 刷新成功"
- ✅ 显示剩余天数和过期时间
- ✅ accessToken 长度通常 > 400

### 2. Fallback 模式的标志

- ⚠️ 日志显示 "Refresh API 失败，尝试直接提取 JWT"
- ⚠️ 没有显示剩余天数和过期时间
- ⚠️ accessToken 长度通常 200-300

### 3. 完全失败的标志

- ❌ 日志显示 "无法从 SessionToken 获取 accessToken"
- ❌ 导入结果中有错误信息
- ❌ 数据库中 access_token 为 NULL

## ⚙️ 配置说明

### Refresh API 服务器

在 `src/main/resources/application.yml` 中配置：

```yaml
cursor:
  token:
    refresh-server: https://token.cursorpro.com.cn
```

如果官方服务器不可用，可以修改为其他可用的服务器地址。

### 日志级别

建议测试时启用 DEBUG 日志：

```yaml
logging:
  level:
    com.mycursor.service.TokenRefreshService: DEBUG
    com.mycursor.service.AccountService: DEBUG
```

## 🐛 故障排查

### 问题1：导入成功但 accessToken 为空

**可能原因：**
- SessionToken 格式不正确
- SessionToken 已过期
- Refresh API 和 Fallback 都失败了

**解决方法：**
1. 检查日志中的详细错误信息
2. 确认 SessionToken 是完整的（包含 user_id 部分）
3. 验证 SessionToken 是否有效（在浏览器中测试）

### 问题2：Refresh API 一直失败

**可能原因：**
- 网络无法访问 `https://token.cursorpro.com.cn`
- 防火墙阻止了请求
- API 服务器暂时不可用

**解决方法：**
1. 测试网络连接：
   ```bash
   curl https://token.cursorpro.com.cn/reftoken?token=test
   ```
2. 检查防火墙和代理设置
3. 如果 API 持续不可用，系统会自动使用 fallback 模式

### 问题3：导入的 token 在 Cursor 中不工作

**可能原因：**
- Token 已过期
- Token 格式不正确
- 使用了 fallback 方式提取的 JWT，但该 JWT 不是真正的 accessToken

**解决方法：**
1. 检查日志确认是否成功使用了 refresh API
2. 如果只能使用 fallback，可能需要使用已经包含 accessToken 的数据
3. 重新从浏览器获取最新的 SessionToken

## 📊 对比测试

### 测试A：使用 Refresh API（推荐）

```bash
# 使用真实的 SessionToken
curl -X POST http://localhost:8088/api/importAccountsFromJson \
  -H "Content-Type: application/json" \
  -d '[{"email":"test@example.com","WorkosCursorSessionToken":"user_01XXX::eyJXXX..."}]'
```

**预期结果：**
- 日志显示成功调用 refresh API
- accessToken 长度 > 400
- 包含有效期信息

### 测试B：Fallback 模式（模拟 API 失败）

```bash
# 临时断网或修改配置中的 refresh-server 为无效地址
# 然后导入账号
```

**预期结果：**
- 日志显示 refresh API 失败
- 自动切换到 fallback 模式
- accessToken 长度约 200-300

## ✅ 验证清单

完成测试后，确认以下内容：

- [ ] 成功导入至少一个真实账号
- [ ] 日志显示成功调用 refresh API（或合理的 fallback）
- [ ] 数据库中 `access_token` 不为 NULL
- [ ] 数据库中 `session_token` 已保存
- [ ] accessToken 长度符合预期
- [ ] 如果使用了 refresh API，日志中包含有效期信息
- [ ] 导入的账号可以在系统中使用（测试换号功能）

## 📚 相关文档

- [ACCESS_TOKEN_CORRECT_FIX.md](docs/ACCESS_TOKEN_CORRECT_FIX.md) - 详细的修复说明
- [cursor-free-vip-main](https://github.com/yeongpin/cursor-free-vip) - 参考项目

## 💡 提示

1. **保护敏感信息**：SessionToken 和 accessToken 都是敏感信息，不要在公开场合分享
2. **Token 有效期**：通过 refresh API 获取的 token 有有效期，过期后需要重新获取
3. **定期测试**：建议定期测试导入功能，确保 refresh API 仍然可用
4. **备份数据**：测试前建议备份数据库

---

**最后更新**: 2024-11-03  
**版本**: 2.0（正确实现）








