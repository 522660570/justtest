# SessionToken 认证模式支持 - 智能补全版

## 🎯 功能说明

本次更新为系统添加了 **SessionToken 智能补全** 功能，参考了 [cursor-free-vip](https://github.com/yeongpin/cursor-free-vip) 项目的实现。

### ⭐ 核心特性

**智能补全机制**：当账号只有 `email` + `sessionToken` 时，系统会自动从 `sessionToken` 中提取 JWT Token 并补全 `accessToken` 和 `refreshToken`。

### 支持的数据格式

#### 1️⃣ 完整令牌模式（传统模式）
- **所需字段**：`email` + `accessToken` + `refreshToken` + `sessionToken`（可选）
- **适用场景**：完整的账号数据

#### 2️⃣ SessionToken 模式（新模式）⭐
- **所需字段**：`email` + `sessionToken`（只需这两个！）
- **适用场景**：新一批账号（只有 session_token 和 email）
- **自动处理**：系统自动补全 `accessToken` 和 `refreshToken`
- **技术基础**：
  - SessionToken 格式：`user_id%3A%3Ajwt_token` 或 `user_id::jwt_token`
  - 系统提取 JWT 部分作为 accessToken 和 refreshToken
  - 根据实际观察，accessToken 和 refreshToken 通常是相同的 JWT

## 🔧 技术实现

### 核心方法：智能补全

#### `extractJwtFromSessionToken()` - JWT 提取器

**位置**：`AccountService.java`

**功能**：从 SessionToken 中提取 JWT Token

**支持格式**：
1. `user_id%3A%3Ajwt_token`（URL 编码格式）
2. `user_id::jwt_token`（普通格式）
3. `eyJhbGci...`（纯 JWT 格式）

**实现逻辑**：
```java
private String extractJwtFromSessionToken(String sessionToken) {
    if (sessionToken == null || sessionToken.isEmpty()) {
        return null;
    }
    
    try {
        // 尝试 %3A%3A 分隔符（URL编码的 ::）
        if (sessionToken.contains("%3A%3A")) {
            String[] parts = sessionToken.split("%3A%3A");
            if (parts.length == 2) {
                return parts[1];  // 返回 JWT 部分
            }
        }
        
        // 尝试 :: 分隔符
        if (sessionToken.contains("::")) {
            String[] parts = sessionToken.split("::");
            if (parts.length == 2) {
                return parts[1];
            }
        }
        
        // 如果已经是 JWT 格式（以 eyJ 开头），直接返回
        if (sessionToken.startsWith("eyJ")) {
            return sessionToken;
        }
        
        return null;
    } catch (Exception e) {
        log.error("提取 JWT 失败: {}", e.getMessage());
        return null;
    }
}
```

### 后端修改

#### 1. `AccountService.java` - 智能补全逻辑

**修改文件**: `mycursor_java/src/main/java/com/mycursor/service/AccountService.java`

**应用位置**：
1. ✅ `getAccountByCode()` - 获取新账号时自动补全
2. ✅ `getAccountByCodeLoop()` - 循环获取时自动补全
3. ✅ `updateExistingAccount()` - 更新账号时自动补全
4. ✅ `createNewAccount()` - 创建账号时自动补全

**补全逻辑**：
```java
// 如果没有 accessToken 但有 sessionToken，从 sessionToken 中提取
String accessToken = account.getAccessToken();
String refreshToken = account.getRefreshToken();
String sessionToken = account.getSessionToken();

if ((accessToken == null || refreshToken == null) && sessionToken != null) {
    String extractedToken = extractJwtFromSessionToken(sessionToken);
    if (extractedToken != null) {
        if (accessToken == null) {
            accessToken = extractedToken;
            log.info("从 sessionToken 中提取 accessToken");
        }
        if (refreshToken == null) {
            refreshToken = extractedToken;
            log.info("从 sessionToken 中提取 refreshToken");
        }
    }
}

accountData.put("accessToken", accessToken);
accountData.put("refreshToken", refreshToken);
accountData.put("sessionToken", sessionToken);
```

**数据库入库**：补全后的 token 会同时保存到数据库，确保数据完整性。

### 前端修改

#### 1. `App.vue` - 简化验证逻辑

**修改文件**: `src/App.vue`

由于后端已自动补全 token，前端验证逻辑得以简化：

```javascript
// 验证新账号数据完整性
// 后端已自动从 sessionToken 中提取并补全 accessToken 和 refreshToken
if (!newAccount.email) {
  throw new Error('获取的新账号缺少email')
}

if (!newAccount.accessToken) {
  throw new Error('获取的新账号缺少accessToken')
}

// 记录认证模式（用于日志）
if (newAccount.sessionToken) {
  console.log('🔑 账号包含 SessionToken (已自动补全 accessToken/refreshToken)')
} else {
  console.log('🔑 账号使用完整令牌模式')
}
```

**状态管理**：
```javascript
const currentAccount = reactive({
  // ... 其他字段
  hasSessionToken: false  // ✅ 新增
})
```

#### 3. `CursorService.js` - 支持 WorkosCursorSessionToken

**修改文件**: `src/services/CursorService.js`

**更新账号存储**（`updateAccountStorage` 方法）：
```javascript
const updates = [
  ['cursorAuth/cachedSignUpType', accountData.signUpType || 'Auth_0'],
  ['cursorAuth/cachedEmail', accountData.email || accountData.user?.email]
]

// ✅ 如果有 sessionToken，添加 WorkosCursorSessionToken
if (accountData.sessionToken) {
  updates.push(['WorkosCursorSessionToken', accountData.sessionToken])
  console.log('🔑 检测到 SessionToken，将使用 SessionToken 模式认证')
}

// 如果有完整的 token，也添加进去
if (accountData.accessToken) {
  updates.push(['cursorAuth/accessToken', accountData.accessToken])
}
if (accountData.refreshToken) {
  updates.push(['cursorAuth/refreshToken', accountData.refreshToken])
}
```

**读取账号信息**（`getCurrentAccountInfo` 方法）：
```javascript
const authKeys = [
  'cursorAuth/cachedEmail',
  'cursorAuth/cachedSignUpType',
  'cursorAuth/accessToken',
  'cursorAuth/refreshToken',
  'WorkosCursorSessionToken'  // ✅ 新增
]

const hasSessionToken = !!authData['WorkosCursorSessionToken']
const hasAccessToken = !!authData['cursorAuth/accessToken']

const accountInfo = {
  // ...
  hasSessionToken: hasSessionToken,
  // 认证判断：有 sessionToken 或 accessToken 都算认证成功
  isAuthenticated: !!(hasSessionToken || hasAccessToken) && !!authData['cursorAuth/cachedEmail']
}
```

#### 4. UI 显示更新

**在账号信息面板中显示 SessionToken 状态**：
```html
<el-tag 
  v-if="currentAccount.hasSessionToken"
  type="success" 
  size="small"
  style="margin-left: 8px;"
>
  Session Token
</el-tag>
```

## 📊 数据库字段

### CursorAccount 表

确保数据库中 `cursor_account` 表有以下字段：

```sql
CREATE TABLE cursor_account (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  session_token TEXT,          -- ✅ SessionToken 字段
  sign_up_type VARCHAR(50),
  -- 其他字段...
);
```

## 🔍 Cursor 认证机制

根据 cursor-free-vip 项目研究，Cursor 使用以下认证字段（存储在 SQLite 数据库 `state.vscdb` 的 `ItemTable` 表中）：

| 字段名 | 说明 | 重要性 |
|--------|------|--------|
| `cursorAuth/cachedEmail` | 用户邮箱 | ⭐⭐⭐ |
| `WorkosCursorSessionToken` | Session Token | ⭐⭐⭐ |
| `cursorAuth/accessToken` | Access Token | ⭐⭐ |
| `cursorAuth/refreshToken` | Refresh Token | ⭐⭐ |
| `cursorAuth/cachedSignUpType` | 注册类型 | ⭐ |

**关键发现**：
- `WorkosCursorSessionToken` 是 Cursor 认证的核心字段
- 即使没有 `accessToken` 和 `refreshToken`，只要有 `sessionToken` 和 `email` 就能正常使用

## 🚀 使用示例

### 导入只有 SessionToken 的账号

#### JSON 数据格式

```json
[
  {
    "email": "user@example.com",
    "auth_info": {
      "WorkosCursorSessionToken": "user_01XXXXX%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
]
```

#### 使用导入接口

```bash
curl -X POST http://localhost:8088/api/accounts/importAccountsFromJson \
  -H "Content-Type: application/json" \
  -d '[
    {
      "email": "user@example.com",
      "auth_info": {
        "WorkosCursorSessionToken": "user_01K4SCY50Y0MC6R44J47C0K41E%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  ]'
```

#### 自动补全过程

1. **导入时**：系统检测到只有 `sessionToken`，没有 `accessToken` 和 `refreshToken`
2. **提取 JWT**：从 `sessionToken` 中提取 JWT 部分
   - 输入：`user_01K4SCY50Y0MC6R44J47C0K41E%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - 提取：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. **自动补全**：
   - `accessToken` ← 提取的 JWT
   - `refreshToken` ← 提取的 JWT（与 accessToken 相同）
4. **入库**：三个字段都保存到数据库
5. **响应**：返回完整的账号数据（包含所有三个 token）

### 一键换号流程

1. **用户点击"Pro续期/一键换号"**
2. **系统自动检测账号类型**：
   - 如果返回的账号有 `sessionToken`，使用 SessionToken 模式
   - 如果返回的账号有 `accessToken` + `refreshToken`，使用完整令牌模式
3. **更新 Cursor 配置**：
   - SessionToken 模式：写入 `WorkosCursorSessionToken`
   - 完整令牌模式：写入 `accessToken` 和 `refreshToken`
4. **重置机器 ID 并重启 Cursor**

## ✅ 优势

1. **兼容性强**：同时支持两种认证模式
2. **灵活性高**：自动识别账号类型，无需手动配置
3. **更省资源**：SessionToken 模式只需两个字段（email + sessionToken）
4. **参考成熟方案**：基于 36.6k ⭐ 的 cursor-free-vip 项目

## 📝 注意事项

1. **数据库字段**：确保 `session_token` 字段存在且能存储长文本
2. **导入数据**：支持导入时同时包含 `accessToken`、`refreshToken` 和 `sessionToken`
3. **优先级**：如果账号同时有两种令牌，系统会同时写入，Cursor 会优先使用 SessionToken
4. **测试建议**：
   - 测试只有 sessionToken 的账号能否正常切换
   - 测试完整令牌账号能否正常切换
   - 测试两种模式的混合使用

## 🔗 参考资料

- [cursor-free-vip](https://github.com/yeongpin/cursor-free-vip) - Cursor AI 机器 ID 重置工具
- Cursor 配置路径：
  - Windows: `%APPDATA%\Cursor\User\globalStorage\state.vscdb`
  - macOS: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
  - Linux: `~/.config/Cursor/User/globalStorage/state.vscdb`

## 🎉 测试步骤

1. **准备测试账号**：
   ```json
   {
     "email": "test@example.com",
     "session_token": "user_01XXXXX..."
   }
   ```

2. **导入账号到数据库**

3. **使用授权码获取账号**：
   - 前端点击"Pro续期/一键换号"
   - 查看控制台日志，应该显示 "🔑 使用 SessionToken 模式认证"

4. **验证 Cursor**：
   - 重启 Cursor 后检查是否成功登录
   - 检查 Pro 功能是否可用

---

**更新时间**：2025-10-25  
**版本**：v2.0 - SessionToken 支持版本


