# 调试模式开关说明

## 🔧 如何开启/关闭调试功能

### 📝 修改配置

打开 `package.json`，找到第 7 行：

```json
"debugMode": false,
```

### 🔓 开启调试模式

将 `false` 改为 `true`：

```json
"debugMode": true,
```

**保存后重新运行程序**，即可使用：
- ✅ **F12** - 打开/关闭开发者工具
- ✅ **Ctrl+Shift+D** - 打开机器码调试面板

### 🔒 关闭调试模式（默认）

将 `true` 改为 `false`：

```json
"debugMode": false,
```

**保存后重新运行程序**，调试功能将被禁用：
- ❌ F12 无效
- ❌ Ctrl+Shift+D 无效
- ❌ 右键菜单被禁用

## 🚀 快速切换

### 开发时（需要调试）

```json
{
  "debugMode": true
}
```

### 打包发布时（生产环境）

```json
{
  "debugMode": false
}
```

## 💡 提示

- 修改后需要**重启程序**才能生效
- 打包时建议设置为 `false`
- 开发调试时设置为 `true`

就这么简单！🎉

