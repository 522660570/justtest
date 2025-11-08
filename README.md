# Cursor Manager - AI账号管理工具

一个基于Vue.js + Electron的Cursor AI账号管理工具，实现自动化的环境检测、账号切换、机器ID重置等功能。

## 💿 支持的平台

本应用支持以下平台和架构：

| 平台 | 架构 | 格式 |
|------|------|------|
| **Windows** | x64, ia32, arm64 | portable, nsis, zip |
| **macOS** | x64 (Intel), arm64 (M1/M2/M3), universal | dmg, zip, pkg |
| **Linux** | x64, arm64, armv7l | AppImage, deb, rpm, tar.gz, snap |

🚀 **一键打包所有平台**: 使用 GitHub Actions 自动化构建

## ✨ 功能特性

### 🔍 环境监控
- **实时状态检测**: 监控Cursor安装状态、进程运行状态
- **系统信息显示**: 显示操作系统信息、机器ID等关键信息
- **路径配置查看**: 展示Cursor相关文件路径配置

### 👥 账号管理
- **多账号支持**: 管理多个Cursor AI账号
- **使用情况监控**: 实时显示每个账号的使用量和限制
- **智能账号选择**: 自动选择使用量最少的可用账号
- **账号验证**: 验证Token有效性

### ⚡ 自动化操作
- **一键重置**: 完整的自动化重置流程
- **机器ID重置**: 生成新的机器标识符
- **账号切换**: 自动替换本地账号信息
- **进程管理**: 自动关闭和启动Cursor

### 📊 操作日志
- **详细记录**: 记录所有操作的详细日志
- **分类显示**: 按成功、错误、警告、信息分类
- **搜索过滤**: 支持关键词搜索和类型筛选

## 🚀 快速开始

### 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器
- 已安装 Cursor AI

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
# 启动Vue开发服务器
npm run dev

# 在新终端中启动Electron（开发模式）
npm run electron-dev

# 或使用便捷脚本（Windows/Linux）
docs\scripts\start.bat   # Windows
docs/scripts/start.sh    # Linux/Mac
```

### 构建生产版本

#### 快速打包（当前平台）
```bash
# Windows 便携版
npm run build-exe

# macOS 通用版
npm run build:mac-universal

# Linux 64位版
npm run build:linux-x64
```

#### 多平台打包
```bash
# 检查图标准备情况
npm run check-icons

# Windows 全架构 (x64, ia32, arm64)
npm run build:win-all

# macOS 全架构 (x64, arm64, universal)
npm run build:mac-all

# Linux 全架构 (x64, arm64, armv7l)
npm run build:linux-all

