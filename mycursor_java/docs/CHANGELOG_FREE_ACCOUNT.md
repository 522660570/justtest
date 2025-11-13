# Free 账号支持功能 - 修改记录

**日期**：2025-11-09  
**版本**：1.0.2  
**功能**：支持配置是否接受 membershipType=free 的账号

---

## 📋 需求背景

之前系统只保留 `pro` 和 `free_trial` 类型的账号，所有 `free` 类型的账号都会被自动删除。

**原有日志**：
```
2025-11-09 13:00:29.457 INFO  - 账号 tiler-43pizza@icloud.com 订阅类型检查完成 - 类型: free, 试用总天数: 7, 剩余天数: null
2025-11-09 13:00:29.457 WARN  - ⚠️ 账号 tiler-43pizza@icloud.com membershipType=free (不是pro或free_trial)，账号将被删除
```

**需求**：
1. `free` 账号也应该可以返回给前端
2. `free` 账号现在也算是正常账号
3. 添加一个配置开关来控制是否接受 `free` 账号

---

## 🔧 修改内容

### 1. 新增配置类
**文件**：`src/main/java/com/mycursor/config/AccountConfig.java`

```java
@Data
@Component
@ConfigurationProperties(prefix = "mycursor.account")
public class AccountConfig {
    private Integer quotaCheckInterval = 3600;
    private Boolean acceptFreeAccounts = false;  // 新增配置项
}
```

### 2. 更新配置文件
**文件**：`src/main/resources/application.yml`

```yaml
mycursor:
  account:
    quota-check-interval: 3600
    accept-free-accounts: false  # 新增配置项（默认 false，保持向后兼容）
```

### 3. 修改 AccountService.java

#### 3.1 注入配置类
```java
private final com.mycursor.config.AccountConfig accountConfig;
```

#### 3.2 新增辅助方法
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

#### 3.3 修改 4 个方法的逻辑

1. **isCurrentAccountStillUsable()**：检查当前账号是否仍可用
   - 使用 `isValidMembershipType()` 替代硬编码判断

2. **verifyAccountMembershipType()**：验证账号订阅类型
   - 使用 `isValidMembershipType()` 判断是否保留账号
   - 添加 `free` 账号的日志提示
   - 根据配置调整删除提示信息

3. **batchUpdateAccountMembershipStatus()**：批量更新账号状态
   - 使用 `isValidMembershipType()` 判断是否保留账号
   - 根据配置调整删除提示信息

4. **updateAccountMembershipStatus()**：单个更新账号状态
   - 使用 `isValidMembershipType()` 判断是否保留账号
   - 根据配置调整删除提示信息

---

## 📊 修改对比

### 原有逻辑（硬编码）
```java
boolean shouldKeep = "pro".equals(membershipType) || "free_trial".equals(membershipType);
```

### 新逻辑（可配置）
```java
boolean shouldKeep = isValidMembershipType(membershipType);
```

---

## 🎯 功能效果

### 配置为 `false`（默认，保持原有行为）

| 账号类型 | 是否保留 | 是否换号 |
|---------|---------|---------|
| `pro` | ✅ | ❌ |
| `free_trial` | ✅ | ✅ |
| `free` | ❌ | ❌ |
| 其他 | ❌ | ❌ |

**日志**：
```
⚠️ 账号 xxx@example.com membershipType=free (不是pro或free_trial)，账号将被删除
```

### 配置为 `true`（新功能）

| 账号类型 | 是否保留 | 是否换号 |
|---------|---------|---------|
| `pro` | ✅ | ❌ |
| `free_trial` | ✅ | ✅ |
| `free` | ✅ | ❌ |
| 其他 | ❌ | ❌ |

**日志**：
```
✅ 账号 xxx@example.com 是 free 类型，保留但不用于一键换号
```

---

## 📦 修改文件清单

1. ✅ `src/main/java/com/mycursor/config/AccountConfig.java` - **新增**
2. ✅ `src/main/resources/application.yml` - **修改**
3. ✅ `src/main/java/com/mycursor/service/AccountService.java` - **修改**
4. ✅ `FREE_ACCOUNT_CONFIG.md` - **新增**（详细说明文档）
5. ✅ `QUICK_START_FREE_ACCOUNT.md` - **新增**（快速开始指南）
6. ✅ `CHANGELOG_FREE_ACCOUNT.md` - **新增**（本文档）

---

## ✅ 测试建议

### 测试场景1：配置为 false（默认）
1. 确保配置为 `accept-free-accounts: false`
2. 导入一个 `free` 类型的账号
3. 预期：账号被删除，日志显示 `(不是pro或free_trial)`

### 测试场景2：配置为 true
1. 修改配置为 `accept-free-accounts: true`
2. 重启应用
3. 导入一个 `free` 类型的账号
4. 预期：账号被保留，日志显示 `✅ 是 free 类型，保留但不用于一键换号`

### 测试场景3：验证其他类型不受影响
1. 导入 `pro` 和 `free_trial` 类型的账号
2. 预期：无论配置如何，这两种类型都应该被保留

---

## 🔄 向后兼容性

- ✅ **默认值为 `false`**：保持原有行为，不影响现有系统
- ✅ **配置可选**：如果不配置，使用默认值
- ✅ **日志友好**：根据配置显示不同的提示信息
- ✅ **数据库兼容**：不需要修改数据库结构

---

## 🚀 部署步骤

1. 拉取最新代码
2. 根据需求修改 `application.yml` 中的 `accept-free-accounts` 配置
3. 编译打包：`mvn clean package`
4. 停止旧服务：`./deploy/stop.sh`
5. 启动新服务：`./deploy/start.sh`
6. 验证配置是否生效：查看启动日志和测试导入账号

---

## 📞 支持

如有问题，请查看：
- [详细配置说明](mycursor_java/docs/FREE_ACCOUNT_CONFIG.mdE_ACCOUNT_CONFIG.md)
- [快速开始指南](mycursor_java/docs/QUICK_START_FREE_ACCOUNT.md)

