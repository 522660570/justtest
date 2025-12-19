# 新旧客户端兼容策略

## 📖 背景说明

为了同时支持**旧版客户端**（期望后端直接返回 AccessToken）和**新版客户端**（自己调用 reftoken 接口获取 AccessToken），我们实现了一套智能兼容策略。

## 🔄 工作流程

### 方案一：旧客户端（后端提供 AccessToken）

1. **管理员操作**：定期调用批量刷新接口
   ```bash
   POST http://localhost:8088/refreshAvailableAccountsAccessToken
   ```

2. **后端行为**：
   - 批量刷新接口会调用 reftoken API 获取所有可用账号的 AccessToken
   - 将获取到的 AccessToken 保存到数据库中

3. **客户端获取账号**：
   ```bash
   GET http://localhost:8088/getAccountByCode/{code}/{mac}/{currentAccount}
   ```

4. **后端返回**：
   ```json
   {
     "code": 1,
     "message": "获取新账号成功",
     "data": {
       "email": "user@example.com",
       "sessionToken": "user_01XXX::eyJ...",
       "accessToken": "eyJ...",  // ✅ 数据库中有值，直接返回
       "refreshToken": "eyJ...",
       "signUpType": "Auth0"
     }
   }
   ```

5. **客户端行为**：
   - 直接使用后端返回的 accessToken
   - **无需**调用 reftoken 接口

### 方案二：新客户端（前端获取 AccessToken）

1. **客户端获取账号**：
   ```bash
   GET http://localhost:8088/getAccountByCode/{code}/{mac}/{currentAccount}
   ```

2. **后端返回**：
   ```json
   {
     "code": 1,
     "message": "获取新账号成功",
     "data": {
       "email": "user@example.com",
       "sessionToken": "user_01XXX::eyJ...",
       "accessToken": "",  // ✅ 数据库中没有值，返回空字符串
       "refreshToken": "",
       "signUpType": "Auth0"
     }
   }
   ```

3. **前端智能判断**：
   ```javascript
   if (!newAccount.accessToken || newAccount.accessToken.trim() === '') {
     // 后端未返回 accessToken，前端自己调用 reftoken 接口
     const refTokenUrl = `https://token.cursorpro.com.cn/reftoken?token=${encodedToken}`
     const refTokenResponse = await fetch(refTokenUrl)
     const refTokenResult = await refTokenResponse.json()
     
     if (refTokenResult.code === 0) {
       newAccount.accessToken = refTokenResult.data.accessToken
       newAccount.refreshToken = refTokenResult.data.accessToken
     }
   } else {
     // 后端已返回 accessToken，直接使用
     console.log('使用后端提供的 accessToken')
   }
   ```

## 📊 核心逻辑

### 后端 (`AccountService.java`)

```java
// 判断数据库中是否有 accessToken
String accessToken = account.getAccessToken();
boolean hasAccessToken = accessToken != null && !accessToken.trim().isEmpty();

// 有值返回给旧客户端，无值返回空字符串让新客户端自己获取
accountData.put("accessToken", hasAccessToken ? accessToken : "");
accountData.put("refreshToken", hasAccessToken ? refreshToken : "");

log.info("成功分配账号: {} (accessToken: {})", 
    account.getEmail(),
    hasAccessToken ? "有(数据库)" : "无(需前端获取)");
