# 🇨🇳 Gitee Go 构建教程（替代方案）

## ⚠️ 重要说明

**Gitee Go** (Gitee 的 CI/CD 服务) 相比 GitHub Actions 有以下限制：

| 功能 | GitHub Actions | Gitee Go |
|------|----------------|----------|
| Windows Runner | ✅ 支持 | ❌ 不支持 |
| macOS Runner | ✅ 支持 | ❌ 不支持 |
| Linux Runner | ✅ 支持 | ✅ 支持 |
| 免费额度 | 无限（公开仓库）| 有限制 |
| 并行任务 | 20+ | 较少 |

**结论**: Gitee Go 只能构建 Linux 平台，**强烈建议使用 GitHub Actions**！

---

## 📋 如果你坚持使用 Gitee

### 方案 1: Gitee + GitHub 双推送（推荐）

同时使用 Gitee 和 GitHub，获得两者的优点：

```bash
# 添加 GitHub 作为第二个远程仓库
git remote add github https://github.com/你的用户名/cursor-refill-tool.git

# 推送到两个平台
git push origin master   # Gitee（代码托管）
git push github master   # GitHub（CI/CD）

# 发布时只需推送标签到 GitHub
git tag v1.0.0
git push github v1.0.0   # 自动触发全平台构建
```

**优点**:
- ✅ Gitee 托管代码（国内访问快）
- ✅ GitHub Actions 构建（全平台支持）
- ✅ 两边代码同步
- ✅ 完全免费

### 方案 2: 只用 Gitee Go（功能受限）

如果你只想用 Gitee，只能构建 Linux：

1. **启用 Gitee Go**:
   - 访问你的 Gitee 仓库
   - 点击 "服务" → "Gitee Go"
   - 开通服务（可能需要实名认证）

2. **配置文件已创建**:
   - `.gitee/workflows/build-release.yml`

3. **推送标签触发**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **只会得到 Linux 安装包**:
   - ✅ Linux AppImage
   - ✅ Linux DEB
   - ✅ Linux RPM
   - ❌ 无 Windows 包
   - ❌ 无 macOS 包

---

## 🎯 推荐方案对比

### 方案 A: 纯 GitHub（最推荐 ⭐⭐⭐⭐⭐）

```bash
# 1. 在 GitHub 创建仓库
# 2. 推送代码
git remote add github https://github.com/你的用户名/cursor-refill-tool.git
git push github master

# 3. 推送标签
git tag v1.0.0
git push github v1.0.0

# 4. 等待 15-30 分钟
# 5. 下载所有平台安装包（30+ 个文件）
```

**优点**: ✅ 全平台 ✅ 免费 ✅ 自动化 ✅ 并行构建  
**缺点**: ⚠️ 需要 GitHub 账号

### 方案 B: Gitee + GitHub（推荐 ⭐⭐⭐⭐）

```bash
# 1. 同时推送到两个平台
git push origin master   # Gitee
git push github master   # GitHub

# 2. 发布时推送到 GitHub
git tag v1.0.0
git push github v1.0.0   # 自动构建全平台
```

**优点**: ✅ 代码在国内 ✅ 构建全平台 ✅ 灵活  
**缺点**: ⚠️ 需要维护两个仓库

### 方案 C: 纯 Gitee Go（不推荐 ⭐⭐）

```bash
git tag v1.0.0
git push origin v1.0.0
```

**优点**: ✅ 只用一个平台  
**缺点**: ❌ 只能构建 Linux ❌ 功能受限

### 方案 D: 本地手动构建（最不推荐 ⭐）

需要准备 3 台机器分别构建...

---

## 📝 快速决策指南

### 我应该选择哪个方案？

**如果你想要全平台支持** → 选择方案 A 或 B（使用 GitHub Actions）

**如果你只需要 Linux** → 选择方案 C（Gitee Go）

**如果你不想用 GitHub** → 本地手动构建（见下文）

