# 📥 JSON导入账号API使用指南

## 🎯 功能概述

我已经为你创建了两个新的API接口，用于通过JSON数据导入Cursor账号。这些接口会自动处理字段名转换，将你提供的数据格式转换为系统内部格式。

## 🔧 字段映射关系

| 输入字段名 | 系统内部字段名 | 说明 |
|-----------|---------------|------|
| `email` | `email` | 邮箱地址（保持不变） |
| `WorkosCursorSessionToken` | `session_token` | 会话令牌 |
| `registration_time` | `created_time` | 注册时间 |

## 📡 API接口

### 1. 直接JSON数组接口（推荐）

**接口地址**: `POST /importAccountsFromJson`

**请求格式**: 直接发送JSON数组

**请求示例**:
```json
[
  {
    "email": "38rials_suits@icloud.com",
    "registration_time": "2025-10-22 21:25:02",
    "WorkosCursorSessionToken": "user_01K860SSW4FPEFSTG59SCJ91W1%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzg2MFNTVzRGUEVGU1RHNTlTQ0o5MVcxIiwidGltZSI6IjE3NjExMzk0OTAiLCJyYW5kb21uZXNzIjoiMGI2OGUxYjgtNzQ4ZC00ZDA0IiwiZXhwIjoxNzY2MzIzNDkwLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.a1SyfyOWRP-_QEEibbH5hwes7mbPIp5kTgEN0IIwf34"
  },
  {
    "email": "another@example.com",
    "registration_time": "2025-10-22 22:30:15",
    "WorkosCursorSessionToken": "user_02K860SSW4FPEFSTG59SCJ91W2%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
]
```

### 2. 包装JSON字符串接口（备用）

**接口地址**: `POST /importAccountsFromJsonString`

**请求格式**: JSON对象包含jsonData字段

**请求示例**:
```json
{
  "jsonData": "[{\"email\":\"38rials_suits@icloud.com\",\"registration_time\":\"2025-10-22 21:25:02\",\"WorkosCursorSessionToken\":\"user_01K860SSW4FPEFSTG59SCJ91W1%3A%3A...\"}]"
}
```

## 📝 响应格式

### 成功响应
```json
{
  "code": 1,
  "message": "导入成功",
  "data": {
    "totalCount": 2,
    "successCount": 2,
    "insertCount": 1,
    "updateCount": 1,
    "skipCount": 0,
    "errors": []
  }
}
```

### 失败响应
```json
{
  "code": 0,
  "message": "导入失败: JSON格式错误",
  "data": null
}
}
```

## 🧪 测试方法

### 使用curl测试

#### 1. 测试直接JSON数组接口
```bash
curl -X POST "http://localhost:8080/importAccountsFromJson" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "email": "test@example.com",
      "registration_time": "2025-10-22 21:25:02",
      "WorkosCursorSessionToken": "test_token_123"
    }
  ]'
```

#### 2. 测试包装JSON字符串接口
```bash
curl -X POST "http://localhost:8080/importAccountsFromJsonString" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonData": "[{\"email\":\"test@example.com\",\"registration_time\":\"2025-10-22 21:25:02\",\"WorkosCursorSessionToken\":\"test_token_123\"}]"
  }'
```

### 使用Postman测试

1. **设置请求方法**: POST
2. **设置URL**: `http://localhost:8080/importAccountsFromJson`
3. **设置Headers**: 
   - `Content-Type: application/json`
4. **设置Body**: 选择raw，输入JSON数组数据

## 🔄 数据转换逻辑

接口会自动执行以下转换：

1. **字段名转换**:
   - `WorkosCursorSessionToken` → 包装到 `auth_info.WorkosCursorSessionToken`
   - `registration_time` → `register_time`
   - `email` 保持不变
   - 自动设置 `sign_up_type` 为 "Auth0"

2. **数据结构转换**:
   ```json
   // 输入格式
   {
     "email": "user@example.com",
     "registration_time": "2025-10-22 21:25:02",
     "WorkosCursorSessionToken": "token_value"
   }
   
   // 转换后格式
   {
     "email": "user@example.com",
     "register_time": "2025-10-22 21:25:02",
     "sign_up_type": "Auth0",
     "auth_info": {
       "WorkosCursorSessionToken": "token_value"
     }
   }
   ```

3. **数据验证**:
   - 检查必填字段（email）
   - 验证JSON格式
   - 处理重复邮箱（更新已有记录）

4. **批量处理**:
   - 支持单个对象或数组
   - 事务处理，确保数据一致性
   - 详细的导入结果统计

## 🚨 注意事项

1. **数据格式**: 确保JSON格式正确，特别注意引号和逗号
2. **字段名**: 使用提供的字段名格式，系统会自动转换
3. **邮箱唯一性**: 相同邮箱会更新已有记录，而不是创建新记录
4. **时间格式**: 建议使用 `YYYY-MM-DD HH:mm:ss` 格式
5. **Token长度**: session_token可能很长，确保没有被截断

## 🔍 错误排查

### 常见错误及解决方案

1. **JSON格式错误**
   - 检查JSON语法，使用在线JSON验证工具
   - 确保所有字符串都用双引号包围

2. **字段缺失**
   - 确保包含必填字段：email
   - 检查字段名拼写是否正确

3. **数据库连接错误**
   - 确保后端服务正在运行
   - 检查数据库连接配置

4. **权限错误**
   - 确保数据库用户有插入/更新权限
   - 检查表结构是否正确

## 📊 导入结果说明

- **totalCount**: 总处理数量
- **successCount**: 成功处理数量
- **insertCount**: 新增记录数量
- **updateCount**: 更新记录数量
- **skipCount**: 跳过记录数量
- **errors**: 错误详情列表

## 🔧 问题修复记录

### 修复session_token导入问题

**问题**: session_token没有成功导入，sign_up_type都是Auth_0

**原因**: 
1. AccountService期望从`auth_info`对象中提取session_token，但新数据格式是直接在顶层
2. AccountService硬编码设置sign_up_type为"email"，没有从输入数据读取

**解决方案**:
1. 修改数据转换逻辑，将`WorkosCursorSessionToken`包装到`auth_info`对象中
2. 修改AccountService的`createNewAccount`和`updateExistingAccount`方法，支持从输入数据读取`sign_up_type`
3. 在转换逻辑中设置默认的`sign_up_type`为"Auth0"

**修复后效果**:
- ✅ session_token正确导入到数据库
- ✅ sign_up_type设置为"Auth0"
- ✅ 保持与现有导入逻辑的兼容性

现在你可以使用这两个接口来导入JSON格式的账号数据了！推荐使用第一个接口（`/importAccountsFromJson`），因为它更简洁直接。
