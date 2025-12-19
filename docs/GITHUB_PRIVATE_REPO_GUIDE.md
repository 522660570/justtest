# 🔒 GitHub 私有仓库使用指南

## ❓ 我设置成 Public 别人会看到源码吗？

**是的！** Public 仓库的代码是完全公开的，任何人都能看到。

---

## 💡 解决方案对比

| 方案 | 源码公开 | Actions 额度 | 费用 | 推荐度 |
|------|---------|-------------|------|--------|
| **Private 仓库** | ❌ 不公开 | 2000分钟/月 | 免费 | ⭐⭐⭐⭐⭐ |
| **本地构建** | ❌ 不公开 | - | 免费 | ⭐⭐⭐ |
| **自建 CI/CD** | ❌ 不公开 | 无限 | 服务器成本 | ⭐⭐ |
| **Public 仓库** | ✅ 公开 | 无限 | 免费 | ⭐⭐⭐⭐ |

---

## 🎯 方案一：使用 Private 仓库（强烈推荐）

### ✅ 优点
- ✅ **源码不公开** - 只有你能看到
- ✅ **仍可使用 Actions** - 每月 2000 分钟免费
- ✅ **功能完整** - 和 Public 仓库一样
- ✅ **完全免费** - 个人账号免费

### 📊 2000 分钟够用吗？

**一次全平台构建**：
- Windows (3架构): ~5-8分钟
- macOS (3架构): ~8-12分钟  
- Linux (3架构): ~5-8分钟
- **总计**: ~20-30分钟/次

**每月可以构建**: 2000 ÷ 30 = **约 66 次**！

对于个人项目来说，**完全够用**！

### 🚀 如何使用 Private 仓库

#### 步骤 1: 创建 Private 仓库

1. 访问 https://github.com/new
2. 填写仓库名: `cursor-refill-tool`
3. **选择 Private** ← 关键！
4. 点击 Create repository

#### 步骤 2: 推送代码（和之前一样）

```bash
# 添加远程仓库
git remote add github https://github.com/你的用户名/cursor-refill-tool.git

# 推送代码
git push github master
```

#### 步骤 3: 触发构建（完全一样）

```bash
git tag v1.0.0
git push github v1.0.0
```

#### 步骤 4: 查看构建和下载

1. 访问你的 Private 仓库（只有你能看到）
2. 点击 Actions 查看构建进度
3. 点击 Releases 下载安装包

### 💰 费用说明

| 计划 | 私有仓库 | Actions 分钟数 | 费用 |
|------|---------|---------------|------|
| **Free** | 无限 | 2000分钟/月 | 免费 |
| **Pro** | 无限 | 3000分钟/月 | $4/月 |
| **Team** | 无限 | 3000分钟/月 | $4/用户/月 |

对于个人项目，**Free 计划完全够用**！

### ⚠️ 注意事项

**Release 的可见性**：
- Private 仓库的 Release 默认也是私有的
- 只有你（或你授权的人）能下载安装包

**如果想公开安装包但不公开源码**：
- 可以手动上传到其他平台（如你的网站、Gitee Releases 等）
- 或使用专门的下载服务

---

## 🎯 方案二：本地构建全平台

如果不想用 GitHub，可以本地构建：

### Windows 上

```bash
# 1. Windows 平台
npm run build:win-all

# 2. Linux 平台（通过 WSL）
wsl
cd /mnt/d/cursor-my/cursor-refill-tool
npm run build:linux-all

# 3. macOS 平台
# 需要借用或租用一台 Mac
```

### 缺点
- ❌ 需要多台机器或虚拟机
- ❌ 手动操作，无自动化
- ❌ macOS 打包必须在 Mac 上

---

## 🎯 方案三：混合方案

### 方案 3A：代码在 Gitee，构建在 GitHub Private

```bash
# 源码托管在 Gitee（可以设为私有）
git push origin master

# CI/CD 使用 GitHub Private
git push github master
git tag v1.0.0
git push github v1.0.0
```

**优点**:
- ✅ 主仓库在 Gitee（国内访问快）
- ✅ GitHub Private 不公开源码
- ✅ 仍可使用 Actions

### 方案 3B：只公开发布的安装包

1. GitHub 设为 Private（源码不公开）
2. 构建完成后，手动把安装包上传到：
   - 你的网站
   - Gitee Releases（可以只上传文件，不公开源码）
   - 百度网盘/阿里云盘等

---

## 🎯 方案四：自建 CI/CD

如果你有自己的服务器：

### 使用 Jenkins / GitLab CI / Drone 等

