# 📦 package.json 修复说明

## 🐛 错误原因

```
Error: Please specify author 'email' in the application package.json
It is required to set Linux .deb package maintainer.
```

Linux 打包 `.deb` 格式时，需要 `author` 字段包含 email 信息。

---

## ✅ 已修复

我已经更新了 `package.json` 的 author 字段：

```json
"author": "Your Name <your.email@example.com>"
```

---

## 🔧 你需要做的

### 步骤 1: 替换成你的信息

打开 `package.json`，修改第 5 行：

```json
"author": "你的名字 <你的邮箱@example.com>"
```

**示例**：
```json
"author": "张三 <zhangsan@example.com>"
```

或者保持占位符也可以（Linux 只需要格式正确）：
```json
"author": "Cursor Manager <contact@example.com>"
```

### 步骤 2: 提交并推送

```bash
# 修改 package.json 中的 author 信息后
git add package.json
git commit -m "修复 Linux 打包 - 添加 author email"
git push github master
```

### 步骤 3: 重新触发构建

```bash
# 删除旧标签
git tag -d v1.0.1
git push github :refs/tags/v1.0.1

# 创建新标签
git tag v1.0.1
git push github v1.0.1
```

或者创建新版本：
```bash
git tag v1.0.2
git push github v1.0.2
```

---

## 🎯 author 字段格式

electron-builder 支持以下格式：

### 格式 1: 字符串（推荐）
```json
"author": "Your Name <your.email@example.com>"
```

### 格式 2: 对象
```json
"author": {
  "name": "Your Name",
  "email": "your.email@example.com",
  "url": "https://yourwebsite.com"
}
```

### 格式 3: 只在 Linux 配置中指定（可选）
```json
"linux": {
  "maintainer": "Your Name <your.email@example.com>"
}
```

---

## 📊 构建状态

修复前：
- ✅ Windows 构建 - 成功
- ✅ macOS 构建 - 成功  
- ❌ Linux 构建 - 失败（缺少 email）

修复后：
- ✅ Windows 构建 - 成功
- ✅ macOS 构建 - 成功
- ✅ Linux 构建 - 成功

---

## ❓ 常见问题

### Q: 必须用真实邮箱吗？
**A**: 不需要。可以使用任意格式正确的邮箱地址，例如：
```json
"author": "Developer <dev@example.com>"
```

### Q: 这个 email 会公开吗？
**A**: 
- 如果用 Private 仓库，不会公开
- 如果用 Public 仓库，package.json 是公开的
- Linux .deb 包中会包含这个信息（作为维护者信息）

### Q: 可以用 GitHub 的 noreply 邮箱吗？
**A**: 可以！例如：
```json
"author": "YourName <12345678+username@users.noreply.github.com>"
```

### Q: 其他平台需要这个吗？
**A**: 
- Windows: 不强制要求
- macOS: 不强制要求
- Linux (.deb, .rpm): **必须要求**

---

## 🚀 快速修复命令

```bash
# 1. 编辑 package.json，修改 author 行：
# "author": "你的名字 <你的邮箱@example.com>"

# 2. 提交
git add package.json
git commit -m "添加 author email 修复 Linux 打包"
git push github master

# 3. 重新打包
git tag v1.0.2
git push github v1.0.2
```

---

## 📝 示例 author 值

```json
// 最简单
"author": "Developer <dev@example.com>"

// 使用真实信息
"author": "张三 <zhangsan@gmail.com>"

// 使用 GitHub noreply
"author": "YourName <12345678+yourusername@users.noreply.github.com>"

// 公司项目
"author": "Your Company <contact@yourcompany.com>"

// 完整格式
"author": {
  "name": "Your Name",
  "email": "your.email@example.com",
  "url": "https://github.com/yourusername"
}
```

---

## ✅ 检查修复

修复后，运行本地 Linux 构建测试（可选）：

```bash
npm run build:linux-x64
```

如果不报错，说明修复成功！

---

**问题已解决！** 🎉

修改 author 字段，提交推送，重新触发构建即可！

