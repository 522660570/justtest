# 构建资源目录

## 图标文件

请将应用图标放置在此目录：

- `icon.ico` - Windows图标文件 (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- `icon.png` - 通用PNG图标 (512x512)

## 图标要求

### Windows ICO格式
- 分辨率：256x256, 128x128, 64x64, 48x48, 32x32, 16x16
- 格式：ICO
- 色深：32位（支持透明）

### 如果没有图标

如果您没有现成的图标，可以：

1. **在线生成**：
   - 访问 https://favicon.io/favicon-converter/
   - 上传一个PNG图片
   - 下载生成的ICO文件

2. **使用默认图标**：
   - 如果没有提供图标，electron-builder会使用默认图标
   - 建议提供自定义图标以获得更好的用户体验

3. **创建简单图标**：
   ```bash
   # 使用ImageMagick创建简单图标
   convert -size 256x256 xc:lightblue -fill darkblue -gravity center -pointsize 72 -annotate +0+0 "CM" icon.png
   convert icon.png icon.ico
   ```

## 当前状态

- ❌ `icon.ico` - 未找到，将使用默认图标
- ❌ `icon.png` - 未找到

请添加图标文件以获得更好的应用外观。
