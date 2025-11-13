# Free 账号支持配置说明

## 功能说明

系统现在支持配置是否接受 `membershipType=free` 的账号。通过配置开关，你可以灵活控制系统接受哪些类型的账号。

## 配置方式

在 `src/main/resources/application.yml` 中配置：

```yaml
mycursor:
  account:
    accept-free-accounts: false # 是否接受 free 类型的账号（true=接受，false=不接受）
```

### 配置说明

- **`accept-free-accounts: false`（默认值）**
  - 只接受 `pro` 和 `free_trial` 类型的账号
  - `free` 类型的账号会被删除
  - 日志提示：`membershipType=free (不是pro或free_trial)，账号将被删除`

- **`accept-free-accounts: true`**
  - 接受 `pro`、`free_trial` 和 `free` 类型的账号
  - `free` 类型的账号会被保留在数据库中
  - 日志提示：`✅ 账号 xxx@example.com 是 free 类型，保留但不用于一键换号`

## 账号类型处理规则

### 当 `accept-free-accounts: false`（默认）

| 账号类型 | 是否保留 | 是否用于一键换号 | 说明 |
|---------|---------|----------------|------|
| `pro` | ✅ 是 | ❌ 否 | 保留，但不用于一键换号 |
| `free_trial` | ✅ 是 | ✅ 是 | 保留，且用于一键换号 |
| `free` | ❌ 否 | ❌ 否 | 删除 |
| 其他类型 | ❌ 否 | ❌ 否 | 删除 |

### 当 `accept-free-accounts: true`

| 账号类型 | 是否保留 | 是否用于一键换号 | 说明 |
|---------|---------|----------------|------|
| `pro` | ✅ 是 | ❌ 否 | 保留，但不用于一键换号 |
| `free_trial` | ✅ 是 | ✅ 是 | 保留，且用于一键换号 |
| `free` | ✅ 是 | ❌ 否 | 保留，但不用于一键换号 |
| 其他类型 | ❌ 否 | ❌ 否 | 删除 |

## 使用示例

### 场景1：只接受试用账号（默认）

```yaml
mycursor:
  account:
    accept-free-accounts: false
```

这种情况下，系统只会保留 `pro` 和 `free_trial` 账号，`free` 账号会被自动删除。

**日志示例：**
```
2025-11-09 13:00:29.457 [http-nio-8088-exec-3] INFO  com.mycursor.service.AccountService - 账号 tiler-43pizza@icloud.com 订阅类型检查完成 - 类型: free, 试用总天数: 7, 剩余天数: null
2025-11-09 13:00:29.457 [http-nio-8088-exec-3] WARN  com.mycursor.service.AccountService - ⚠️ 账号 tiler-43pizza@icloud.com membershipType=free (不是pro或free_trial)，账号将被删除
```

### 场景2：同时接受 free 账号

```yaml
mycursor:
  account:
    accept-free-accounts: true
```

这种情况下，系统会保留 `pro`、`free_trial` 和 `free` 账号。

**日志示例：**
```
2025-11-09 13:00:29.457 [http-nio-8088-exec-3] INFO  com.mycursor.service.AccountService - 账号 tiler-43pizza@icloud.com 订阅类型检查完成 - 类型: free, 试用总天数: 7, 剩余天数: null
2025-11-09 13:00:29.458 [http-nio-8088-exec-3] INFO  com.mycursor.service.AccountService - ✅ 账号 tiler-43pizza@icloud.com 是 free 类型，保留但不用于一键换号
```

## 影响范围

此配置影响以下功能：

1. **账号导入时的类型检查**（`verifyAccountMembershipType` 方法）
2. **批量更新账号订阅状态**（`batchUpdateAccountMembershipStatus` 方法）
3. **单个账号订阅状态更新**（`updateAccountMembershipStatus` 方法）
4. **检查当前账号是否可用**（`isCurrentAccountStillUsable` 方法）

## 注意事项

1. **重启生效**：修改配置后需要重启应用才能生效
2. **已有账号**：修改配置不会影响数据库中已有的账号，只影响新导入和更新的账号
3. **一键换号**：即使 `accept-free-accounts: true`，`free` 账号仍然不会用于一键换号功能（只有 `free_trial` 账号才会用于一键换号）
4. **默认值**：为了向后兼容，默认值为 `false`（不接受 free 账号）

## 代码实现

核心判断逻辑在 `AccountService.isValidMembershipType()` 方法中：

```java
private boolean isValidMembershipType(String membershipType) {
    if (membershipType == null) {
        return false;
    }
    
    // 始终接受 pro 和 free_trial
    if ("pro".equals(membershipType) || "free_trial".equals(membershipType)) {
        return true;
    }
    
    // 根据配置决定是否接受 free
    if ("free".equals(membershipType) && accountConfig.getAcceptFreeAccounts()) {
        return true;
    }
    
    return false;
}
```

## 版本信息

- **添加日期**：2025-11-09
- **版本**：1.0.2
- **作者**：lwz

