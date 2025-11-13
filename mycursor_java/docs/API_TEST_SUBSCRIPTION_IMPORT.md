# 导入账号并自动检查订阅状况 - API 测试指南

## 快速开始

### 测试环境
- **后端服务地址：** `http://localhost:8080`
- **接口路径：** `/api/importAccountsFromJson`
- **请求方法：** `POST`
- **Content-Type：** `application/json`

## 测试步骤

### 1. 使用 Postman 测试

#### 步骤 1：创建新请求
1. 打开 Postman
2. 新建请求，选择 `POST` 方法
3. 输入 URL：`http://localhost:8080/api/importAccountsFromJson`

#### 步骤 2：设置请求头
在 Headers 标签中添加：
```
Content-Type: application/json
```

#### 步骤 3：设置请求体
在 Body 标签中选择 `raw` 和 `JSON`，输入以下内容：

```json
[
  {
    "email": "test1@example.com",
    "WorkosCursorSessionToken": "your-real-session-token-1",
    "registration_time": "2024-11-01 10:00:00"
  },
  {
    "email": "test2@example.com",
    "WorkosCursorSessionToken": "your-real-session-token-2",
    "registration_time": "2024-11-02 15:30:00"
  }
]
```

**注意：** 请将 `your-real-session-token-X` 替换为真实的 SessionToken

#### 步骤 4：发送请求
点击 `Send` 按钮发送请求

### 2. 使用 cURL 测试

#### Windows PowerShell
```powershell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @'
[
  {
    "email": "test1@example.com",
    "WorkosCursorSessionToken": "your-real-session-token-1",
    "registration_time": "2024-11-01 10:00:00"
  }
]
'@

Invoke-RestMethod -Uri "http://localhost:8080/api/importAccountsFromJson" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

#### Linux/Mac (bash)
```bash
curl -X POST http://localhost:8080/api/importAccountsFromJson \
  -H "Content-Type: application/json" \
  -d '[
    {
      "email": "test1@example.com",
      "WorkosCursorSessionToken": "your-real-session-token-1",
      "registration_time": "2024-11-01 10:00:00"
    }
  ]'
```

## 预期响应

### 成功响应示例

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
        "email": "test1@example.com",
        "membershipType": "free_trial",
        "trialLengthDays": 14,
        "daysRemainingOnTrial": 13
      },
      {
        "email": "test2@example.com",
        "membershipType": "pro",
        "trialLengthDays": null,
        "daysRemainingOnTrial": null
      }
    ]
  }
}
```

### 部分失败响应示例

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
    "subscriptionCheckCount": 1,
    "subscriptionCheckFailedCount": 1,
    "subscriptionResults": [
      {
        "email": "test1@example.com",
        "membershipType": "free_trial",
        "trialLengthDays": 14,
        "daysRemainingOnTrial": 13
      },
      {
        "email": "test2@example.com",
        "error": "Cursor API 返回错误状态码: 401"
      }
    ]
  }
}
```

## 测试场景

### 场景 1：导入新账号（带有效 SessionToken）
**预期结果：**
- 账号成功导入
- 订阅信息自动查询并更新
- `subscriptionCheckCount` = 导入账号数

### 场景 2：导入新账号（无 SessionToken）
**测试数据：**
```json
[
  {
    "email": "test@example.com",
    "registration_time": "2024-11-01 10:00:00"
  }
]
```

**预期结果：**
- 账号成功导入
- 跳过订阅查询
- `subscriptionCheckCount` = 0
- 日志中显示 "账号 test@example.com 没有 SessionToken，跳过订阅状况查询"

### 场景 3：导入新账号（SessionToken 无效）
**预期结果：**
- 账号成功导入
- 订阅查询失败
- `subscriptionCheckFailedCount` = 1
- `subscriptionResults` 中包含错误信息

### 场景 4：更新已存在的账号
**测试步骤：**
1. 先导入一次账号
2. 修改同一账号的 SessionToken
3. 再次导入

**预期结果：**
- `updateCount` = 1
- `insertCount` = 0
- 订阅信息重新查询并更新

### 场景 5：批量导入（混合场景）
**测试数据：**
```json
[
  {
    "email": "new1@example.com",
    "WorkosCursorSessionToken": "valid-token-1"
  },
  {
    "email": "new2@example.com",
    "WorkosCursorSessionToken": "invalid-token"
  },
  {
    "email": "new3@example.com"
  },
  {
    "email": ""
  }
]
```

**预期结果：**
- `totalCount` = 4
- `successCount` = 3
- `skipCount` = 1
- `subscriptionCheckCount` >= 1
- `subscriptionCheckFailedCount` >= 1

## 如何获取真实的 SessionToken

### 方法 1：从浏览器获取
1. 打开 Chrome 浏览器
2. 访问 https://cursor.com
3. 登录账号
4. 按 F12 打开开发者工具
5. 切换到 Application 标签
6. 在左侧选择 Cookies > https://cursor.com
7. 找到 `WorkosCursorSessionToken`
8. 复制其值

### 方法 2：使用系统提供的测试账号
如果系统中已有账号数据，可以通过以下接口查询：
```
GET http://localhost:8080/api/listAllAccounts
```

从返回结果中复制现有账号的 SessionToken 用于测试。

## 验证结果

### 1. 查看数据库
导入成功后，可以查看数据库中的 `cursor_accounts` 表：

```sql
SELECT 
    email,
    membership_type,
    trial_length_days,
    days_remaining_on_trial,
    membership_check_time,
    created_time,
    updated_time
