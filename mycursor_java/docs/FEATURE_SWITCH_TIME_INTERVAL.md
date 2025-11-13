# 换号时间间隔控制功能

## 📋 功能概述

实现了"每次换号间隔必须2分钟以上"的功能，防止用户频繁换号，保护账号资源。

## 🎯 功能特性

- ✅ 支持配置最小换号时间间隔（默认2分钟）
- ✅ 精确到秒的时间检查
- ✅ 友好的错误提示（显示上次换号时间和还需等待时间）
- ✅ 与现有的每日换号次数限制兼容
- ✅ 可通过配置灵活开关

## 📁 涉及的文件修改

### 1. 数据库层面

#### 新增迁移脚本
**文件**: `src/main/resources/db/migration/V3__add_switch_time_interval.sql`

```sql
-- 添加 last_switch_time 字段
ALTER TABLE device_binding ADD COLUMN last_switch_time DATETIME NULL 
    COMMENT '最后一次换号的时间（用于时间间隔控制）';

-- 创建索引
CREATE INDEX idx_last_switch_time ON device_binding(last_switch_time);

-- 初始化已有数据
UPDATE device_binding 
SET last_switch_time = TIMESTAMP(last_switch_date, '00:00:00') 
WHERE last_switch_date IS NOT NULL AND last_switch_time IS NULL;
```

### 2. 实体类修改

#### DeviceBinding.java
**新增字段**:
```java
@TableField("last_switch_time")
private LocalDateTime lastSwitchTime;
```

**修改方法**: `recordSwitch()` - 记录换号的具体时间

### 3. 配置文件修改

#### application.yml
**新增配置项**:
```yaml
mycursor:
  license:
    device-switch:
      min-switch-interval-minutes: 2  # 每次换号最小间隔时间（分钟）
```

#### LicenseConfig.java
**新增配置属性**:
```java
/**
 * 每次换号最小间隔时间（分钟）
 */
private Integer minSwitchIntervalMinutes = 2;
```

### 4. 服务层修改

#### LicenseService.java
**新增方法**: `checkSwitchTimeInterval()` - 检查换号时间间隔

核心逻辑：
1. 获取配置的最小间隔时间
2. 查询上次换号的时间
3. 计算时间差
4. 判断是否满足间隔要求
5. 抛出友好的错误提示

#### DeviceBindingMapper.java
**新增查询方法**:
```java
@Select("SELECT * FROM device_binding WHERE license_code = #{licenseCode} " +
        "AND last_switch_time IS NOT NULL " +
        "ORDER BY last_switch_time DESC LIMIT 1")
DeviceBinding findLastSwitchByLicenseCode(@Param("licenseCode") String licenseCode);
```

## 🔧 配置说明

### 启用/禁用时间间隔检查

在 `application.yml` 中配置：

```yaml
mycursor:
  license:
    device-switch:
      enabled: true  # 总开关：是否启用换号限制
      min-switch-interval-minutes: 2  # 最小间隔时间（分钟）
```

- 设置为 `0` 或 `null`：不限制时间间隔
- 设置为 `2`：每次换号必须间隔2分钟
- 设置为 `5`：每次换号必须间隔5分钟

### 配置示例

#### 场景1：启用2分钟间隔
```yaml
mycursor:
  license:
    device-switch:
      enabled: true
      max-daily-switches: 8
      min-switch-interval-minutes: 2
```

#### 场景2：不限制时间间隔（只限制次数）
```yaml
mycursor:
  license:
    device-switch:
      enabled: true
      max-daily-switches: 8
      min-switch-interval-minutes: 0  # 设置为0表示不限制
```

#### 场景3：完全禁用换号限制
```yaml
mycursor:
  license:
    device-switch:
      enabled: false
```

## 📊 工作流程

### 换号请求处理流程

```
用户发起换号请求
    ↓
1. 检查授权码是否有效
    ↓
2. 检查是否是当前已绑定设备（不算换号）
    ↓
3. 🆕 检查换号时间间隔
    ├─ 查询上次换号时间
    ├─ 计算时间差（分钟）
    └─ 判断是否满足最小间隔
    ↓
4. 检查每日换号次数限制
    ↓
5. 执行换号操作
    └─ 记录 last_switch_time = 当前时间
```