# 所有平台
npm run build:all-full
```

#### GitHub Actions 自动化（推荐）
```bash
# 创建版本标签（自动触发所有平台构建）
git tag v1.0.0
git push origin v1.0.0
```

📚 **详细文档**:
- [多平台打包完整指南](BUILD_MULTI_PLATFORM_GUIDE.md)
- [快速参考](BUILD_QUICK_REFERENCE.md)
- [配置完成说明](MULTI_PLATFORM_SETUP_COMPLETE.md)

## 📁 项目结构

```
cursor-manager-vue/
├── src/                    # Vue应用源码
│   ├── components/         # Vue组件
│   │   ├── EnvironmentPanel.vue  # 环境监控面板
│   │   ├── AccountPanel.vue      # 账号管理面板
│   │   ├── OperationPanel.vue    # 操作中心面板
│   │   └── LogPanel.vue          # 日志面板
│   ├── services/          # 服务类
│   │   ├── CursorService.js      # Cursor环境管理服务
│   │   └── AccountService.js     # 账号管理服务
│   ├── App.vue            # 主应用组件
│   └── main.js            # 应用入口
├── electron/              # Electron主进程
│   └── main.js            # Electron主进程文件
├── build/                 # 构建资源（图标等）
├── docs/                  # 📚 所有文档和脚本
│   ├── scripts/           # 构建和维护脚本
│   ├── README.md          # 文档索引
│   └── *.md               # 各种说明文档
├── dist/                  # Vue构建输出
├── dist-electron/         # Electron打包输出
├── package.json           # 项目配置
├── vite.config.js         # Vite配置
└── README.md              # 项目说明
```

## 🔧 核心功能说明

### 1. 环境检测
自动检测并显示：
- Cursor安装状态和路径
- 当前运行的进程状态
- 机器ID信息
- 系统平台信息

### 2. 账号管理
- 支持多个账号的统一管理
- 显示每个账号的使用情况和状态
- 自动识别可用账号和受限账号
- 提供账号验证功能

### 3. 自动化流程
完整重置流程包括：
1. 自动选择最佳可用账号
2. 关闭正在运行的Cursor进程
3. 重置机器ID
4. 更新本地账号信息
5. 清理缓存文件
6. 重新启动Cursor

### 4. 操作日志
- 记录所有操作的详细信息
- 支持日志搜索和过滤
- 提供操作统计信息
- 可展开查看详细错误信息

## 🎯 使用说明

### 基本使用流程

1. **启动应用**: 运行应用后会自动检测Cursor环境
2. **查看环境**: 在"环境监控"面板查看当前状态
3. **管理账号**: 在"账号管理"面板查看和选择账号
4. **执行操作**: 在"操作中心"执行重置或切换操作
5. **查看日志**: 在"操作日志"面板查看操作记录

### 推荐操作方式

- **新用户**: 使用"完整重置流程"一键完成所有操作
- **高级用户**: 使用分步操作进行精确控制
- **日常使用**: 主要使用账号切换功能

## ⚠️ 注意事项

1. **管理员权限**: 某些操作需要管理员权限
2. **备份数据**: 操作前建议备份重要数据
3. **关闭Cursor**: 执行操作前请确保Cursor已关闭
4. **网络连接**: 账号验证需要网络连接
5. **合规使用**: 请遵守Cursor的使用条款

## 🛠️ 技术栈

- **前端框架**: Vue.js 3
- **UI组件库**: Element Plus
- **桌面应用**: Electron
- **构建工具**: Vite
- **开发语言**: JavaScript
- **图标库**: Element Plus Icons

## 📝 开发说明

### 添加新功能
1. 在`src/services/`中添加相关服务类
2. 在`src/components/`中创建对应的Vue组件
3. 在`App.vue`中集成新功能

### 账号数据结构
```javascript
{
  id: 1,
  email: 'user@example.com',
  accessToken: 'jwt_token_here',
  refreshToken: 'refresh_token_here',
  user: {
    id: '1',
    name: 'User Name',
    email: 'user@example.com',
    avatar: 'avatar_url'
  },
  expiresAt: timestamp,
  status: 'active', // active, warning, limited
  usage: {
    requests: 245,
    limit: 500
  },
  createdAt: '2024-01-15T08:30:00Z'
}
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📚 文档

所有详细文档已移至 [`docs/`](docs/) 目录，包括：

### 📖 使用指南
- [使用说明](docs/USAGE.md) - 详细的使用教程
- [构建指南](docs/BUILD_GUIDE.md) - 如何构建和打包应用
- [故障排查](docs/TROUBLESHOOTING_GUIDE.md) - 常见问题解决方案

### 🎨 界面定制
- [图标设置指南](docs/ICON_SETUP_GUIDE.md) - 如何自定义应用图标
- [图标更新说明](docs/ICON_UPDATE_GUIDE.md) - 图标更新完成说明

### 🔧 功能文档
- [购买系统指南](docs/PURCHASE_SYSTEM_GUIDE.md) - 完整的购买系统说明
- [Session Token 支持](docs/SESSION_TOKEN_SUPPORT.md) - Session Token 功能说明
- [系统公告集成](docs/SYSTEM_NOTICE_INTEGRATION.md) - 系统公告功能

### 🐛 问题修复
- [前后端集成修复](docs/FRONTEND_BACKEND_INTEGRATION_FIX.md)
- [过期授权码修复](docs/EXPIRED_LICENSE_FIX.md)
- [UI 刷新问题修复](docs/UI_REFRESH_ISSUE_FIX.md)

📂 [查看完整文档列表](docs/README.md)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [Cursor AI 官网](https://www.cursor.com/)
- [Vue.js 官方文档](https://vuejs.org/)
- [Electron 官方文档](https://www.electronjs.org/)
- [Element Plus 官方文档](https://element-plus.org/)

## 📞 支持

如果您遇到任何问题或有建议，请：
1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue
3. 联系开发者

---

**免责声明**: 本工具仅供学习和研究使用，使用者需自行承担使用风险，并遵守相关软件的使用条款。

