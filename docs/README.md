# 📚 Cursor Manager 文档索引

本目录包含项目的所有文档和脚本文件。

## 📖 文档列表

### 🚀 快速开始
- [USAGE.md](USAGE.md) - 使用说明
- [BUILD_GUIDE.md](BUILD_GUIDE.md) - 构建指南
- [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) - 故障排查指南

### 🎨 UI 相关
- [ICON_SETUP_GUIDE.md](ICON_SETUP_GUIDE.md) - 图标设置指南
- [ICON_UPDATE_GUIDE.md](ICON_UPDATE_GUIDE.md) - 图标更新完成说明
- [UI_REFRESH_ISSUE_FIX.md](UI_REFRESH_ISSUE_FIX.md) - UI 刷新问题修复

### 🔧 功能实现
- [SESSION_TOKEN_SUPPORT.md](SESSION_TOKEN_SUPPORT.md) - Session Token 支持
- [SESSION_TOKEN_TO_ACCESS_TOKEN_IMPLEMENTATION.md](SESSION_TOKEN_TO_ACCESS_TOKEN_IMPLEMENTATION.md) - Session Token 转 Access Token 实现
- [SYSTEM_NOTICE_INTEGRATION.md](SYSTEM_NOTICE_INTEGRATION.md) - 系统公告集成
- [PURCHASE_FEATURE.md](PURCHASE_FEATURE.md) - 购买功能
- [PURCHASE_SYSTEM_GUIDE.md](PURCHASE_SYSTEM_GUIDE.md) - 购买系统指南

### 🔗 前后端集成
- [FRONTEND_BACKEND_API_INTEGRATION.md](FRONTEND_BACKEND_API_INTEGRATION.md) - 前后端 API 集成
- [FRONTEND_BACKEND_INTEGRATION_FIX.md](FRONTEND_BACKEND_INTEGRATION_FIX.md) - 前后端集成修复
- [FRONTEND_BACKEND_INTEGRATION_TEST.md](FRONTEND_BACKEND_INTEGRATION_TEST.md) - 前后端集成测试

### 🐛 问题修复
- [EXPIRED_LICENSE_FIX.md](EXPIRED_LICENSE_FIX.md) - 过期授权码修复
- [CACHE_CLEAR_GUIDE.md](CACHE_CLEAR_GUIDE.md) - 缓存清理指南
- [DEBUG.md](DEBUG.md) - 调试说明

## 🛠️ 脚本工具

所有脚本文件位于 [`scripts/`](scripts/) 目录：

### 构建脚本
- `build.bat` / `build.sh` - 构建应用程序
- `start.bat` / `start.sh` - 启动应用程序

### 维护脚本
- `check_license_cache.js` - 检查授权缓存
- `clear_cache.js` - 清理缓存
- `optimize-startup.js` - 优化启动
- `test_expired_license.js` - 测试过期授权
- `view-logs.js` - 查看日志

## 📂 目录结构

```
docs/
├── README.md                                          # 本文件
├── scripts/                                           # 所有脚本文件
│   ├── build.bat
│   ├── build.sh
│   ├── start.bat
│   ├── start.sh
│   ├── check_license_cache.js
│   ├── clear_cache.js
│   ├── optimize-startup.js
│   ├── test_expired_license.js
│   └── view-logs.js
├── BUILD_GUIDE.md                                     # 构建指南
├── CACHE_CLEAR_GUIDE.md                              # 缓存清理指南
├── DEBUG.md                                          # 调试说明
├── EXPIRED_LICENSE_FIX.md                            # 过期授权码修复
├── FRONTEND_BACKEND_API_INTEGRATION.md               # 前后端 API 集成
├── FRONTEND_BACKEND_INTEGRATION_FIX.md               # 前后端集成修复
├── FRONTEND_BACKEND_INTEGRATION_TEST.md              # 前后端集成测试
├── ICON_SETUP_GUIDE.md                               # 图标设置指南
├── ICON_UPDATE_GUIDE.md                              # 图标更新说明
├── PURCHASE_FEATURE.md                               # 购买功能
├── PURCHASE_SYSTEM_GUIDE.md                          # 购买系统指南
├── SESSION_TOKEN_SUPPORT.md                          # Session Token 支持
├── SESSION_TOKEN_TO_ACCESS_TOKEN_IMPLEMENTATION.md   # Token 转换实现
├── SYSTEM_NOTICE_INTEGRATION.md                      # 系统公告集成
├── TROUBLESHOOTING_GUIDE.md                          # 故障排查指南
├── UI_REFRESH_ISSUE_FIX.md                           # UI 刷新问题修复
└── USAGE.md                                          # 使用说明
```

## 🔍 快速查找

- **需要构建应用？** → [BUILD_GUIDE.md](BUILD_GUIDE.md)
- **遇到问题？** → [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)
- **想了解使用方法？** → [USAGE.md](USAGE.md)
- **需要清理缓存？** → [CACHE_CLEAR_GUIDE.md](CACHE_CLEAR_GUIDE.md)
- **想自定义图标？** → [ICON_SETUP_GUIDE.md](ICON_SETUP_GUIDE.md)

## 📝 注意事项

- 所有脚本文件已移至 `docs/scripts/` 目录
- 如需运行脚本，请从项目根目录使用相对路径调用
- 例如：`node docs/scripts/clear_cache.js`

---

**文档版本：** 1.0  
**最后更新：** 2025-10-28



