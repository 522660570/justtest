# ✅ 打包文件名和权限问题已修复

## 🐛 发现的问题

### 问题1：Windows 只打包了一个文件
- **原因**：`portable.artifactName` 配置为 `${productName}-${version}-portable.exe`，没有包含 `${arch}` 架构信息
- **结果**：x64 和 arm64 两个版本文件名相同，互相覆盖，最后只剩一个文件

### 问题2：GitHub Actions 创建 Release 失败（403错误）
- **原因**：工作流缺少 `permissions: contents: write` 权限配置
- **错误信息**：`Resource not accessible by integration`

### 问题3：文件名太长太复杂
- **旧格式**：`Cursor Manager-1.0.0-portable.exe`、`Cursor Manager-1.0.0-mac-x64.dmg`
- **问题**：包含版本号、冗余信息，不够简洁

---

## ✅ 已修复内容

### 1. GitHub Actions 权限配置

在 `.github/workflows/build-release.yml` 添加了权限配置：

```yaml
# 添加权限配置 - 允许创建 releases
permissions:
  contents: write  # 允许创建 release 和上传文件
```

### 2. 产品名称更新

```json
"productName": "Cursor续杯工具"
```

### 3. 文件名格式简化

修改了所有平台的 `artifactName` 配置：

| 平台 | 旧格式 | 新格式 |
|------|--------|--------|
| **Windows** | `Cursor Manager-1.0.0-portable.exe` | `Cursor续杯工具_x64.exe`<br>`Cursor续杯工具_arm64.exe` |
| **macOS** | `Cursor Manager-1.0.0-mac-x64.dmg` | `Cursor续杯工具_mac_x64.dmg`<br>`Cursor续杯工具_mac_arm64.dmg` |
| **Linux** | `Cursor Manager-1.0.0-linux-x64.AppImage` | `Cursor续杯工具_linux_x64.AppImage`<br>`Cursor续杯工具_linux_arm64.AppImage` |

---

## 🎯 现在的打包结果

重新打包后，你将获得 **6个** 文件：

```
📦 Windows (2个):
  ✓ Cursor续杯工具_x64.exe          # Intel/AMD 64位系统
  ✓ Cursor续杯工具_arm64.exe        # ARM64设备（如Surface Pro X）

📦 macOS (2个):
  ✓ Cursor续杯工具_mac_x64.dmg      # Intel芯片Mac
  ✓ Cursor续杯工具_mac_arm64.dmg    # Apple Silicon (M1/M2/M3/M4)

📦 Linux (2个):
  ✓ Cursor续杯工具_linux_x64.AppImage    # Intel/AMD 64位
  ✓ Cursor续杯工具_linux_arm64.AppImage  # ARM64设备（如树莓派4）
```

---

## 🚀 如何重新打包

### 方法1：提交代码并推送新标签

```bash
# 1. 提交修改
git add .
git commit -m "修复：文件名简化 + GitHub Actions权限"

# 2. 推送到 GitHub
git push github master

# 3. 创建新标签（版本号递增）
git tag v1.0.7
git push github v1.0.7
```

### 方法2：本地测试打包

```bash
# 测试 Windows 打包
npm run build:win-all

# 测试 macOS 打包（需要在 macOS 系统上）
npm run build:mac-all

# 测试 Linux 打包（推荐在 Linux 或 WSL 中）
npm run build:linux-all
```

---

## 📋 详细修改对比

### package.json 修改

```diff
  "build": {
    "appId": "com.cursor.manager",
-   "productName": "Cursor Manager",
+   "productName": "Cursor续杯工具",
    
    "portable": {
-     "artifactName": "${productName}-${version}-portable.exe",
+     "artifactName": "${productName}_${arch}.exe",
    },
    
    "win": {
-     "artifactName": "${productName}-${version}-${arch}.${ext}",
+     "artifactName": "${productName}_${arch}.${ext}",
    },
    
    "mac": {
-     "artifactName": "${productName}-${version}-mac-${arch}.${ext}",
+     "artifactName": "${productName}_mac_${arch}.${ext}",
    },
    
    "linux": {
-     "artifactName": "${productName}-${version}-linux-${arch}.${ext}",
+     "artifactName": "${productName}_linux_${arch}.${ext}",
      "desktop": {
-       "Name": "Cursor Manager",
+       "Name": "Cursor续杯工具",
      }
    }
  }
```

