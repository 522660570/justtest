# 📝 版本号配置指南

## 概述

版本信息已经配置到配置文件中，你可以通过修改配置文件来更新版本信息，**无需修改代码**！

---

## ⚙️ 配置说明

### 1️⃣ 后端配置（最新版本号和更新信息）

**配置文件位置：** `mycursor_java/src/main/resources/application.yml`

**配置内容（第 70-87 行）：**

```yaml
# 版本控制配置
app:
  version:
    # 最新版本号（每次发布新版本时修改这里）👈 重点！
    latest: "1.1.0"
    
    # 更新标题
    update-title: "发现新版本"
    
    # 更新消息
    update-message: "检测到新版本，建议更新以获得更好的体验和最新功能！"
    
    # 下载地址（修改为你的实际下载地址）👈 重点！
    download-url: "https://gitee.com/liweizhi66/cursor-free-tool/releases/tag/v1.0.1"
    
    # 是否强制更新（true=强制更新，false=可选更新）👈 重点！
    force-update: false
    
    # 更新内容列表（支持 emoji 图标）👈 可自定义
    features:
      - "🎉 新增次卡支持，支持按次数续杯"
      - "🚀 优化账号切换速度，提升用户体验"
      - "🔧 修复已知问题，提高系统稳定性"
      - "✨ 新增版本检查功能，及时获取更新通知"
```

### 2️⃣ 前端配置（当前版本号）

**配置文件位置：** `src/services/VersionService.js`

**配置内容（第 94 行）：**

```javascript
getCurrentVersion() {
  // 当前前端版本号（每次发布新版本时修改这里）👈 重点！
  return '1.0.1'
}
```

---

## 🚀 使用场景

### 场景1：发布新版本

假设你要发布 `1.2.0` 版本：

#### 步骤1：修改后端最新版本号

编辑 `mycursor_java/src/main/resources/application.yml`：

```yaml
app:
  version:
    latest: "1.2.0"  # 👈 修改这里
    download-url: "https://gitee.com/liweizhi66/cursor-free-tool/releases/tag/v1.2.0"  # 👈 修改下载地址
    features:
      - "🎉 新功能1：支持批量导入账号"
      - "🚀 新功能2：优化性能，速度提升50%"
      - "🔧 修复：修复某个重要Bug"
```

#### 步骤2：修改前端当前版本号

编辑 `src/services/VersionService.js`：

```javascript
getCurrentVersion() {
  return '1.2.0'  // 👈 修改这里
}
```

#### 步骤3：重启后端服务

```bash
# 重启 Spring Boot 应用以加载新配置
# 或者如果使用 Spring Boot DevTools，会自动重启
```

#### 步骤4：测试

启动前端应用，应该不会看到更新提醒（因为前端版本 = 后端最新版本）。

---

### 场景2：提醒用户更新（正常更新）

假设用户使用的是 `1.1.0` 版本，你希望提醒他们更新到 `1.2.0`：

#### 修改配置文件

```yaml
app:
  version:
    latest: "1.2.0"
    force-update: false  # 👈 可选更新
    features:
      - "🎉 新功能：xxx"
      - "🚀 性能优化"
```

用户启动应用时会看到更新提醒，可以选择：
- **立即下载** - 打开下载页面
- **稍后提醒** - 关闭对话框

---

### 场景3：强制用户更新（紧急安全更新）

假设发现了严重安全漏洞，必须强制用户更新：

#### 修改配置文件

```yaml
app:
  version:
    latest: "1.2.1"
    force-update: true  # 👈 强制更新
    update-title: "重要安全更新"
    update-message: "检测到严重安全漏洞，必须立即更新！"
    features:
      - "🔒 修复严重安全漏洞"
      - "🛡️ 加强数据保护"
```

用户启动应用时会看到强制更新提醒：
- **无法关闭对话框**
- **必须点击"立即下载"**

---

## 📋 配置项详细说明

| 配置项 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `latest` | String | ✅ | 最新版本号，使用语义化版本号 | "1.2.0" |
| `update-title` | String | ✅ | 更新提醒标题 | "发现新版本" |
| `update-message` | String | ✅ | 更新提醒消息 | "检测到新版本..." |
| `download-url` | String | ✅ | 下载地址URL | "https://..." |
| `force-update` | Boolean | ✅ | 是否强制更新 | true / false |
| `features` | List<String> | ✅ | 更新内容列表（支持emoji） | 见示例 |

---

## 🎯 版本号规范

### 语义化版本号格式

采用 `主版本号.次版本号.修订号` 格式：

```
主版本号.次版本号.修订号
   ↓       ↓       ↓
  1   .   2   .   0
```

- **主版本号（Major）** - 不兼容的重大改动
- **次版本号（Minor）** - 向下兼容的功能新增
- **修订号（Patch）** - 向下兼容的问题修正

### 版本号示例

```
1.0.0 → 初始版本
1.0.1 → Bug修复
1.1.0 → 新增功能（兼容）
2.0.0 → 重大更新（可能不兼容）
```

### 版本比较规则

```
1.0.0 < 1.0.1 < 1.1.0 < 1.2.0 < 2.0.0
```

---

## ✅ 完整示例

### 示例1：小版本更新（Bug修复）

```yaml
# application.yml
app:
  version:
    latest: "1.0.1"
    update-title: "Bug修复更新"
    update-message: "修复了一些已知问题"
    download-url: "https://gitee.com/liweizhi66/cursor-free-tool/releases/tag/v1.0.1"
    force-update: false
    features:
      - "🔧 修复授权码验证失败的问题"
      - "🔧 修复账号切换偶尔卡死的问题"
      - "✨ 优化界面显示效果"
```

