# 🎨 修改 EXE 文件图标指南

## 📋 概述

本指南将帮助你修改打包出来的 exe 文件的图标。

## 🚀 快速步骤

### 1. 准备图标文件

#### Windows 图标格式要求
- **格式：** `.ico` 文件
- **推荐尺寸：** 256x256 或 512x512
- **必须包含多个尺寸：** 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

#### 如何创建 .ico 文件

**方法 1：在线工具（推荐）**
1. 访问 https://www.favicon-generator.org/ 或 https://icoconvert.com/
2. 上传你的 PNG/JPG 图片（建议1024x1024）
3. 选择生成 `.ico` 格式
4. 下载生成的 `icon.ico` 文件

**方法 2：使用 Photoshop/GIMP**
1. 打开你的图片
2. 调整大小为 512x512 或 256x256
3. 另存为 `.ico` 格式

**方法 3：使用命令行工具**
```bash
# 使用 ImageMagick
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### 2. 创建 build 目录并放置图标

```bash
# 在项目根目录创建 build 文件夹
mkdir build

# 将图标文件复制到 build 目录
# 文件名必须是 icon.ico
```

**目录结构：**
```
cursor-refill-tool/
├── build/
│   └── icon.ico          ⭐ 你的图标文件（必需）
├── package.json
├── electron/
├── src/
└── ...
```

### 3. 配置已完成

我已经帮你在 `package.json` 中添加了图标配置：

```json
{
  "build": {
    "icon": "build/icon.ico",
    "directories": {
      "buildResources": "build"
    },
    "win": {
      "icon": "build/icon.ico"
    }
  }
}
```

### 4. 重新打包

```bash
# 清理旧的构建文件（可选）
rm -rf dist-electron

# 重新打包
npm run build-exe
```

## 📐 图标设计建议

### 设计原则
1. **简洁明了**：图标应该在小尺寸下也清晰可见
2. **高对比度**：确保在不同背景下都能看清
3. **品牌一致**：与你的应用主题相符
4. **避免细节过多**：小尺寸下细节会丢失

### 推荐尺寸
- **源文件：** 1024x1024 PNG（透明背景）
- **Windows ICO：** 包含 16, 32, 48, 64, 128, 256 等多个尺寸
- **任务栏：** 32x32
- **桌面快捷方式：** 48x48 或 64x64
- **高DPI显示：** 256x256

### 颜色建议
- 使用鲜明的颜色，易于识别
- 考虑深色和浅色模式下的显示效果
- 避免使用过于复杂的渐变

## 🔍 验证图标

### 方法 1：查看打包后的文件
```bash
# 打包完成后，exe 文件位置
dist-electron/Cursor Manager-1.0.0-portable.exe
```

在 Windows 资源管理器中右键查看文件属性，检查图标是否正确。

### 方法 2：使用 Resource Hacker
1. 下载 Resource Hacker（免费工具）
2. 打开你的 exe 文件
3. 查看 Icon Group 资源
4. 确认图标已正确嵌入

## 🛠️ 故障排查

### 问题 1：图标没有改变

**可能原因：**
- Windows 图标缓存未刷新
- 图标文件路径错误
- 图标格式不正确

**解决方法：**
```bash
# 1. 清理构建目录
rm -rf dist-electron

# 2. 确认图标文件存在
ls build/icon.ico

# 3. 重新打包
npm run build-exe

# 4. 清除 Windows 图标缓存
# 方法 A：重启资源管理器
# 任务管理器 -> 找到 "Windows 资源管理器" -> 重新启动

# 方法 B：删除图标缓存（需要管理员权限）
# 按 Win+R，输入：
# %localappdata%\IconCache.db
# 删除该文件后重启电脑
```

### 问题 2：图标显示模糊

**原因：** 图标尺寸不够或质量低

**解决方法：**
- 使用更高分辨率的源图片（推荐 1024x1024）
- 确保 .ico 文件包含多个尺寸
- 使用专业工具生成 .ico 文件

### 问题 3：打包失败

**错误信息：** `ENOENT: no such file or directory, open 'build/icon.ico'`

**解决方法：**
```bash
# 确认 build 目录存在
mkdir build

# 确认图标文件存在且命名正确
ls build/icon.ico
```

## 📚 高级配置

### 多平台图标配置

如果需要支持多平台，可以这样配置：

```json
{
  "build": {
    "icon": "build/icon.ico",
    "mac": {
      "icon": "build/icon.icns"
    },
    "win": {
      "icon": "build/icon.ico"
    },
    "linux": {
      "icon": "build/icon.png"
    }
  }
}
```

### NSIS 安装程序图标

如果使用 NSIS 安装程序，还可以配置安装向导的图标：

```json
{
  "build": {
    "nsis": {
      "installerIcon": "build/installer.ico",
      "uninstallerIcon": "build/uninstaller.ico",
      "installerHeaderIcon": "build/icon.ico"
    }
  }
}
```

### 应用内图标

不要忘了在应用窗口中也设置图标：

```javascript
// electron/main.js
const { BrowserWindow } = require('electron');
const path = require('path');

const mainWindow = new BrowserWindow({
  icon: path.join(__dirname, '../build/icon.ico'), // 设置窗口图标
  // ... 其他配置
});
```

## 🎯 推荐工具

### 图标设计工具
- **Figma**：在线设计工具（免费）
- **Inkscape**：矢量图形编辑器（免费）
- **Adobe Illustrator**：专业设计工具
- **Canva**：快速设计工具

### ICO 转换工具
- **IcoFX**：专业的图标编辑器
- **在线转换：** https://icoconvert.com/
- **在线转换：** https://www.favicon-generator.org/
- **Greenfish Icon Editor Pro**：免费开源

### 图标素材网站
- **Flaticon**：https://www.flaticon.com/
- **Icons8**：https://icons8.com/
- **Iconfinder**：https://www.iconfinder.com/
- **Noun Project**：https://thenounproject.com/

## 📝 示例图标

### 创建简单的图标（使用 Canvas）

如果你想用代码生成一个简单的图标：

```html
<!-- 创建一个 HTML 文件 -->
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
</head>
<body>
    <canvas id="canvas" width="512" height="512"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // 绘制背景
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // 绘制文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 200px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', 256, 256);
        
        // 下载图片
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'icon.png';
            a.click();
        });
    </script>
</body>
</html>
```

## ✅ 检查清单

在打包前确认：

- [ ] 创建了 `build` 目录
- [ ] 图标文件命名为 `icon.ico`
- [ ] 图标文件放在 `build/icon.ico`
- [ ] 图标包含多个尺寸（16, 32, 48, 64, 128, 256）
- [ ] `package.json` 中配置了图标路径
- [ ] 清理了旧的构建文件
- [ ] 重新打包应用

## 🎉 完成

现在你可以打包应用了：

```bash
npm run build-exe
```

打包完成后，在 `dist-electron` 目录下找到你的 exe 文件，检查图标是否正确显示！

---

**最后更新：** 2025-10-28  
**适用版本：** electron-builder 24.x