```

### 前端 (`App.vue`)

```javascript
// 兼容新旧客户端策略
if (!newAccount.accessToken || newAccount.accessToken.trim() === '') {
  // 后端未返回，前端自己调用 reftoken 接口（新客户端）
  console.log('后端未返回 accessToken，前端从 reftoken 接口获取...')
  // ... 调用 reftoken 接口 ...
} else {
  // 后端已返回，直接使用（旧客户端）
  console.log('后端已返回 accessToken，直接使用')
}
```

## 🎯 使用场景

### 场景 1: 旧客户端（推荐用于生产环境）

**优势**：
- ✅ 使用后端服务器 IP 调用 reftoken 接口（集中管理）
- ✅ 批量刷新效率高
- ✅ 客户端逻辑简单，无需实现 reftoken 调用
- ✅ 适合有大量用户的生产环境

**劣势**：
- ⚠️ 后端 IP 可能会被限制（需要定期更换 IP 或控制刷新频率）

**使用步骤**：
1. 部署后端服务
2. 设置定时任务，定期调用批量刷新接口：
   ```bash
   # 每天凌晨 2 点刷新
   0 2 * * * curl -X POST http://localhost:8088/refreshAvailableAccountsAccessToken
   ```
3. 客户端正常调用 `getAccountByCode` 接口即可

### 场景 2: 新客户端（推荐用于新开发）

**优势**：
- ✅ 使用客户端自己的 IP 调用 reftoken 接口（分散 IP，避免被限制）
- ✅ 不依赖后端 IP
- ✅ 适合小规模或个人使用

**劣势**：
- ⚠️ 需要更新客户端代码
- ⚠️ 每个客户端都需要调用 reftoken 接口

**使用步骤**：
1. 使用最新版前端代码（已包含 reftoken 调用逻辑）
2. 客户端调用 `getAccountByCode` 接口
3. 前端自动判断是否需要调用 reftoken 接口

## 🔧 切换策略

### 从旧模式切换到新模式

1. **停止批量刷新定时任务**
2. **清空数据库中的 accessToken**：
   ```sql
   UPDATE cursor_account 
   SET access_token = NULL, refresh_token = NULL 
   WHERE is_available = 1;
   ```
3. **更新客户端到最新版本**

### 从新模式切换到旧模式

1. **调用批量刷新接口**，填充数据库：
   ```bash
   POST http://localhost:8088/refreshAvailableAccountsAccessToken
   ```
2. **设置定时任务**，定期刷新
3. 客户端无需更新（兼容逻辑已内置）

## 📝 日志示例

### 旧客户端日志（后端提供 AccessToken）

```log
# 后端日志
2025-11-06 18:00:00 [INFO] 成功分配账号: user@example.com (类型: free_trial, sessionToken: 有, accessToken: 有(数据库))

# 前端日志
✅ 获取新账号成功: user@example.com
📊 后端返回的完整账号数据: {...}
✅ 后端已返回 accessToken（数据库中已有，已通过批量刷新），直接使用
📊 AccessToken 长度: 1234
```

### 新客户端日志（前端获取 AccessToken）

```log
# 后端日志
2025-11-06 18:00:00 [INFO] 成功分配账号: user@example.com (类型: free_trial, sessionToken: 有, accessToken: 无(需前端获取))

# 前端日志
✅ 获取新账号成功: user@example.com
📊 后端返回的完整账号数据: {...}
🔧 步骤2: 后端未返回 accessToken，前端从 reftoken 接口获取...
🔧 调用 reftoken 接口...
🔧 reftoken API 响应: {code: 0, msg: "获取成功", ...}
✅ 从 reftoken 接口成功获取 AccessToken
📊 AccessToken 长度: 1234
📊 剩余天数: 30
📊 过期时间: 2025-12-06
```

## ⚠️ 注意事项

1. **IP 限制问题**：
   - 旧模式：后端 IP 可能会被限制，需要控制刷新频率或定期更换 IP
   - 新模式：使用客户端 IP，分散压力，不易被限制

2. **同时使用两种模式**：
   - 系统会自动根据数据库中是否有 accessToken 来判断
   - 可以部分账号使用旧模式（数据库中有 accessToken），部分使用新模式（数据库中没有）

3. **定时任务建议**：
   - 建议每天刷新一次即可
   - 避免频繁刷新导致 IP 被限制
   - 刷新时间建议选择在用户使用低峰期

4. **数据库维护**：
   - 定期检查 accessToken 的有效性
   - 清理过期或无效的 accessToken

## 🔗 相关接口

- `POST /refreshAvailableAccountsAccessToken` - 批量刷新可用账号的 AccessToken
- `GET /getAccountByCode/{code}/{mac}/{currentAccount}` - 获取新账号
- `https://token.cursorpro.com.cn/reftoken?token=XXX` - reftoken API（外部接口）

