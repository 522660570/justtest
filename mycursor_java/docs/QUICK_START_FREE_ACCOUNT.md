# Free 账号支持 - 快速开始

## 🚀 快速配置

### 启用 Free 账号支持

在 `src/main/resources/application.yml` 中修改：

```yaml
mycursor:
  account:
    accept-free-accounts: true  # 改为 true
```

### 禁用 Free 账号支持（默认）

```yaml
mycursor:
  account:
    accept-free-accounts: false  # 保持 false
```

## 📝 配置效果对比

### 配置为 `false`（默认）

```
2025-11-09 13:00:29.457 INFO  - 账号 test@icloud.com 订阅类型检查完成 - 类型: free, 试用总天数: 7, 剩余天数: null
2025-11-09 13:00:29.457 WARN  - ⚠️ 账号 test@icloud.com membershipType=free (不是pro或free_trial)，账号将被删除
```

**结果**：free 账号被删除 ❌

---

### 配置为 `true`

```
2025-11-09 13:00:29.457 INFO  - 账号 test@icloud.com 订阅类型检查完成 - 类型: free, 试用总天数: 7, 剩余天数: null
2025-11-09 13:00:29.458 INFO  - ✅ 账号 test@icloud.com 是 free 类型，保留但不用于一键换号
```

**结果**：free 账号被保留 ✅

## 🔧 应用修改

修改配置后，重启 Spring Boot 应用：

```bash
# 停止应用
./deploy/stop.sh

# 启动应用
./deploy/start.sh

# 或者重启
./deploy/restart.sh
```

## ✅ 验证配置

1. **查看启动日志**：确认配置已加载
   ```
   AccountConfig(quotaCheckInterval=3600, acceptFreeAccounts=true)
   ```

2. **导入测试账号**：导入一个 free 类型的账号
3. **检查日志**：查看账号是否被保留或删除

## 📊 账号类型说明

| 类型 | accept-free-accounts=false | accept-free-accounts=true |
|------|---------------------------|--------------------------|
| `free_trial` | ✅ 保留并可换号 | ✅ 保留并可换号 |
| `pro` | ✅ 保留但不换号 | ✅ 保留但不换号 |
| `free` | ❌ 删除 | ✅ 保留但不换号 |
| 其他 | ❌ 删除 | ❌ 删除 |

## 💡 常见问题

### Q: 修改配置后没有生效？
**A:** 需要重启应用才能使配置生效。

### Q: free 账号可以用于一键换号吗？
**A:** 不可以。即使保留了 free 账号，也只有 `free_trial` 账号才能用于一键换号。

### Q: 已有的 free 账号会自动恢复吗？
**A:** 不会。配置只影响新导入和更新的账号，已删除的账号不会自动恢复。

### Q: 推荐使用哪个配置？
**A:** 
- **推荐 `false`（默认）**：如果只需要试用账号功能
- **使用 `true`**：如果需要保留所有类型的账号用于统计或其他用途

## 📚 更多文档

详细说明请查看：[FREE_ACCOUNT_CONFIG.md](mycursor_java/docs/FREE_ACCOUNT_CONFIG.md)

