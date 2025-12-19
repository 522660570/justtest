# 前端缓存清理指南

## 🎯 **目标**
清理所有前端缓存，模拟用户首次下载并打开应用的状态。

## 🚀 **自动清理脚本**

### **运行清理脚本**
```bash
# 在项目根目录执行
node clear_cache.js
```

### **脚本清理内容**
- ✅ Vite构建缓存 (`dist/`, `.vite/`)
- ✅ Node.js模块缓存 (`node_modules/.cache/`)
- ✅ Electron构建缓存
- ✅ 项目配置文件 (`config.json`)
- ✅ 系统级Electron用户数据
- ✅ npm缓存

## 🛠️ **手动清理步骤**

### **1. 停止所有服务**
```bash
# 停止前端开发服务器
Ctrl + C

# 停止后端服务
Ctrl + C

# 确保没有Electron进程运行
# Windows: 任务管理器中结束相关进程
# macOS/Linux: killall Electron
```

### **2. 清理项目缓存**
```bash
# 删除构建产物
rm -rf dist/
rm -rf .vite/
rm -rf electron/dist/

# 删除Node.js缓存
rm -rf node_modules/.cache/
rm -rf node_modules/.vite/

# 清理npm缓存
npm cache clean --force
```

### **3. 清理配置文件**
```bash
# 删除应用配置
rm -f config.json
rm -f electron/config.json

# 删除可能的日志文件
rm -f *.log
rm -f logs/*.log
```

### **4. 清理系统级缓存**

#### **Windows**
```powershell
# 删除Electron用户数据
Remove-Item -Recurse -Force "$env:APPDATA\cursor-manager" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\cursor-manager" -ErrorAction SilentlyContinue

# 清理临时文件
Remove-Item -Recurse -Force "$env:TEMP\*cursor*" -ErrorAction SilentlyContinue
```

#### **macOS**
```bash
# 删除Electron用户数据
rm -rf ~/Library/Application\ Support/cursor-manager
rm -rf ~/Library/Caches/cursor-manager
rm -rf ~/Library/Logs/cursor-manager

# 清理临时文件
rm -rf /tmp/*cursor*
```

#### **Linux**
```bash
# 删除Electron用户数据
rm -rf ~/.config/cursor-manager
rm -rf ~/.cache/cursor-manager

# 清理临时文件
rm -rf /tmp/*cursor*
```

### **5. 清理浏览器存储**

#### **Chrome/Edge开发者工具**
1. 打开 `http://localhost:5173`
2. 按 `F12` 打开开发者工具
3. 进入 `Application` 标签
4. 清理以下项目：
   - **Local Storage** → `http://localhost:5173` → Clear All
   - **Session Storage** → `http://localhost:5173` → Clear All
   - **IndexedDB** → Delete all databases
   - **Cookies** → `http://localhost:5173` → Clear All
   - **Cache Storage** → Clear All

#### **Firefox开发者工具**
1. 打开 `http://localhost:5173`
2. 按 `F12` 打开开发者工具
3. 进入 `Storage` 标签
4. 清理所有存储项目

#### **快捷清理**
```javascript
// 在浏览器控制台执行
localStorage.clear();
sessionStorage.clear();
console.log('浏览器存储已清理');
```

### **6. 重新安装依赖**
```bash
# 删除node_modules（可选，彻底清理）
rm -rf node_modules/
rm -f package-lock.json

# 重新安装
npm install
```

## 🔍 **验证清理结果**

### **检查文件系统**
```bash
# 确认缓存目录已删除
ls -la dist/ 2>/dev/null || echo "✅ dist/ 已删除"
ls -la .vite/ 2>/dev/null || echo "✅ .vite/ 已删除"
ls -la config.json 2>/dev/null || echo "✅ config.json 已删除"
```

### **检查应用状态**
启动应用后确认：
- [ ] 没有预填充的授权码
- [ ] 没有缓存的账号信息
- [ ] 界面显示初始状态
- [ ] "当前授权状态" 显示 "未输入"
- [ ] "当前Cursor登录账号" 显示 "未检测到登录账号"

## 🎯 **首次启动测试流程**

### **1. 启动应用**
```bash
# 启动后端服务
cd mycursor_java
mvn spring-boot:run

# 新终端启动前端
cd ..
npm run dev
```

### **2. 验证初始状态**
- ✅ 授权码输入框为空
- ✅ 授权状态显示"未输入"
- ✅ 账号信息显示"未检测到登录账号"
- ✅ 一键续杯按钮为禁用状态

### **3. 测试完整流程**
1. **输入授权码** → 验证真实API调用
2. **查看状态更新** → 确认UI正确显示
3. **点击一键续杯** → 测试账号获取流程
4. **观察日志输出** → 确认使用真实MAC地址

### **4. 监控关键日志**
```
# 前端控制台应显示
🔧 验证授权码: [输入的授权码]
🔍 正在获取设备MAC地址...
✅ 获取真实MAC地址成功: XX:XX:XX:XX:XX:XX

# 后端日志应显示
收到授权码验证请求 - 授权码: [授权码], MAC: XX:XX:XX:XX:XX:XX
```

## 🚨 **注意事项**

### **数据备份**
清理前请备份重要数据：
- 测试用的授权码
- 重要的配置信息
- 数据库备份（如需要）

### **开发环境**
- 确保后端数据库有测试数据
- 确认测试授权码在数据库中存在
- 验证网络连接正常

### **故障恢复**
如果清理后出现问题：
```bash
# 重新安装依赖
npm install

# 重建前端
npm run build

# 检查后端服务状态
curl http://localhost:8080/getAccountUsageStats
```

## ✅ **清理完成标志**

当您看到以下状态时，表示清理成功：
- 🔍 应用启动时没有任何预加载数据
- 🔍 需要重新输入授权码进行验证
- 🔍 界面显示完全的初始状态
- 🔍 控制台没有缓存相关的加载信息
- 🔍 所有操作都调用真实API

现在您可以像新用户一样体验应用的完整流程！🎉