FROM cursor_accounts
WHERE email IN ('test1@example.com', 'test2@example.com');
```

### 2. 查看日志
在后端日志中可以看到详细的导入和订阅查询过程：

```
[INFO] 开始批量导入账号数据，总数: 2
[INFO] 创建新账号: test1@example.com
[INFO] 🔍 正在检查账号 test1@example.com 的订阅状况...
[INFO] ✅ 账号 test1@example.com 订阅状况查询完成 - 类型: free_trial, 试用天数: 14, 剩余天数: 13
...
```

### 3. 通过 API 查询
使用账号查询接口验证导入结果：

```
GET http://localhost:8080/api/getAccountInfo?email=test1@example.com
```

## 常见问题

### Q1: 订阅查询失败，但账号导入成功了吗？
A: 是的。订阅查询失败不影响账号导入，账号仍然会成功保存到数据库，只是订阅信息字段为空。

### Q2: 为什么有些账号没有进行订阅查询？
A: 只有提供了有效 SessionToken 的账号才会进行订阅查询。

### Q3: 订阅查询会影响导入速度吗？
A: 会。每个账号的订阅查询需要调用 Cursor API，大批量导入时会增加整体耗时。

### Q4: 可以跳过订阅查询吗？
A: 当前版本订阅查询是自动执行的，无法手动跳过。如果不需要订阅信息，可以不提供 SessionToken。

### Q5: SessionToken 过期怎么办？
A: SessionToken 过期会导致订阅查询失败，但不影响账号导入。建议定期更新 SessionToken。

## 性能测试建议

### 小批量测试（< 10 个账号）
- 预期耗时：每个账号约 1-2 秒
- 适用场景：日常手动导入

### 中批量测试（10-100 个账号）
- 预期耗时：约 1-3 分钟
- 适用场景：周期性批量导入

### 大批量测试（> 100 个账号）
- 预期耗时：可能需要 10 分钟以上
- 建议：分批导入，每批 50 个账号

## 下一步

完成测试后，您可以：
1. 使用 `GET /api/getAccountUsageStats` 查看账号统计信息
2. 使用 `POST /api/updateAllMembershipTypes` 批量更新所有账号的订阅状态
3. 在前端界面查看导入的账号信息

## 相关文档
- [导入功能详细说明](mycursor_java/docs/IMPORT_WITH_SUBSCRIPTION_CHECK.mdBSCRIPTION_CHECK.md)
- [订阅服务API文档](SESSION_TOKEN_TO_ACCESS_TOKEN_IMPLEMENTATION.md)
- [使用指南](docs/USAGE.md)

