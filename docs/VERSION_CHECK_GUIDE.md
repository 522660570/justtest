# 版本控制功能使用指南

## 功能概述

本系统已集成自动版本检查功能，每次启动应用时会自动检查是否有新版本可用。如果检测到新版本，系统会弹出更新提醒，告知用户最新版本的功能和下载地址。

## 功能特性

### 1. 自动版本检查
- ✅ 应用启动时自动检查版本
- ✅ 后台静默检查，不影响正常使用
- ✅ 检查失败时静默处理，不打扰用户

### 2. 美观的更新提醒
- ✅ 弹窗显示新版本信息
- ✅ 列出详细的更新内容
- ✅ 提供一键下载功能
- ✅ 支持"稍后提醒"选项

### 3. 灵活的版本管理
- ✅ 支持语义化版本号（如 1.0.0, 1.1.0, 2.0.0）
- ✅ 自动比较版本号大小
- ✅ 可配置是否强制更新
- ✅ 更新内容由后端返回，方便管理

## 技术实现

### 后端实现

#### API接口

**接口地址：** `GET /checkVersion/{currentVersion}`

**请求参数：**
- `currentVersion` - 当前客户端版本号（如 "1.0.0"）

**响应示例：**

```json
{
  "code": 1,
  "message": "版本检查成功",
  "data": {
    "currentVersion": "1.0.0",
    "latestVersion": "1.1.0",
    "needsUpdate": true,
    "updateInfo": {
      "title": "发现新版本",
      "message": "检测到新版本 v1.1.0，建议更新以获得更好的体验和最新功能！",
      "features": [
        "🎉 新增次卡支持，支持按次数续杯",
        "🚀 优化账号切换速度，提升用户体验",
        "🔧 修复已知问题，提高系统稳定性",
        "✨ 新增版本检查功能，及时获取更新通知"
      ],
      "downloadUrl": "https://github.com/yourusername/cursor-refill-tool/releases/latest",
      "forceUpdate": false
    }
  }
}
```

**配置位置：** `mycursor_java/src/main/java/com/mycursor/api/ApiController.java`

```java
// 最新版本信息（可以配置在配置文件或数据库中）
String latestVersion = "1.1.0";
```

### 前端实现

#### 版本检查服务

**文件位置：** `src/services/VersionService.js`

**主要功能：**
- `checkVersion(currentVersion)` - 检查版本更新
- `compareVersions(v1, v2)` - 比较版本号
- `getCurrentVersion()` - 获取当前版本号

#### 集成位置

**文件位置：** `src/App.vue`

在 `onMounted` 钩子中自动调用版本检查：

```javascript
onMounted(async () => {
  // 并行加载缓存授权码、当前账号信息、系统公告和版本检查
  await Promise.all([
    loadCachedLicense(),
    getCurrentAccount(),
    getSystemNotices(),
    checkForUpdates()    // 版本检查
  ])
})
```

## 使用方法

### 管理员操作

#### 1. 修改最新版本号

编辑后端文件：`mycursor_java/src/main/java/com/mycursor/api/ApiController.java`

找到 `checkVersion` 方法，修改最新版本号：

```java
// 最新版本信息（可以配置在配置文件或数据库中）
String latestVersion = "1.2.0"; // 修改为新版本号
```

#### 2. 自定义更新内容

修改 `updateInfo` 中的内容：

```java
Map<String, Object> updateInfo = new HashMap<>();
updateInfo.put("title", "发现新版本");
updateInfo.put("message", "检测到新版本 v" + latestVersion + "，建议更新以获得更好的体验和最新功能！");
updateInfo.put("features", new String[]{
    "🎉 新功能1",
    "🚀 新功能2",
    "🔧 修复Bug",
    "✨ 性能优化"
});
updateInfo.put("downloadUrl", "https://github.com/yourusername/cursor-refill-tool/releases/latest");
updateInfo.put("forceUpdate", false); // true=强制更新，false=可选更新
```

#### 3. 配置下载地址

修改 `downloadUrl` 为实际的下载地址：

```java
updateInfo.put("downloadUrl", "https://your-download-url.com/latest-version");
```

#### 4. 强制更新模式

如果发现严重安全问题需要强制用户更新：

```java
updateInfo.put("forceUpdate", true); // 启用强制更新
```