### 示例2：中版本更新（新功能）

```yaml
# application.yml
app:
  version:
    latest: "1.1.0"
    update-title: "功能更新"
    update-message: "新增实用功能，提升使用体验"
    download-url: "https://gitee.com/liweizhi66/cursor-free-tool/releases/tag/v1.1.0"
    force-update: false
    features:
      - "🎉 新增次卡支持，按次数计费"
      - "🎉 新增批量导入账号功能"
      - "🚀 优化账号切换速度，提升50%"
      - "🔧 修复已知问题"
```

### 示例3：大版本更新（重大改动）

```yaml
# application.yml
app:
  version:
    latest: "2.0.0"
    update-title: "重大版本更新"
    update-message: "全新架构，全新体验！"
    download-url: "https://gitee.com/liweizhi66/cursor-free-tool/releases/tag/v2.0.0"
    force-update: true  # 建议强制更新
    features:
      - "🎉 全新UI设计，更加美观易用"
      - "🎉 全新架构，性能提升300%"
      - "🎉 新增云端同步功能"
      - "🚀 支持多设备管理"
      - "🔐 增强安全性"
```

### 示例4：紧急安全更新

```yaml
# application.yml
app:
  version:
    latest: "1.0.2"
    update-title: "🔴 紧急安全更新"
    update-message: "发现严重安全漏洞，请立即更新！"
    download-url: "https://gitee.com/liweizhi66/cursor-free-tool/releases/tag/v1.0.2"
    force-update: true  # 必须强制更新
    features:
      - "🔒 修复严重安全漏洞 CVE-2025-xxxx"
      - "🛡️ 加强数据传输加密"
      - "🔐 修复授权验证绕过漏洞"
```

---

## 📍 修改位置快速参考

### 后端配置文件

```
📁 mycursor_java/
  └─ 📁 src/main/resources/
      └─ 📄 application.yml  👈 修改这个文件（第 70-87 行）
```

### 前端配置文件

```
📁 src/
  └─ 📁 services/
      └─ 📄 VersionService.js  👈 修改这个文件（第 94 行）
```

---

## 🧪 测试方法

### 测试1：无需更新

1. 修改后端 `latest: "1.0.1"`
2. 修改前端 `return '1.0.1'`
3. 启动应用
4. ✅ 不应该看到更新提醒

### 测试2：有新版本（可选更新）

1. 修改后端 `latest: "1.1.0"`, `force-update: false`
2. 修改前端 `return '1.0.1'`
3. 启动应用
4. ✅ 应该看到更新提醒对话框，可以关闭

### 测试3：强制更新

1. 修改后端 `latest: "1.1.0"`, `force-update: true`
2. 修改前端 `return '1.0.1'`
3. 启动应用
4. ✅ 应该看到更新提醒对话框，无法关闭

---

## ⚠️ 注意事项

1. **版本号格式** - 必须使用语义化版本号（如 1.0.0）
2. **引号包裹** - YAML 配置中版本号必须用引号包裹：`"1.0.0"` ✅  `1.0.0` ❌
3. **配置生效** - 修改配置后需要重启后端服务
4. **前后端同步** - 发布新版本时记得同时更新前后端版本号
5. **下载地址** - 确保下载地址可访问
6. **谨慎使用强制更新** - 只在紧急情况下使用

---

## 🔄 版本发布流程

### 标准发布流程

```
1. 开发新功能/修复Bug
   ↓
2. 测试完成
   ↓
3. 更新 package.json 版本号（可选）
   ↓
4. 构建前端：npm run build
   ↓
5. 打包应用：npm run build-exe
   ↓
6. 上传到 Gitee/GitHub Releases
   ↓
7. 修改 application.yml 配置：
   - latest: "新版本号"
   - download-url: "新版本下载地址"
   - features: ["更新内容"]
   ↓
8. 修改 VersionService.js：
   - return '新版本号'
   ↓
9. 重启后端服务
   ↓
10. 测试版本检查功能
   ↓
11. 通知用户更新
```

---

## 💡 最佳实践

1. **版本号规范** - 严格遵循语义化版本号规范
2. **详细的更新说明** - 在 features 中清晰列出所有更新内容
3. **使用 emoji** - 让更新内容更直观易读
4. **及时更新** - 发布新版本后立即更新配置
5. **保留历史** - 可以在配置文件中注释历史版本信息
6. **测试优先** - 更新配置后先测试再发布

---

## 📞 问题排查

### Q1: 修改配置后没有生效？

**A:** 需要重启后端服务。Spring Boot 不会自动重载配置文件。

### Q2: 用户看不到更新提醒？

**A:** 检查以下几点：
- 前端版本号是否 < 后端最新版本号
- 后端服务是否正常运行
- 网络是否正常（前端能否访问后端API）

### Q3: 强制更新对话框无法关闭？

**A:** 这是正常的！`force-update: true` 就是要让用户无法关闭对话框，必须更新。

### Q4: 如何查看当前配置？

**A:** 查看后端日志，启动时会输出配置信息。

---

## 📚 相关文档

- [版本检查功能完整指南](./VERSION_CHECK_GUIDE.md)
- [版本检查功能更新说明](./VERSION_CHECK_FEATURE.md)

---

**更新时间：** 2025-01-06  
**文档版本：** 1.0.0