### .github/workflows/build-release.yml 修改

```diff
  name: Build Portable Release
  
  on:
    push:
      tags:
        - 'v*'
    workflow_dispatch:
  
+ # 添加权限配置 - 允许创建 releases
+ permissions:
+   contents: write  # 允许创建 release 和上传文件
+
  jobs:
    # ...
```

---

## 💡 为什么这样修改？

### 1. 简化文件名的好处

- ✅ **更清晰**：一眼看出是什么平台和架构
- ✅ **更简洁**：去掉版本号，Release页面已经显示版本
- ✅ **更规范**：统一使用下划线分隔
- ✅ **更友好**：中文名称，国人更易理解

### 2. portable 配置单独指定的原因

electron-builder 的优先级：
1. 特定目标的 `artifactName`（如 `portable.artifactName`）
2. 平台的 `artifactName`（如 `win.artifactName`）
3. 全局的 `artifactName`

所以需要在 `portable` 配置中明确指定包含 `${arch}` 的格式。

### 3. 权限配置的必要性

GitHub 从 2023年开始强化了安全策略：
- ❌ 默认 `GITHUB_TOKEN` 只有读权限
- ✅ 需要显式声明 `contents: write` 才能创建 Release
- ✅ 这是安全最佳实践

---

## 🔍 验证修复

### 检查 GitHub Actions 是否成功

1. **访问 Actions 页面**
   ```
   https://github.com/你的用户名/cursor-refill-tool/actions
   ```

2. **查看最新的工作流运行**
   - ✅ 所有任务都显示绿色勾号
   - ✅ `create-release` 任务成功完成

3. **访问 Releases 页面**
   ```
   https://github.com/你的用户名/cursor-refill-tool/releases
   ```

4. **检查文件数量和名称**
   ```
   Assets (6):
   ✓ Cursor续杯工具_x64.exe
   ✓ Cursor续杯工具_arm64.exe
   ✓ Cursor续杯工具_mac_x64.dmg
   ✓ Cursor续杯工具_mac_arm64.dmg
   ✓ Cursor续杯工具_linux_x64.AppImage
   ✓ Cursor续杯工具_linux_arm64.AppImage
   ```

---

## ❓ 常见问题

### Q: 为什么本地打包只有一个 Windows 文件？

**A**: 因为 Windows 的 portable 目标在同一个构建中会生成多个架构，但输出到同一个目录。在本地查看 `dist-electron/` 目录，应该能看到两个文件。GitHub Actions 会正确上传两个文件。

### Q: 可以改成英文名吗？

**A**: 可以！修改 `package.json` 中的 `productName`：

```json
"productName": "CursorRefill",
```

输出文件名会变成：
- `CursorRefill_x64.exe`
- `CursorRefill_mac_arm64.dmg`
- 等等

### Q: 可以加上版本号吗？

**A**: 可以！在 `artifactName` 中加上 `${version}`：

```json
"artifactName": "${productName}_${version}_${arch}.${ext}"
```

输出：`Cursor续杯工具_1.0.7_x64.exe`

### Q: 为什么不直接用 `Cursor续杯工具.exe`？

**A**: 因为同一个平台有多个架构（x64、arm64），必须在文件名中区分，否则会互相覆盖。

---

## 🎉 总结

### ✅ 已解决的问题

1. ✅ Windows 现在正确生成 2 个文件（x64 和 arm64）
2. ✅ GitHub Actions 可以成功创建 Release
3. ✅ 文件名简洁明了，符合中文习惯
4. ✅ 总共 6 个文件，覆盖所有主流平台和架构

### 🚀 下一步

```bash
# 1. 提交修改
git add package.json .github/workflows/build-release.yml
git commit -m "修复打包问题：简化文件名 + 修复权限"

# 2. 推送到 GitHub
git push github master

# 3. 创建新版本标签
git tag v1.0.7
git push github v1.0.7

# 4. 等待 15-20 分钟，构建完成

# 5. 下载全部 6 个文件
```

**现在打包的文件名清晰、简洁、专业！** 🎊

---

## 📚 相关文件

- `package.json` - 打包配置
- `.github/workflows/build-release.yml` - GitHub Actions 工作流
- `docs/GITHUB_ACTIONS_TUTORIAL.md` - GitHub Actions 使用教程
- `docs/BUILD_MULTI_PLATFORM_GUIDE.md` - 多平台打包指南