```yaml
# 在自己服务器上运行
# 完全私有，不公开任何内容
```

**缺点**:
- ❌ 需要维护服务器
- ❌ 需要配置复杂
- ❌ macOS 构建仍然需要 Mac 机器

---

## 📊 推荐决策树

### 你是否介意源码公开？

#### ❌ 介意（源码需要保密）

**选择**：GitHub **Private** 仓库 ⭐⭐⭐⭐⭐

**理由**：
- ✅ 源码不公开
- ✅ 免费 2000 分钟/月（够用）
- ✅ 全平台支持
- ✅ 自动化

**操作**：创建仓库时选择 **Private**，其他步骤完全相同

---

#### ✅ 不介意（开源项目）

**选择**：GitHub **Public** 仓库 ⭐⭐⭐⭐⭐

**理由**：
- ✅ 无限 Actions 分钟数
- ✅ 全平台支持
- ✅ 可以接受社区贡献

**操作**：创建仓库时选择 **Public**

---

## 💡 我的建议

### 对于你的项目（Cursor 管理工具）

我建议使用 **GitHub Private 仓库**：

**理由**：
1. **源码不公开** - 避免潜在的法律风险
2. **免费额度足够** - 2000分钟/月完全够用
3. **全平台支持** - Windows + macOS + Linux
4. **完全自动化** - 推送标签即可

### 具体操作

```bash
# 1. 在 GitHub 创建 Private 仓库（选择 Private）
# 2. 准备图标
npm run check-icons
git add build/ && git commit -m "添加图标"

# 3. 推送代码
git remote add github https://github.com/你的用户名/cursor-refill-tool.git
git push github master

# 4. 触发构建
git tag v1.0.0
git push github v1.0.0

# 5. 等待构建完成
# 6. 从 Private Releases 下载安装包
# 7. 分发给用户（上传到你的网站/网盘等）
```

---

## ❓ 常见问题

### Q1: Private 仓库真的免费吗？
**A**: 是的！GitHub Free 计划支持无限私有仓库，每月 2000 分钟 Actions。

### Q2: 2000 分钟用完了怎么办？
**A**: 
- 方案1: 升级到 Pro（$4/月，3000分钟）
- 方案2: 本地构建（免费）
- 方案3: 下个月额度重置

### Q3: 能否公开安装包但不公开源码？
**A**: 可以！构建完成后：
1. 从 Private Releases 下载安装包
2. 手动上传到其他平台（你的网站、Gitee 等）
3. 提供下载链接给用户

### Q4: 如何分享给其他开发者？
**A**: Private 仓库可以邀请协作者：
- Settings → Collaborators → Add people

### Q5: 可以从 Private 转 Public 吗？
**A**: 可以！Settings → Danger Zone → Change visibility

---

## 🔐 最佳实践

### 敏感信息处理

即使是 Private 仓库，也要注意：

```bash
# 1. 不要提交密钥和 Token
# 使用 .gitignore
*.key
*.pem
.env

# 2. 使用 GitHub Secrets
# Settings → Secrets and variables → Actions
# 在工作流中引用: ${{ secrets.MY_SECRET }}
```

### .gitignore 示例

```gitignore
# 敏感信息
.env
*.key
*.pem
config/secrets.js

# 构建产物
dist/
dist-electron/
node_modules/

# 系统文件
.DS_Store
Thumbs.db
```

---

## 📚 相关文档

- [GitHub 定价](https://github.com/pricing)
- [GitHub Actions 计费](https://docs.github.com/zh/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [私有仓库管理](https://docs.github.com/zh/repositories/managing-your-repositorys-settings-and-features)

---

## 🎉 总结

### 推荐方案

**GitHub Private 仓库 + Actions**

```bash
# 创建 Private 仓库
# ↓
# 推送代码
# ↓
# 推送标签触发构建
# ↓
# 下载安装包
# ↓
# 分发给用户
```

**优点**:
- ✅ 源码不公开
- ✅ 全平台自动构建
- ✅ 完全免费（2000分钟/月）
- ✅ 操作简单

**缺点**:
- ⚠️ 有月度额度限制（但足够用）
- ⚠️ Release 默认私有（需要手动分发安装包）

---

**立即开始**：

```bash
# 1. 去 GitHub 创建 Private 仓库
# 2. 运行检查工具
npm run check-icons

# 3. 推送代码
git remote add github https://github.com/你的用户名/cursor-refill-tool.git
git push github master

# 4. 触发构建
git tag v1.0.0
git push github v1.0.0
```

**源码不公开，功能完整，完全免费！** 🔒✨

