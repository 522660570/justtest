# 快速开始：导入账号并自动检查订阅状况

## 🚀 5 分钟快速上手

### 步骤 1️⃣：准备数据

创建一个 JSON 文件或准备 JSON 数据，例如：

```json
[
  {
    "email": "your-email@example.com",
    "WorkosCursorSessionToken": "your-session-token-here",
    "registration_time": "2024-11-01 10:00:00"
  }
]
```

**如何获取 SessionToken？**
1. 在浏览器中登录 https://cursor.com
2. 按 F12 → Application → Cookies → cursor.com
3. 复制 `WorkosCursorSessionToken` 的值

### 步骤 2️⃣：调用 API

#### 使用 Postman
1. 新建 POST 请求
2. URL: `http://localhost:8080/api/importAccountsFromJson`
3. Headers: `Content-Type: application/json`
4. Body: 粘贴上面的 JSON 数据
5. 点击 Send

#### 使用 PowerShell（Windows）
```powershell
$body = @'
[
  {
    "email": "your-email@example.com",
    "WorkosCursorSessionToken": "your-session-token-here"
  }
]
'@

Invoke-RestMethod -Uri "http://localhost:8080/api/importAccountsFromJson" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

#### 使用 curl（Linux/Mac）
```bash
curl -X POST http://localhost:8080/api/importAccountsFromJson \
  -H "Content-Type: application/json" \
  -d '[{"email":"your-email@example.com","WorkosCursorSessionToken":"your-token"}]'
```

### 步骤 3️⃣：查看结果

成功响应示例：
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "totalCount": 1,
    "successCount": 1,
    "insertCount": 1,
    "subscriptionCheckCount": 1,        // ← 订阅查询成功！
    "subscriptionResults": [
      {
        "email": "your-email@example.com",
        "membershipType": "free_trial",  // ← 会员类型
        "trialLengthDays": 14,           // ← 试用总天数
        "daysRemainingOnTrial": 13       // ← 剩余天数
      }
    ]
  }
}
```

**关键信息解读：**
- ✅ `subscriptionCheckCount: 1` → 订阅查询成功
- ✅ `membershipType: "free_trial"` → 这是一个免费试用账号
- ✅ `daysRemainingOnTrial: 13` → 还有 13 天试用期

## 📊 订阅类型说明

| 类型 | 说明 | 推荐用途 |
|------|------|---------|
| `free_trial` | 免费试用 | ✅ 适合一键换号 |
| `pro` | 专业版 | ✅ 优质账号，保留 |
| `free` | 免费版 | ⚠️ 功能受限 |
| `team` | 团队版 | ✅ 适合团队使用 |
| `student` | 学生版 | ✅ 学生优惠账号 |

## 🎯 常见场景

### 场景 1：导入单个账号
```json
[
  {
    "email": "test@example.com",
    "WorkosCursorSessionToken": "token-here"
  }
]
```

### 场景 2：批量导入多个账号
```json
[
  {
    "email": "user1@example.com",
    "WorkosCursorSessionToken": "token-1"
  },
  {
    "email": "user2@example.com",
    "WorkosCursorSessionToken": "token-2"
  },
  {
    "email": "user3@example.com",
    "WorkosCursorSessionToken": "token-3"
  }
]
```

### 场景 3：导入账号但不查询订阅（无 Token）
```json
[
  {
    "email": "test@example.com",
    "registration_time": "2024-11-01 10:00:00"
  }
]
```
**结果：** 账号导入成功，`subscriptionCheckCount: 0`（跳过订阅查询）

## ⚡ 性能参考

| 账号数量 | 预计耗时 |
|---------|---------|
| 1-5 个 | < 10 秒 |
| 5-20 个 | 20-40 秒 |
| 20-50 个 | 1-2 分钟 |
| 50+ 个 | 建议分批 |

## ❓ 常见问题

### Q: 订阅查询失败了怎么办？
**A:** 不用担心！账号仍会成功导入，只是订阅信息为空。响应示例：
```json
{
  "subscriptionCheckFailedCount": 1,
  "subscriptionResults": [
    {
      "email": "test@example.com",
      "error": "Cursor API 返回错误状态码: 401"
    }
  ]
}
```

### Q: 为什么我的 Token 失败了？
**A:** 可能原因：
1. Token 已过期 → 重新从浏览器获取
2. Token 格式错误 → 确保完整复制
3. 账号已注销 → 使用其他账号

### Q: 可以只导入不查询订阅吗？
**A:** 可以！不提供 `WorkosCursorSessionToken` 字段即可：
```json
[{"email": "test@example.com"}]
```

## 🔧 故障排查

### 问题：接口返回 500 错误
**解决：**
1. 检查后端服务是否启动
2. 查看后端日志：`mycursor_java/logs/mycursor.log`
3. 确认数据库连接正常

### 问题：订阅查询全部失败
**解决：**
1. 验证 SessionToken 是否有效
2. 检查网络连接（需要访问 cursor.com）
3. 查看错误日志确认具体原因

### 问题：导入成功但没有订阅信息
**原因：**
- 没有提供 SessionToken → 正常情况，自动跳过
- SessionToken 无效 → 查看 `subscriptionCheckFailedCount`

## 📖 完整文档

想了解更多？查看详细文档：
- [功能详细说明](mycursor_java/docs/IMPORT_WITH_SUBSCRIPTION_CHECK.md)
- [API 测试指南](mycursor_java/docs/API_TEST_SUBSCRIPTION_IMPORT.md)
- [功能更新说明](mycursor_java/docs/FEATURE_UPDATE_SUBSCRIPTION_CHECK.md)

## 💡 小贴士

1. **批量导入建议：** 每批 20-50 个账号，避免超时
2. **Token 管理：** 定期更新 SessionToken 保持有效性
3. **结果验证：** 导入后通过 `GET /api/listAllAccounts` 验证
4. **日志查看：** 遇到问题先查看日志文件

---

**准备好了吗？** 现在就开始导入你的第一个账号吧！ 🎉

