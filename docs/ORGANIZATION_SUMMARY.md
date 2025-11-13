# 📁 文档和脚本整理说明

## 📋 整理概述

所有说明文档和脚本文件已统一移至 `docs/` 目录，便于管理和查找。

## 🗂️ 新的目录结构

```
cursor-refill-tool/
├── docs/                                    # 📚 所有文档和脚本（新）
│   ├── README.md                            # 文档索引
│   ├── scripts/                             # 🛠️ 所有脚本文件
│   │   ├── build.bat                        # Windows 构建脚本
│   │   ├── build.sh                         # Linux/Mac 构建脚本
│   │   ├── start.bat                        # Windows 启动脚本
│   │   ├── start.sh                         # Linux/Mac 启动脚本
│   │   ├── check_license_cache.js           # 检查授权缓存
│   │   ├── clear_cache.js                   # 清理缓存
│   │   ├── optimize-startup.js              # 优化启动
│   │   ├── test_expired_license.js          # 测试过期授权
│   │   └── view-logs.js                     # 查看日志
│   ├── BUILD_GUIDE.md                       # 构建指南
│   ├── CACHE_CLEAR_GUIDE.md                # 缓存清理指南
│   ├── DEBUG.md                             # 调试说明
│   ├── EXPIRED_LICENSE_FIX.md              # 过期授权码修复
│   ├── FRONTEND_BACKEND_API_INTEGRATION.md # 前后端 API 集成
│   ├── FRONTEND_BACKEND_INTEGRATION_FIX.md # 前后端集成修复
│   ├── FRONTEND_BACKEND_INTEGRATION_TEST.md # 前后端集成测试
│   ├── ICON_SETUP_GUIDE.md                 # 图标设置指南
│   ├── ICON_UPDATE_GUIDE.md                # 图标更新说明
│   ├── PURCHASE_FEATURE.md                 # 购买功能
│   ├── PURCHASE_SYSTEM_GUIDE.md            # 购买系统指南
│   ├── SESSION_TOKEN_SUPPORT.md            # Session Token 支持
│   ├── SESSION_TOKEN_TO_ACCESS_TOKEN_IMPLEMENTATION.md # Token 转换实现
│   ├── SYSTEM_NOTICE_INTEGRATION.md        # 系统公告集成
│   ├── TROUBLESHOOTING_GUIDE.md            # 故障排查指南
│   ├── UI_REFRESH_ISSUE_FIX.md            # UI 刷新问题修复
│   └── USAGE.md                            # 使用说明
├── build/                                   # 构建资源
│   ├── icon.ico                            # 应用图标
│   ├── icon-generator.html                 # 图标生成器
│   └── cover-generator.html                # 封面生成器
├── public/                                  # 静态资源
│   └── icon.ico                            # 应用内图标
├── README.md                                # 项目主文档（保留在根目录）
└── ... 其他项目文件
```

## 📝 移动的文件清单

### 说明文档（17个 .md 文件）

从根目录移至 `docs/`：

- ✅ BUILD_GUIDE.md
- ✅ CACHE_CLEAR_GUIDE.md
- ✅ DEBUG.md
- ✅ EXPIRED_LICENSE_FIX.md
- ✅ FRONTEND_BACKEND_API_INTEGRATION.md
- ✅ FRONTEND_BACKEND_INTEGRATION_FIX.md
- ✅ FRONTEND_BACKEND_INTEGRATION_TEST.md
- ✅ ICON_SETUP_GUIDE.md
- ✅ ICON_UPDATE_GUIDE.md
- ✅ PURCHASE_FEATURE.md
- ✅ PURCHASE_SYSTEM_GUIDE.md
- ✅ SESSION_TOKEN_SUPPORT.md
- ✅ SESSION_TOKEN_TO_ACCESS_TOKEN_IMPLEMENTATION.md
- ✅ SYSTEM_NOTICE_INTEGRATION.md
- ✅ TROUBLESHOOTING_GUIDE.md
- ✅ UI_REFRESH_ISSUE_FIX.md
- ✅ USAGE.md

