# 导入账号自动检查订阅功能 - 完整指南

<div align="center">

![Version](https://img.shields.io/badge/version-1.1-blue)
![Status](https://img.shields.io/badge/status-stable-green)
![Java](https://img.shields.io/badge/Java-8+-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.4.1-brightgreen)

**一键导入账号，自动获取订阅信息！**

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [API 文档](#-api-文档) • [完整文档](#-文档导航)

</div>

---

## 📖 简介

在导入 Cursor 账号时，系统会**自动查询每个账号的订阅状况**，包括会员类型、试用天数等关键信息，无需手动操作，一步到位！

### 更新内容

- ✅ 自动订阅状况查询
- ✅ 详细的订阅信息返回
- ✅ 智能错误处理
- ✅ 向后兼容

**更新日期：** 2025-11-04  
**版本：** v1.1

---

## 🚀 快速开始

### 1. 准备 JSON 数据

```json
[
  {
    "email": "your-email@example.com",
    "WorkosCursorSessionToken": "your-session-token-here"
  }
]
```

### 2. 调用 API

```bash
curl -X POST http://localhost:8080/api/importAccountsFromJson \
  -H "Content-Type: application/json" \
  -d '[{"email":"test@example.com","WorkosCursorSessionToken":"your-token"}]'
```

### 3. 获得结果

```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "successCount": 1,
    "subscriptionCheckCount": 1,
    "subscriptionResults": [
      {
        "email": "test@example.com",
        "membershipType": "free_trial",
        "trialLengthDays": 14,
        "daysRemainingOnTrial": 13
      }
    ]
  }
}
```

**🎉 完成！** 账号已导入，订阅信息已自动获取！

---

## ✨ 功能特性

### 1. 自动订阅查询
- 导入账号时自动调用 Cursor API
- 无需额外操作，一步完成
- 支持批量导入

### 2. 完整订阅信息
获取以下信息并保存到数据库：
- **会员类型** (membershipType)
- **试用总天数** (trialLengthDays)  
- **剩余试用天数** (daysRemainingOnTrial)
- **检查时间** (membershipCheckTime)

### 3. 智能处理
- 订阅查询失败不影响账号导入
- 无 SessionToken 自动跳过查询
- 详细的日志记录

### 4. 增强的返回结果
新增字段：
- `subscriptionCheckCount` - 成功数量
- `subscriptionCheckFailedCount` - 失败数量
- `subscriptionResults` - 详细结果

---

## 📡 API 文档

### 接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/importAccountsFromJson` | POST | JSON 数组导入 |
| `/api/importAccountsFromJsonString` | POST | JSON 字符串导入 |
| `/api/importAccounts` | POST | 文件上传导入 |

### 请求示例

**接口：** `POST /api/importAccountsFromJson`

**Headers：**
```
Content-Type: application/json
```

**Body：**
```json
[
  {
    "email": "user@example.com",
    "WorkosCursorSessionToken": "session-token",
    "registration_time": "2024-11-01 10:00:00"
  }
]
```

### 响应格式

```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "totalCount": 1,
    "successCount": 1,
    "insertCount": 1,
    "updateCount": 0,
    "skipCount": 0,
    "errorCount": 0,
    "errors": [],
    "subscriptionCheckCount": 1,
    "subscriptionCheckFailedCount": 0,
    "subscriptionResults": [
      {
        "email": "user@example.com",
        "membershipType": "free_trial",
        "trialLengthDays": 14,
        "daysRemainingOnTrial": 13
      }
    ]
  }
}
```

### 订阅类型

| 类型 | 说明 | 状态 |
|------|------|------|
| `free_trial` | 免费试用 | ✅ 推荐 |
| `pro` | 专业版 | ✅ 优质 |
| `free` | 免费版 | ⚠️ 受限 |
| `team` | 团队版 | ✅ 团队 |
| `student` | 学生版 | ✅ 优惠 |

---

## 📝 使用场景

### ✅ 适合使用

- 批量导入新账号
- 需要立即了解账号订阅状态
- 自动化账号管理流程
- 筛选特定订阅类型的账号

### ⚠️ 注意事项

- 大批量导入（>100）会增加耗时
- 需要提供有效的 SessionToken
- 受 Cursor API 频率限制

---

## 🔍 技术实现

### 核心流程

```
导入账号 → 检查 SessionToken → 调用 Cursor API → 更新订阅信息 → 返回结果
```

### 代码位置

```
mycursor_java/src/main/java/com/mycursor/service/AccountService.java
- importAccounts() 方法
```

### 依赖服务

- `CursorSubscriptionService` - 订阅查询服务
- Cursor Stripe API - 官方订阅接口

---

## 📊 性能参考

| 账号数量 | 预计耗时 | 建议 |
|---------|---------|------|
| 1-10 | 10-20秒 | ✅ 推荐 |
| 10-50 | 1-2分钟 | ✅ 可用 |
| 50-100 | 2-5分钟 | ⚠️ 分批 |
| 100+ | 5分钟+ | ❌ 分批导入 |

---

## 🛠️ 故障排查

### 常见问题

#### 1. 订阅查询失败
**症状：** `subscriptionCheckFailedCount > 0`

**原因：**
- SessionToken 无效或过期
- 网络连接问题
- Cursor API 限流

**解决：**
- 重新获取 SessionToken
- 检查网络连接
- 减少并发请求

#### 2. 全部跳过订阅查询
**症状：** `subscriptionCheckCount = 0`

**原因：** 未提供 SessionToken

**解决：** 在 JSON 数据中添加 `WorkosCursorSessionToken` 字段

#### 3. 导入失败
**症状：** `errorCount > 0`

**解决：**
1. 查看 `errors` 数组中的错误信息
2. 检查后端日志
3. 验证 JSON 数据格式

### 日志位置

```
mycursor_java/logs/mycursor.log          # 常规日志
mycursor_java/logs/mycursor-error.log    # 错误日志
```

---

## 📚 文档导航

### 📖 使用文档

| 文档 | 说明 | 适合人群 |
|------|------|---------|
| [快速开始](mycursor_java/docs/QUICK_START_IMPORT_WITH_SUBSCRIPTION.mdITH_SUBSCRIPTION.md) | 5 分钟上手指南 | 新手 |
| [功能说明](mycursor_java/docs/IMPORT_WITH_SUBSCRIPTION_CHECK.md) | 详细功能介绍 | 所有用户 |
| [API 测试](mycursor_java/docs/API_TEST_SUBSCRIPTION_IMPORT.md) | API 测试指南 | 开发者 |
| [功能更新](mycursor_java/docs/FEATURE_UPDATE_SUBSCRIPTION_CHECK.md) | 更新说明 | 所有用户 |

### 🔧 技术文档

- [代码实现](mycursor_java/src/main/java/com/mycursor/service/AccountService.java)
- [订阅服务](mycursor_java/src/main/java/com/mycursor/service/CursorSubscriptionService.java)
- [API Controller](mycursor_java/src/main/java/com/mycursor/api/ApiController.java)

### 📦 测试资源

- [测试数据](mycursor_java/test-import-with-subscription.json) - JSON 示例
- [更新总结](mycursor_java/docs/UPDATE_SUMMARY.mds/UPDATE_SUMMARY.md) - 完成情况

---

## 🎯 最佳实践

### 1. 批量导入策略
```
建议每批 20-50 个账号
大批量数据分多次导入
避免 API 频率限制
```

### 2. SessionToken 管理
```
定期更新 Token
验证 Token 有效性
备份重要 Token
```

### 3. 结果验证
```
检查 subscriptionCheckCount
查看 subscriptionResults
验证数据库记录
```

### 4. 错误处理
```
查看日志了解详情
重试失败的账号
联系技术支持
```

---

## 🔄 版本历史

### v1.1 (2025-11-04)
- ✨ 新增导入时自动订阅查询
- ✨ 增强返回结果
- 📝 完善文档

### v1.0 (2024-10)
- 🎉 基础导入功能

---

## 🤝 技术支持

### 遇到问题？

1. **查看文档：** 参考上方文档导航
2. **检查日志：** 查看错误日志
3. **测试 API：** 使用 Postman 测试
4. **联系开发：** 提交 Issue

### 反馈渠道

- 📧 Email: 提交问题报告
- 💬 Issue: GitHub Issues
- 📖 文档: 查看完整文档

---

## 📄 许可证

本项目遵循相应的开源许可证。

---

<div align="center">

**Made with ❤️ for better Cursor account management**

[返回顶部](#导入账号自动检查订阅功能---完整指南)

</div>