## ⚠️ 错误提示

当用户换号过于频繁时，会收到如下错误提示：

```
换号操作过于频繁！每次换号需间隔 2 分钟以上。
上次换号时间: 2025-11-12 14:30:00，距今 1 分钟，还需等待 1 分钟。
```

错误信息包含：
- ✅ 最小间隔要求
- ✅ 上次换号的具体时间
- ✅ 距今多少分钟
- ✅ 还需等待多少分钟

## 🧪 测试场景

### 测试1：首次换号（无时间限制）
```
操作：用户第一次换号
预期：成功换号，记录当前时间
```

### 测试2：短时间内再次换号（应被拒绝）
```
操作：换号后1分钟内再次换号
预期：拒绝换号，提示"还需等待 1 分钟"
```

### 测试3：间隔2分钟后换号（应成功）
```
操作：换号后2分钟再次换号
预期：成功换号，更新时间记录
```

### 测试4：时间间隔检查禁用
```
配置：min-switch-interval-minutes: 0
操作：连续换号
预期：不检查时间间隔，只检查次数限制
```

## 📝 数据库字段说明

### device_binding 表新增字段

| 字段名 | 类型 | 说明 | 索引 |
|--------|------|------|------|
| `last_switch_time` | DATETIME | 最后一次换号的时间（精确到秒） | 是 |

与现有字段的区别：
- `last_switch_date`: DATE 类型，只记录日期，用于每日次数统计
- `last_switch_time`: DATETIME 类型，记录完整时间，用于时间间隔控制

## 🔄 与现有功能的兼容性

### 与每日换号次数限制的关系

两个限制**同时生效**：
1. ✅ 先检查时间间隔（2分钟）
2. ✅ 再检查每日次数限制（8次）

只有两个条件都满足，才允许换号。

### 向后兼容性

- ✅ 已有数据自动初始化 `last_switch_time`
- ✅ 配置为 0 或 null 时不影响原有功能
- ✅ 不影响现有的授权码和设备绑定逻辑

## 🚀 部署步骤

### 1. 数据库迁移

系统启动时会自动执行迁移脚本 `V3__add_switch_time_interval.sql`

### 2. 修改配置（可选）

如需调整时间间隔，修改 `application.yml`：
```yaml
min-switch-interval-minutes: 2  # 根据需要调整
```

### 3. 重启服务

```bash
# 停止服务
./stop.sh

# 启动服务
./start.sh
```

## 💡 最佳实践

### 推荐配置

```yaml
mycursor:
  license:
    device-switch:
      enabled: true
      max-daily-switches: 8        # 每天最多8次
      min-switch-interval-minutes: 2  # 每次间隔2分钟
```

这样的配置可以：
- ✅ 防止用户频繁换号
- ✅ 保护账号资源
- ✅ 保持良好的用户体验

### 特殊场景处理

如果需要为VIP用户提供不同的限制：
1. 可以在代码中根据授权码类型动态调整配置
2. 或者在数据库中为不同授权码设置不同的限制

## 📞 常见问题

### Q1: 如何临时禁用时间间隔检查？
**A**: 在 `application.yml` 中设置 `min-switch-interval-minutes: 0`

### Q2: 时间间隔是从哪里开始计算的？
**A**: 从上一次换号成功的时刻开始计算

### Q3: 当前已绑定设备重新登录算不算换号？
**A**: 不算。只有切换到新设备才算换号

### Q4: 时间间隔检查会影响性能吗？
**A**: 不会。查询使用了索引，性能影响可忽略

### Q5: 如何查看某个授权码的换号历史？
**A**: 查询 `device_binding` 表的 `last_switch_time` 字段

## 📄 相关文档

- [授权码系统说明](./LICENSE_SYSTEM.md)
- [设备绑定机制](./DEVICE_BINDING.md)
- [换号限制配置](./SWITCH_LIMIT_CONFIG.md)

## 📅 更新日志

### v1.0.0 (2025-11-12)
- ✅ 实现换号时间间隔控制功能
- ✅ 添加数据库字段 `last_switch_time`
- ✅ 添加配置项 `min-switch-interval-minutes`
- ✅ 友好的错误提示信息
- ✅ 完整的测试和文档