### 脚本文件（9个）

从根目录移至 `docs/scripts/`：

- ✅ build.bat
- ✅ build.sh
- ✅ start.bat
- ✅ start.sh
- ✅ check_license_cache.js
- ✅ clear_cache.js
- ✅ optimize-startup.js
- ✅ test_expired_license.js
- ✅ view-logs.js

### 保留在根目录的文件

- ✅ README.md - 项目主文档
- ✅ package.json - 包配置
- ✅ vite.config.js - Vite 配置
- ✅ LICENSE - 许可证文件
- ✅ 其他配置文件

## 🔄 路径更新

### 已更新的引用路径

1. **README.md** - 添加了文档索引章节
2. **docs/USAGE.md** - 更新脚本路径引用
3. **docs/BUILD_GUIDE.md** - 更新脚本路径引用

### 脚本调用方式

**从根目录运行：**

```bash
# Windows
docs\scripts\build.bat
docs\scripts\start.bat

# Linux/Mac
./docs/scripts/build.sh
./docs/scripts/start.sh

# Node.js 脚本
node docs/scripts/clear_cache.js
node docs/scripts/view-logs.js
```

## 🎯 优势

### 整理前的问题
- ❌ 文档散落在根目录，难以管理
- ❌ 脚本文件与配置文件混在一起
- ❌ 项目根目录杂乱无章

### 整理后的改进
- ✅ 所有文档集中在 `docs/` 目录
- ✅ 所有脚本集中在 `docs/scripts/` 目录
- ✅ 根目录保持简洁，只保留核心文件
- ✅ 便于查找和维护
- ✅ 新增文档索引，快速定位

## 📖 如何查找文档

### 方法 1：通过索引查找
访问 [docs/README.md](README.md) 查看完整的文档分类索引

### 方法 2：通过主 README 查找
在项目根目录的 [README.md](../README.md) 中查看常用文档链接

### 方法 3：直接浏览目录
在 `docs/` 目录中直接浏览所有文档

## 🔍 文档分类

### 📖 使用类文档
- USAGE.md
- BUILD_GUIDE.md
- TROUBLESHOOTING_GUIDE.md

### 🎨 界面类文档
- ICON_SETUP_GUIDE.md
- ICON_UPDATE_GUIDE.md
- UI_REFRESH_ISSUE_FIX.md

### 🔧 功能类文档
- PURCHASE_SYSTEM_GUIDE.md
- PURCHASE_FEATURE.md
- SESSION_TOKEN_SUPPORT.md
- SESSION_TOKEN_TO_ACCESS_TOKEN_IMPLEMENTATION.md
- SYSTEM_NOTICE_INTEGRATION.md

### 🐛 修复类文档
- EXPIRED_LICENSE_FIX.md
- FRONTEND_BACKEND_INTEGRATION_FIX.md
- FRONTEND_BACKEND_INTEGRATION_TEST.md
- FRONTEND_BACKEND_API_INTEGRATION.md

### 🛠️ 开发类文档
- DEBUG.md
- CACHE_CLEAR_GUIDE.md

## ⚠️ 注意事项

### 如果你有引用旧路径的地方

**旧路径：**
```bash
./build.bat
./start.sh
```

**新路径：**
```bash
./docs/scripts/build.bat
./docs/scripts/start.sh
```

### Git 提交建议

如果你使用 Git 版本控制：

```bash
git add docs/
git commit -m "docs: 整理所有文档和脚本到 docs 目录"
```

## 🎉 总结

通过这次整理：
- ✅ 项目结构更加清晰
- ✅ 文档易于查找和管理
- ✅ 脚本集中存放，便于维护
- ✅ 根目录保持简洁

---

**整理日期：** 2025-10-28  
**版本：** 1.0



