# 版本控制功能更新说明

## 📋 更新内容

本次更新为前端应用添加了完整的版本控制功能，实现了自动版本检查和更新提醒。

## ✨ 新增功能

### 1. 自动版本检查
- 应用启动时自动检查版本
- 后台静默检查，不影响用户体验
- 检查失败时静默处理，不打扰用户

### 2. 更新提醒对话框
- 美观的更新提醒界面
- 详细的更新内容展示
- 一键下载新版本功能
- 支持"稍后提醒"选项
- 支持强制更新模式（紧急安全更新）

### 3. 灵活的版本管理
- 语义化版本号支持（1.0.0, 1.1.0, 2.0.0）
- 智能版本比较
- 更新内容由后端动态返回
- 支持自定义下载地址

## 📁 文件变更

### 后端变更

#### 1. `mycursor_java/src/main/java/com/mycursor/api/ApiController.java`
- 新增 `checkVersion` API接口
- 新增 `compareVersions` 版本比较方法

**新增接口：**
```
GET /checkVersion/{currentVersion}
```

### 前端变更

#### 1. `src/services/VersionService.js`（新增）
版本检查服务类，提供以下功能：
- `checkVersion()` - 调用后端API检查版本
- `compareVersions()` - 本地版本号比较
- `getCurrentVersion()` - 获取当前版本号

#### 2. `src/App.vue`（修改）
在应用初始化时添加版本检查：
- 导入 `VersionService`
- 新增 `checkForUpdates()` 方法
- 在 `onMounted` 中调用版本检查
- 新增更新对话框样式

#### 3. `docs/VERSION_CHECK_GUIDE.md`（新增）
完整的版本控制功能使用指南文档

## 🚀 使用方法

### 普通用户

启动应用后：
1. 如果检测到新版本，会自动弹出更新提醒
2. 可以选择"立即下载"或"稍后提醒"
3. 点击"立即下载"会打开下载页面

### 管理员配置

#### 方法1：修改代码（临时方案）

编辑 `mycursor_java/src/main/java/com/mycursor/api/ApiController.java`：

```java
// 修改最新版本号
String latestVersion = "1.2.0";

// 自定义更新内容
updateInfo.put("features", new String[]{
    "🎉 你的新功能1",
    "🚀 你的新功能2",
    "🔧 修复的问题",
    "✨ 性能优化"
});

// 修改下载地址
updateInfo.put("downloadUrl", "https://your-url.com/download");

// 是否强制更新
updateInfo.put("forceUpdate", false);
```

#### 方法2：使用配置文件（推荐）

在 `application.yml` 中配置：

```yaml
app:
  version:
    latest: 1.1.0
    download-url: https://github.com/yourusername/releases/latest
    force-update: false
    update-message: 建议更新以获得更好的体验
```

#### 方法3：存储到数据库（最佳）

创建版本管理表，通过后台管理界面管理版本信息。

## 🧪 测试步骤

### 测试1：有新版本提醒

1. 修改后端 `latestVersion = "1.1.0"`
2. 前端当前版本是 `1.0.0`
3. 启动应用
4. ✅ 应该看到更新提醒对话框

### 测试2：无需更新

1. 修改后端 `latestVersion = "1.0.0"`
2. 前端当前版本是 `1.0.0`
3. 启动应用
4. ✅ 不应该看到更新提醒

### 测试3：强制更新

1. 修改后端 `forceUpdate = true`
2. 修改后端 `latestVersion = "1.1.0"`
3. 启动应用
4. ✅ 更新对话框无法关闭，只能点击下载

### 测试4：网络异常

1. 停止后端服务
2. 启动前端应用
3. ✅ 应用正常启动，不应该有错误提示

## 📊 API接口说明

### 检查版本接口

**接口地址：** `GET /checkVersion/{currentVersion}`

**请求示例：**
```
GET http://localhost:8080/checkVersion/1.0.0
```

**响应示例（有更新）：**
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
      "message": "检测到新版本 v1.1.0，建议更新...",
      "features": [
        "🎉 新增次卡支持",
        "🚀 优化账号切换速度",
        "🔧 修复已知问题"
      ],
      "downloadUrl": "https://github.com/.../releases/latest",
      "forceUpdate": false
    }
  }
}
```

**响应示例（无需更新）：**
```json
{
  "code": 1,
  "message": "版本检查成功",
  "data": {
    "currentVersion": "1.0.0",
    "latestVersion": "1.0.0",
    "needsUpdate": false
  }
}
```

## 🎨 界面预览

更新对话框包含：
- 标题："发现新版本"
- 版本信息："检测到新版本 v1.1.0..."
- 更新内容列表（带emoji图标）
- 下载地址链接
- 操作按钮：
  - "立即下载"（主按钮）
  - "稍后提醒"（次要按钮，强制更新时隐藏）

## 🔧 技术细节

### 版本号比较算法

系统使用语义化版本号规范：

```
1.0.0 < 1.0.1 < 1.1.0 < 1.2.0 < 2.0.0
```

比较规则：
1. 先比较主版本号
2. 主版本号相同，比较次版本号
3. 次版本号相同，比较修订号

### 错误处理

- 网络请求失败 → 静默处理，不影响应用启动
- API返回错误 → 静默处理，记录日志
- 版本号解析失败 → 认为版本相同，不提醒更新

### 性能优化

- 版本检查与其他初始化任务并行执行
- 使用 Promise.all 提高启动速度
- 检查失败不阻塞应用启动

## 📝 后续优化建议

1. **从 package.json 读取版本号**
   - 构建时自动注入版本号
   - 避免手动维护版本号

2. **添加版本管理后台**
   - 可视化管理版本信息
   - 支持多版本历史记录
   - 支持A/B测试

3. **增量更新支持**
   - 只下载变更的文件
   - 减少下载时间和流量

4. **更新历史记录**
   - 记录用户的更新历史
   - 分析更新采用率

5. **自动更新**
   - Electron应用可实现自动下载和安装
   - 提升用户体验

## 🐛 已知问题

目前没有已知问题。

## 📞 联系方式

如有问题或建议，请联系开发团队。

## 📄 许可证

本功能遵循项目整体许可证。

---

**更新时间：** 2025-01-06  
**版本：** 1.0.0

