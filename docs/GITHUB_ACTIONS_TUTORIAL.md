# 🚀 GitHub Actions 一键打包全平台教程

## 为什么选择 GitHub Actions？

- ✅ **完全免费** - 公开仓库无限制使用
- ✅ **真正的全平台** - Windows、macOS、Linux 服务器全覆盖
- ✅ **自动化** - 推送标签即自动打包所有平台
- ✅ **并行构建** - 同时打包 9 个任务，速度快
- ✅ **自动发布** - 打包完成自动创建 Release

---

## 📋 完整步骤（保姆级教程）

### 第一步：在 GitHub 创建仓库

1. **访问 GitHub**: https://github.com
2. **登录账号**（如果没有，先注册一个）
3. **点击右上角 "+" → "New repository"**
4. **填写信息**：
   - Repository name: `cursor-refill-tool`
   - Description: `Cursor AI账号管理工具`
   - 选择 **Public**（免费使用 Actions）
   - ❌ 不勾选 "Add a README file"
5. **点击 "Create repository"**

### 第二步：添加 GitHub 远程仓库

在你的项目目录中执行：

```bash
# 添加 GitHub 作为第二个远程仓库
git remote add github https://github.com/你的用户名/cursor-refill-tool.git

# 查看远程仓库列表
git remote -v
```

你会看到：
```
github  https://github.com/你的用户名/cursor-refill-tool.git (fetch)
github  https://github.com/你的用户名/cursor-refill-tool.git (push)
origin  https://gitee.com/liweizhi66/cursor-refill-tool.git (fetch)
origin  https://gitee.com/liweizhi66/cursor-refill-tool.git (push)
```

### 第三步：推送代码到 GitHub

```bash
# 推送所有分支和标签到 GitHub
git push github master

# 如果提示需要认证，使用 GitHub Personal Access Token
# 创建 Token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
```

### 第四步：准备图标文件（重要！）

```bash
# 检查图标准备情况
npm run check-icons
```

**当前状态**：
- ✅ Windows (`icon.ico`) - 已准备好
- ❌ macOS (`icon.icns`) - 需要准备
- ❌ Linux (`icon.png`) - 需要准备

**快速准备**：

1. **macOS 图标 (icon.icns)**:
   - 访问: https://cloudconvert.com/png-to-icns
   - 上传 `build/icon.ico` 或一个 PNG 图片
   - 下载转换后的 `icon.icns`
   - 保存到 `build/icon.icns`

2. **Linux 图标 (icon.png)**:
   - 访问: https://www.aconvert.com/cn/icon/ico-to-png/
   - 上传 `build/icon.ico`
   - 选择输出尺寸: 512 或更大
   - 下载 `icon.png`
   - 保存到 `build/icon.png`

3. **提交图标文件**:
```bash
git add build/icon.icns build/icon.png
git commit -m "添加 macOS 和 Linux 图标"
git push github master
```

### 第五步：触发自动构建

有两种方法：

#### 方法 A：推送版本标签（推荐）

```bash
# 创建版本标签
git tag v1.0.0

# 推送标签到 GitHub（会自动触发构建）
git push github v1.0.0
```

#### 方法 B：手动触发

1. 访问你的 GitHub 仓库
2. 点击顶部 **Actions** 标签
3. 左侧选择 **Build Multi-Platform Release**
4. 右侧点击 **Run workflow** 按钮
5. 选择分支（通常是 `master` 或 `main`）
6. 点击绿色的 **Run workflow** 按钮

### 第六步：等待构建完成

1. **查看进度**:
   - 在 **Actions** 页面可以看到正在运行的工作流
   - 点击工作流名称查看详细日志
   - 大约需要 **15-30 分钟**（9 个任务并行）

2. **构建任务**:
   ```
   ✓ build-windows (x64)      ← Windows 64位
   ✓ build-windows (ia32)     ← Windows 32位
   ✓ build-windows (arm64)    ← Windows ARM
   ✓ build-macos (x64)        ← macOS Intel
   ✓ build-macos (arm64)      ← macOS Apple Silicon
   ✓ build-macos (universal)  ← macOS 通用版
   ✓ build-linux (x64)        ← Linux 64位
   ✓ build-linux (arm64)      ← Linux ARM64
   ✓ build-linux (armv7l)     ← Linux ARM32
   ✓ create-release           ← 创建发布
   ```

### 第七步：下载所有安装包

构建完成后：

1. **访问 Releases 页面**:
   - 点击仓库顶部的 **Releases** 或
   - 直接访问: `https://github.com/你的用户名/cursor-refill-tool/releases`

2. **找到最新的 Release**:
   - 标题: `v1.0.0`
   - 日期: 刚刚创建