---

## 🛠️ 本地手动构建全平台（备选方案）

如果你不想用 CI/CD，可以手动构建：

### Windows 上构建

```bash
# Windows 平台（当前可以直接用）
npm run build:win-all

# Linux 平台（通过 WSL）
wsl
cd /mnt/d/cursor-my/cursor-refill-tool
npm run build:linux-all
```

### macOS 上构建

需要借用或租用一台 Mac：

```bash
# 克隆代码
git clone https://gitee.com/liweizhi66/cursor-refill-tool.git
cd cursor-refill-tool

# 安装依赖
npm install

# 打包 macOS
npm run build:mac-all
```

### 使用云端 macOS（付费）

如果没有 Mac，可以租用：

1. **MacStadium** (macOS 云服务器)
2. **MacinCloud** (按小时付费)
3. **AWS Mac instances** (EC2 Mac 实例)

但这些都需要付费，不如直接用 GitHub Actions...

---

## 💡 我的建议

作为开发者，我强烈建议：

### 🥇 第一选择: GitHub Actions

**理由**:
1. **完全免费** - 公开仓库无限制
2. **真正的全平台** - Windows、macOS、Linux 都支持
3. **自动化** - 推送标签即可，无需人工介入
4. **速度快** - 9 个任务并行执行
5. **可靠** - GitHub 是全球最大的代码托管平台

**操作步骤**: 参考 `GITHUB_ACTIONS_TUTORIAL.md`

### 🥈 第二选择: Gitee + GitHub 双推送

**理由**:
1. 代码托管在 Gitee（国内访问快）
2. CI/CD 用 GitHub（功能强大）
3. 两者互不冲突

**操作步骤**:
```bash
# 1. 添加 GitHub 远程仓库
git remote add github https://github.com/你的用户名/cursor-refill-tool.git

# 2. 日常开发推送到 Gitee
git push origin master

# 3. 发布时推送到 GitHub
git push github master
git tag v1.0.0
git push github v1.0.0
```

### 🥉 第三选择: 本地构建

只在以下情况考虑：
- 不想用 GitHub
- 只需要当前平台
- 只是测试用

---

## 🎓 学习资源

### GitHub Actions 入门

1. **官方文档**: https://docs.github.com/cn/actions
2. **快速开始**: https://docs.github.com/cn/actions/quickstart
3. **示例仓库**: 搜索 "electron github actions"

### 常见问题

**Q: GitHub Actions 真的免费吗？**  
A: 是的！公开仓库完全免费，无限制使用。

**Q: 我的代码会被别人看到吗？**  
A: 公开仓库的代码是公开的。如果需要私有，可以用私有仓库（每月 2000 分钟免费）。

**Q: 构建失败了怎么办？**  
A: 查看 Actions 日志，通常是图标文件缺失。运行 `npm run check-icons` 检查。

**Q: 可以只构建 Windows 吗？**  
A: 可以，编辑工作流文件，注释掉不需要的任务。

---

## 📞 需要帮助？

1. **查看详细教程**: `GITHUB_ACTIONS_TUTORIAL.md`
2. **快速命令参考**: `BUILD_QUICK_REFERENCE.md`
3. **完整打包指南**: `BUILD_MULTI_PLATFORM_GUIDE.md`

---

## 🎉 总结

虽然你现在用的是 Gitee，但我**强烈推荐**：

```bash
# 只需 3 步，就能获得全平台自动化构建：

# 1. 在 GitHub 创建仓库
# 2. 添加远程仓库
git remote add github https://github.com/你的用户名/cursor-refill-tool.git
git push github master

# 3. 推送标签触发构建
git tag v1.0.0
git push github v1.0.0

# 20 分钟后，下载 30+ 个安装包！
```

**这是目前最好的方案！** 🚀

---

**还有疑问？参考完整教程**: `GITHUB_ACTIONS_TUTORIAL.md`

