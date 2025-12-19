# Cursor 版本号显示功能

## 功能说明

新增功能：在应用界面上显示当前安装的 Cursor 编辑器的版本号。

## 实现细节

### 1. 主进程 (electron/main.js)

添加了 `get-cursor-version` IPC 处理器，通过以下三种方法尝试获取 Cursor 版本号：

- **方法1**: 通过命令行执行 `cursor --version` 获取版本号
- **方法2**: 通过查找 Cursor 安装目录下的 `package.json` 文件读取版本号
- **方法3**: 通过 Windows 注册表读取版本信息

### 2. 预加载脚本 (electron/preload.js)

在 `electronAPI` 中暴露了 `getCursorVersion()` 方法供渲染进程调用。

### 3. 前端界面 (src/App.vue)

- 添加了 `cursorEditorVersion` 响应式变量存储 Cursor 版本号
- 在应用初始化时调用 API 获取版本号
- 在界面的"当前授权状态"区域显示 Cursor 版本号

## 显示位置

Cursor 版本号显示在应用右侧面板的"当前授权状态"区域，位于：
- **软件版本**下方
- **会员类型**左侧

格式示例：
```
Cursor版本：0.41.3
```

如果无法获取版本号，则显示：
```
Cursor版本：未知
```

## 技术特点

- 支持多种获取方式，提高兼容性
- 异步获取，不影响应用启动速度
- 获取失败时优雅降级，显示"未知"
- 支持 Windows、macOS、Linux 多平台
- 详细的日志输出，便于调试

## 使用场景

- 用户可以快速查看当前安装的 Cursor 编辑器版本
- 排查问题时可以确认 Cursor 版本信息
- 为后续功能（如版本兼容性检查）提供基础