强制更新模式下：
- 用户无法关闭更新对话框
- 必须点击"立即下载"才能继续使用

### 用户体验

#### 正常更新流程

1. 用户启动应用
2. 后台自动检查版本（不影响使用）
3. 如果有新版本，弹出更新提醒对话框
4. 用户可以选择：
   - **立即下载** - 打开下载页面
   - **稍后提醒** - 关闭对话框，下次启动再提醒

#### 强制更新流程

1. 用户启动应用
2. 检测到强制更新版本
3. 弹出更新提醒对话框（无法关闭）
4. 用户必须点击"立即下载"才能继续

## 版本号规范

### 语义化版本号

采用 `主版本号.次版本号.修订号` 的格式：

- **主版本号（Major）** - 不兼容的API修改
- **次版本号（Minor）** - 向下兼容的功能性新增
- **修订号（Patch）** - 向下兼容的问题修正

**示例：**
- `1.0.0` - 初始版本
- `1.0.1` - Bug修复
- `1.1.0` - 新增功能
- `2.0.0` - 重大更新

### 版本比较规则

系统会自动比较版本号：

```
1.0.0 < 1.0.1 < 1.1.0 < 2.0.0
```

## 高级配置

### 1. 将版本信息存储到数据库

可以创建一个 `app_version` 表来管理版本信息：

```sql
CREATE TABLE app_version (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version VARCHAR(20) NOT NULL,
    title VARCHAR(100),
    message TEXT,
    features JSON,
    download_url VARCHAR(500),
    force_update TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. 配置文件管理

也可以在 `application.yml` 中配置：

```yaml
app:
  version:
    latest: 1.1.0
    download-url: https://github.com/yourusername/cursor-refill-tool/releases/latest
    force-update: false
```

### 3. 定期检查更新

如果需要在应用运行期间定期检查更新，可以在前端添加定时器：

```javascript
// 每小时检查一次更新
setInterval(() => {
  checkForUpdates()
}, 60 * 60 * 1000)
```

## 注意事项

1. **版本号格式** - 必须使用语义化版本号格式（如 1.0.0）
2. **下载地址** - 确保下载地址可访问
3. **强制更新** - 谨慎使用强制更新功能，避免影响用户体验
4. **更新内容** - 详细列出更新内容，让用户了解更新价值
5. **网络异常** - 版本检查失败时会静默处理，不会打扰用户

## 测试方法

### 1. 测试正常更新提醒

修改后端最新版本号为 `1.1.0`（大于当前版本 `1.0.0`）：

```java
String latestVersion = "1.1.0";
```

重启应用，应该看到更新提醒对话框。

### 2. 测试无需更新

修改后端最新版本号为 `1.0.0`（等于当前版本）：

```java
String latestVersion = "1.0.0";
```

重启应用，不应该看到更新提醒。

### 3. 测试强制更新

修改后端配置：

```java
updateInfo.put("forceUpdate", true);
```

重启应用，更新对话框应该无法关闭。

## 常见问题

### Q1: 版本检查失败怎么办？

A: 版本检查失败时系统会静默处理，不会影响应用正常使用。失败原因可能包括：
- 后端服务未启动
- 网络连接问题
- API接口异常

### Q2: 如何禁用版本检查？

A: 在 `App.vue` 的 `onMounted` 中注释掉版本检查：

```javascript
await Promise.all([
  loadCachedLicense(),
  getCurrentAccount(),
  getSystemNotices(),
  // checkForUpdates()  // 注释掉版本检查
])
```

### Q3: 如何修改当前版本号？

A: 修改 `src/services/VersionService.js` 中的 `getCurrentVersion` 方法：

```javascript
getCurrentVersion() {
  return '1.0.1' // 修改版本号
}
```

更好的做法是从 `package.json` 读取版本号，在构建时注入。

### Q4: 更新对话框样式如何自定义？

A: 修改 `src/App.vue` 中的 CSS 样式：

```css
:deep(.update-dialog) {
  max-width: 540px;
  border-radius: 12px;
  /* 添加自定义样式 */
}
```

## 总结

版本控制功能已完整集成到系统中，可以方便地管理应用版本更新。通过后端配置，可以灵活控制更新提醒的内容和方式，确保用户及时获得最新版本的功能和体验。