3. **下载安装包**:
   ```
   📦 Assets (30+ 个文件):
   
   Windows:
   ✓ Cursor Manager-1.0.0-x64.exe         (64位便携版)
   ✓ Cursor Manager-1.0.0-ia32.exe        (32位便携版)
   ✓ Cursor Manager-1.0.0-arm64.exe       (ARM64便携版)
   ✓ Cursor Manager Setup 1.0.0-x64.exe   (64位安装程序)
   ✓ ...
   
   macOS:
   ✓ Cursor Manager-1.0.0-mac-x64.dmg           (Intel)
   ✓ Cursor Manager-1.0.0-mac-arm64.dmg         (Apple Silicon)
   ✓ Cursor Manager-1.0.0-mac-universal.dmg     (通用版)
   ✓ ...
   
   Linux:
   ✓ Cursor Manager-1.0.0-linux-x64.AppImage    (64位 AppImage)
   ✓ Cursor Manager-1.0.0-linux-x64.deb         (Debian/Ubuntu)
   ✓ Cursor Manager-1.0.0-linux-x64.rpm         (RedHat/Fedora)
   ✓ ...
   ```

---

## 🎯 日常使用流程

### 发布新版本

```bash
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "修复bug / 添加新功能"

# 3. 更新版本号
npm version patch  # 1.0.0 → 1.0.1
# 或
npm version minor  # 1.0.0 → 1.1.0
# 或
npm version major  # 1.0.0 → 2.0.0

# 4. 推送代码和标签
git push github master
git push github --tags

# 5. 等待自动构建（15-30分钟）
# 6. 从 Releases 页面下载所有安装包
```

### 只推送到 GitHub 构建

```bash
# 如果你同时使用 Gitee 和 GitHub
git push origin master          # 推送到 Gitee
git push github master          # 推送到 GitHub
git push github v1.0.0          # 触发 GitHub Actions
```

---

## 🔧 故障排查

### 问题 1: Actions 没有运行

**原因**: 可能仓库是私有的
**解决**: 
- 将仓库设为 Public，或
- 升级到 GitHub Pro（付费）

### 问题 2: 构建失败 - 找不到图标

**原因**: 缺少 `icon.icns` 或 `icon.png`
**解决**:
```bash
npm run check-icons  # 检查缺少哪些图标
# 按提示准备图标文件
git add build/
git commit -m "添加缺失的图标"
git push github master
# 重新运行工作流
```

### 问题 3: macOS 打包失败

**原因**: 代码签名问题
**解决**: 在 `package.json` 中已经禁用了代码签名：
```json
{
  "mac": {
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": null
  }
}
```

如果还有问题，可以临时注释掉 macOS 构建任务。

### 问题 4: 如何查看构建日志？

1. 访问 **Actions** 页面
2. 点击失败的工作流
3. 点击失败的任务（如 `build-macos (x64)`）
4. 展开查看详细日志
5. 搜索 "error" 或 "failed" 定位问题

---

## 💡 高级技巧

### 1. 只构建特定平台

编辑 `.github/workflows/build-release.yml`，注释掉不需要的任务：

```yaml
jobs:
  build-windows:
    # ... 保留

  # build-macos:  # 注释掉 macOS 构建
  #   ...

  build-linux:
    # ... 保留
```

### 2. 构建预发布版本

```bash
# 创建预发布标签
git tag v1.0.0-beta.1
git push github v1.0.0-beta.1
```

然后在工作流中设置 `prerelease: true`

### 3. 添加构建通知

在工作流末尾添加：

```yaml
- name: 发送通知
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '✅ 构建完成！所有平台安装包已发布。'
      })
```

---

## 📊 构建时间和成本

| 项目 | 时间 | 成本 |
|------|------|------|
| Windows 构建 (3个架构) | ~5-8分钟 | 免费 |
| macOS 构建 (3个架构) | ~8-12分钟 | 免费 |
| Linux 构建 (3个架构) | ~5-8分钟 | 免费 |
| 创建 Release | ~1分钟 | 免费 |
| **总计** | **15-30分钟** | **完全免费** |

**GitHub Actions 免费额度**（公开仓库）:
- ✅ 无限分钟数
- ✅ 无限次数
- ✅ 并发任务数: 20

---

## 🎉 成功标志

当你看到：

1. ✅ **Actions** 页面全部显示绿色勾号
2. ✅ **Releases** 页面出现新版本
3. ✅ 能下载到 30+ 个安装包

**恭喜你成功配置了全平台自动化构建！** 🎊

---

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [electron-builder 文档](https://www.electron.build/)
- [本项目完整指南](BUILD_MULTI_PLATFORM_GUIDE.md)

---

## 🆚 对比本地构建

| 方式 | 优点 | 缺点 |
|------|------|------|
| **GitHub Actions** | ✅ 全平台支持<br>✅ 自动化<br>✅ 并行构建<br>✅ 免费 | ⚠️ 需要网络<br>⚠️ 需要等待 |
| **本地构建** | ✅ 即时<br>✅ 无需网络 | ❌ 平台限制<br>❌ 手动操作<br>❌ 需要多台机器 |

**最佳实践**: 
- 开发测试 → 本地构建当前平台
- 正式发布 → GitHub Actions 构建所有平台

---

**现在就开始吧！** 🚀

按照上面的步骤，20 分钟后你就能下载到所有平台的安装包！

