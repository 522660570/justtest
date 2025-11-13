# 导入账号时自动检查订阅状况功能

## 功能概述

在使用 `/importAccountsFromJson` 接口导入账号时，系统会自动检查每个账号的订阅状况，并更新以下信息：
- 会员类型（membershipType）
- 试用总天数（trialLengthDays）
- 剩余试用天数（daysRemainingOnTrial）
- 订阅检查时间（membershipCheckTime）

## 使用方法

### 1. 通过 JSON 文本导入账号

**接口：** `POST /api/importAccountsFromJson`

**请求体示例：**
```json
[
  {
    "email": "user1@example.com",
    "WorkosCursorSessionToken": "your-session-token-here",
    "registration_time": "2024-11-01 10:00:00"
  },
  {
    "email": "user2@example.com",
    "WorkosCursorSessionToken": "another-session-token",
    "registration_time": "2024-11-02 15:30:00"
  }
]
```

**响应示例：**
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "totalCount": 2,
    "successCount": 2,
    "insertCount": 2,
    "updateCount": 0,
    "skipCount": 0,
    "errorCount": 0,
    "errors": [],
    "subscriptionCheckCount": 2,
    "subscriptionCheckFailedCount": 0,
    "subscriptionResults": [
      {
        "email": "user1@example.com",
        "membershipType": "free_trial",
        "trialLengthDays": 14,
        "daysRemainingOnTrial": 13
      },
      {
        "email": "user2@example.com",
        "membershipType": "pro",
        "trialLengthDays": null,
        "daysRemainingOnTrial": null
      }
    ]
  }
}
```

### 2. 通过 JSON 字符串导入账号

**接口：** `POST /api/importAccountsFromJsonString`

**请求体示例：**
```json
{
  "jsonData": "[{\"email\":\"user@example.com\",\"WorkosCursorSessionToken\":\"token-here\"}]"
}
```

### 3. 通过文件上传导入账号

**接口：** `POST /api/importAccounts`

**请求类型：** `multipart/form-data`

**参数：**
- `file`: JSON 文件

## 返回字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| totalCount | Integer | 总账号数 |
| successCount | Integer | 成功导入的账号数 |
| insertCount | Integer | 新增的账号数 |
| updateCount | Integer | 更新的账号数 |
| skipCount | Integer | 跳过的账号数 |
| errorCount | Integer | 错误的账号数 |
| errors | List<String> | 错误信息列表 |
| **subscriptionCheckCount** | Integer | 订阅查询成功的数量 |
| **subscriptionCheckFailedCount** | Integer | 订阅查询失败的数量 |
| **subscriptionResults** | List<Object> | 订阅查询结果详情 |

### subscriptionResults 字段说明

每个订阅查询结果包含以下信息：

**成功的查询结果：**
```json
{
  "email": "user@example.com",
  "membershipType": "free_trial",
  "trialLengthDays": 14,
  "daysRemainingOnTrial": 13
}
```

**失败的查询结果：**
```json
{
  "email": "user@example.com",
  "error": "Cursor API 返回错误状态码: 401"
}
```

## 订阅类型说明

系统支持以下订阅类型：

| 类型 | 说明 |
|------|------|
| `free_trial` | 免费试用期账号 |
| `pro` | 专业版账号 |
| `free` | 免费版账号 |
| `team` | 团队版账号 |
| `student` | 学生版账号 |

## 自动检查逻辑

1. **检查条件：** 只对拥有 `SessionToken` 的账号进行订阅查询
2. **查询时机：** 在账号成功插入或更新到数据库后立即进行
3. **错误处理：** 如果订阅查询失败，不影响账号导入，只记录警告日志
4. **结果存储：** 订阅信息会自动更新到数据库的相应字段

## 日志示例

导入过程中会输出详细的日志信息：

```
[INFO] 开始批量导入账号数据，总数: 2
[INFO] 创建新账号: user1@example.com
[INFO] 🔍 正在检查账号 user1@example.com 的订阅状况...
[INFO] ✅ 账号 user1@example.com 订阅状况查询完成 - 类型: free_trial, 试用天数: 14, 剩余天数: 13
[INFO] 更新已有账号: user2@example.com
[INFO] 🔍 正在检查账号 user2@example.com 的订阅状况...
[INFO] ✅ 账号 user2@example.com 订阅状况查询完成 - 类型: pro, 试用天数: null, 剩余天数: null
[INFO] 账号导入完成 - 总数: 2, 成功: 2, 新增: 1, 更新: 1, 跳过: 0, 错误: 0
[INFO] 订阅状况查询 - 成功: 2, 失败: 0
```

## 注意事项

1. **SessionToken 必需：** 订阅查询需要有效的 `SessionToken`，如果账号没有提供该字段，将跳过订阅查询
2. **API 限制：** 订阅查询会调用 Cursor 官方 API，大批量导入时可能受到 API 频率限制
3. **性能考虑：** 订阅查询是同步执行的，导入大量账号时会增加整体导入时间
4. **失败不影响导入：** 即使订阅查询失败，账号仍会成功导入，只是订阅信息为空

## 相关接口

- **批量更新订阅状态：** `POST /api/updateAllMembershipTypes` - 对所有现有账号批量检查订阅状态
- **单个账号查询：** 可以通过账号管理界面查看单个账号的订阅信息
- **使用统计：** `GET /api/getAccountUsageStats` - 查看账号使用统计，包括订阅类型分布

## 版本历史

- **v1.1** (2025-11-04): 添加导入时自动检查订阅状况功能
- **v1.0** (2024-10): 基础导入功能

