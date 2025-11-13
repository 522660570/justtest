# 批量刷新可用账号 AccessToken API

## 📖 功能说明

该接口用于批量刷新所有可用账号（`is_available=1`）的 AccessToken。通过调用 `https://token.cursorpro.com.cn/reftoken` 接口，从 SessionToken 获取最新的 AccessToken 并更新到数据库。

## 🔧 API 端点

### 1. 批量刷新可用账号的 AccessToken

**请求方式**: `POST`

**请求路径**: `/refreshAvailableAccountsAccessToken`

**完整URL**: `http://localhost:8088/refreshAvailableAccountsAccessToken`

**请求参数**: 无

**请求示例**:

```bash
# 使用 curl
curl -X POST http://localhost:8088/refreshAvailableAccountsAccessToken

# 使用 Postman
POST http://localhost:8088/refreshAvailableAccountsAccessToken
Content-Type: application/json
```

**响应示例**:

```json
{
  "code": 1,
  "message": "刷新完成！总数: 10, 成功: 8, 失败: 2",
  "data": {
    "totalCount": 10,
    "successCount": 8,
    "failedCount": 2,
    "skippedCount": 0,
    "refreshTime": "2025-11-06 18:00:00",
    "successAccounts": [
      {
        "email": "user1@example.com",
        "accessTokenLength": 1234,
        "daysLeft": "30",
        "expireTime": "2025-12-06"
      },
      {
        "email": "user2@example.com",
        "accessTokenLength": 1235,
        "daysLeft": "25",
        "expireTime": "2025-12-01"
      }
    ],
    "failedAccounts": [
      {
        "email": "user3@example.com",
        "error": "您今日的刷新次数已达上限，请明天再试"
      },
      {
        "email": "user4@example.com",
        "error": "SessionToken 无效"
      }
    ]
  }
}
```

## 🔍 功能特点

### 1. 筛选条件
- 只处理 `is_available = 1` 的账号
- 必须有 `session_token` 且不为空
- 自动跳过不符合条件的账号

### 2. 刷新策略
- **优先使用 reftoken API**: 调用 `https://token.cursorpro.com.cn/reftoken` 接口获取完整的 AccessToken 信息
- **Fallback 机制**: 如果 API 失败，尝试直接从 SessionToken 中提取 JWT
- **自动更新数据库**: 成功获取 AccessToken 后自动更新到数据库

### 3. 限流保护
- 每次刷新间隔 500ms，避免频繁请求
- 适合大批量账号的刷新操作

### 4. 详细日志
- 记录每个账号的刷新进度
- 记录成功和失败的详细信息
- 便于排查问题

## 📊 返回数据说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `totalCount` | Integer | 总共处理的账号数量 |
| `successCount` | Integer | 成功刷新的账号数量 |
| `failedCount` | Integer | 刷新失败的账号数量 |
| `skippedCount` | Integer | 跳过的账号数量（SessionToken为空等） |
| `refreshTime` | String | 刷新时间（格式：yyyy-MM-dd HH:mm:ss） |
| `successAccounts` | Array | 成功刷新的账号列表 |
| `failedAccounts` | Array | 刷新失败的账号列表 |

### successAccounts 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `email` | String | 账号邮箱 |
| `accessTokenLength` | Integer | AccessToken 长度 |
| `daysLeft` | String | 剩余天数（从 reftoken API 返回） |
| `expireTime` | String | 过期时间（从 reftoken API 返回） |

### failedAccounts 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `email` | String | 账号邮箱 |
| `error` | String | 失败原因 |

## ⚠️ 常见错误

### 1. IP 限制错误
```json
{
  "email": "user@example.com",
  "error": "您今日的刷新次数已达上限，请明天再试"
}
```
**解决方案**: 
- 后端服务器 IP 被限制，等待第二天再试
- 或者考虑更换服务器 IP

### 2. SessionToken 无效
```json
{
  "email": "user@example.com",
  "error": "SessionToken 无效"
}
```
**解决方案**: 
- SessionToken 已过期，需要重新获取
- 账号可能已被封禁

### 3. 无法提取 JWT
```json
{
  "email": "user@example.com",
  "error": "无法从 SessionToken 中提取有效的 JWT"
}
```
**解决方案**: 
- SessionToken 格式不正确
- SessionToken 可能已损坏

## 🚀 使用场景

### 场景 1: 定时刷新任务
可以配置定时任务（如 cron），每天定时刷新所有可用账号的 AccessToken：

```bash
# Linux crontab 示例（每天凌晨 2 点执行）
0 2 * * * curl -X POST http://localhost:8088/refreshAvailableAccountsAccessToken
```

### 场景 2: 导入新账号后批量刷新
导入新账号后，如果只有 SessionToken 没有 AccessToken，可以调用此接口批量刷新：

```bash
# 1. 先导入账号
curl -X POST http://localhost:8088/importAccountsFromJsonString \
  -H "Content-Type: application/json" \
  -d '{"jsonData": "[...]"}'

# 2. 批量刷新 AccessToken
curl -X POST http://localhost:8088/refreshAvailableAccountsAccessToken
```

### 场景 3: 手动维护
当发现某些账号的 AccessToken 失效时，可以手动调用此接口进行批量更新。

## 💡 注意事项

1. **执行时间**: 刷新过程可能需要较长时间（取决于账号数量），建议在低峰期执行
2. **IP 限制**: reftoken 接口有每日调用次数限制，请合理安排刷新频率
3. **数据库事务**: 整个刷新过程在事务中执行，出现异常会自动回滚
4. **并发控制**: 建议避免并发调用此接口，以免造成数据不一致

## 📝 日志示例

```log
2025-11-06 18:00:00 [INFO] 🔄 开始批量刷新所有可用账号的 AccessToken...
2025-11-06 18:00:00 [INFO] 📊 找到 10 个可用账号（is_available=1 且有 sessionToken），开始逐个刷新...
2025-11-06 18:00:01 [INFO] 📍 [1/10] 正在刷新账号: user1@example.com
2025-11-06 18:00:02 [INFO] ✅ [1/10] 账号 user1@example.com AccessToken 刷新成功 (长度: 1234, 剩余天数: 30, 过期时间: 2025-12-06)
2025-11-06 18:00:02 [INFO] 📍 [2/10] 正在刷新账号: user2@example.com
2025-11-06 18:00:03 [INFO] ✅ [2/10] 账号 user2@example.com AccessToken 刷新成功 (长度: 1235, 剩余天数: 25, 过期时间: 2025-12-01)
...
2025-11-06 18:00:15 [INFO] ✅ 批量刷新 AccessToken 完成！
2025-11-06 18:00:15 [INFO] 📊 总数: 10, 成功: 8, 失败: 2, 跳过: 0
```

## 🔗 相关接口

- `/importAccountsFromJsonString` - 导入账号（JSON 字符串）
- `/importAccountsFromJson` - 导入账号（JSON 对象）
- `/getAccountsByLicense/{licenseCode}` - 查询授权码占用的账号
- `/updateAllMembershipStatus` - 更新所有账号的订阅状态

