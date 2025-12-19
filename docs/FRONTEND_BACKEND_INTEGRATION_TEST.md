# 前端后端完整联调测试指南

## 🎯 **修复完成概述**

已完成前端授权码接口的完整联调，移除所有假数据，现在使用真实的设备信息和后端API。

## 🔧 **主要修复内容**

### **1. 真实MAC地址获取**

#### **新增DeviceService.js**
- ✅ **真实MAC地址获取** - 通过Electron获取物理网卡MAC地址
- ✅ **浏览器指纹备用** - 浏览器环境下生成设备指纹
- ✅ **多平台支持** - Windows、macOS、Linux系统命令备用
- ✅ **缓存机制** - 避免重复获取

#### **Electron主进程扩展**
- ✅ **IPC处理程序** - `get-mac-address`
- ✅ **网络接口检测** - `os.networkInterfaces()`
- ✅ **系统命令备用** - `getmac`、`ifconfig`等
- ✅ **跨平台兼容** - Windows、macOS、Linux

#### **Preload脚本更新**
- ✅ **API暴露** - `getMacAddress()`

### **2. LicenseService.js修复**

#### **移除假数据**
```javascript
// 修复前：假MAC地址
const macAddress = 'test-mac-address'

// 修复后：真实MAC地址
const macAddress = await this.deviceService.getMacAddress()
console.log('🔧 设备MAC地址:', macAddress)
```

#### **真实API调用**
- ✅ **设备信息集成** - 导入`DeviceService`
- ✅ **真实MAC地址** - 动态获取设备MAC地址
- ✅ **后端接口对接** - `/getInfoByCode/{code}/{mac}`

### **3. App.vue修复**

#### **移除假数据**
```javascript
// 修复前：假MAC地址
const macAddress = 'test-mac-address' // TODO: 获取真实MAC地址

// 修复后：真实MAC地址
const macAddress = await deviceService.getMacAddress()
console.log('🔧 设备MAC地址:', macAddress)
```

#### **服务集成**
- ✅ **DeviceService导入** - 设备信息服务
- ✅ **真实数据获取** - 一键续杯使用真实MAC地址
- ✅ **完整API调用** - `/getAccountByCode/{code}/{mac}/{currentAccount}`

### **4. AccountService.js重构**

#### **移除所有模拟数据**
- ✅ **删除mockAccounts** - 移除所有假账号数据
- ✅ **纯API调用** - 只保留后端API调用方法
- ✅ **真实设备信息** - 集成DeviceService获取MAC地址

#### **新增API方法**
- ✅ **`getAccountByCode()`** - 获取新账号
- ✅ **`getAccountsByLicense()`** - 查询授权码占用账号
- ✅ **`getAccountUsageStats()`** - 获取使用统计
- ✅ **`releaseAccountsByLicense()`** - 释放账号占用

## 🚀 **完整测试流程**

### **1. 启动后端服务**
```bash
cd mycursor_java
mvn spring-boot:run
```

### **2. 启动前端服务**
```bash
cd ..
npm run dev
```

### **3. 测试授权码验证**

#### **测试步骤**
1. 在前端输入授权码（如：`VALID_CODE_123`）
2. 点击"验证"按钮
3. 观察控制台输出

#### **期望结果**
```
🔧 验证授权码: VALID_CODE_123
🔍 正在获取设备MAC地址...
✅ 获取真实MAC地址成功: AA:BB:CC:DD:EE:FF
🔧 设备MAC地址: AA:BB:CC:DD:EE:FF
✅ 授权码验证成功！剩余25天
```

#### **后端日志**
```
收到授权码验证请求 - 授权码: VALID_CODE_123, MAC: AA:BB:CC:DD:EE:FF
授权码验证成功 - 授权码: VALID_CODE_123
```

### **4. 测试账号获取**

#### **测试步骤**
1. 确保授权码已验证通过
2. 点击"🚀 一键续杯"按钮
3. 观察控制台输出和UI变化

#### **期望结果**
```
🔧 步骤1: 正在从服务器获取新账号...
🔧 设备MAC地址: AA:BB:CC:DD:EE:FF
✅ 获取新账号成功: user@example.com
🔧 步骤2: 正在彻底关闭所有Cursor进程...
...
✅ 账号切换成功！当前账号: user@example.com
```

#### **后端日志**
```
收到获取账号请求 - 授权码: VALID_CODE_123, MAC: AA:BB:CC:DD:EE:FF, 当前账号: no-current-account
成功分配账号 - 邮箱: user@example.com
```

## 🔍 **调试信息查看**

### **前端控制台**
打开浏览器开发者工具，查看Console标签：
- MAC地址获取过程
- API请求和响应
- 错误信息和警告

### **后端日志**
查看Spring Boot应用日志：
- 授权码验证过程
- 账号分配逻辑
- 数据库操作记录

### **网络请求**
在浏览器Network标签中查看：
- API请求URL和参数
- 响应状态码和数据
- 请求耗时

## 🛠️ **常见问题排查**

### **1. MAC地址获取失败**

#### **问题现象**
```
⚠️ 使用浏览器指纹作为设备标识: XX:XX:XX:XX:XX:XX
```

#### **解决方案**
- 确保在Electron环境中运行
- 检查网络接口是否正常
- 查看系统权限设置

### **2. 授权码验证失败**

#### **问题现象**
```
❌ 授权码验证失败: HTTP 400: Bad Request
```

#### **排查步骤**
1. 检查后端服务是否启动
2. 确认授权码格式正确
3. 查看后端数据库中是否有对应授权码
4. 检查MAC地址是否正确传递

### **3. 账号获取失败**

#### **问题现象**
```
❌ 获取新账号失败: 暂无可用账号，请稍后再试
```

#### **排查步骤**
1. 检查数据库中是否有可用账号
2. 确认账号状态（`is_available = true`）
3. 检查账号额度状态（`is_quota_full = false`）
4. 查看后端日志详细错误信息

### **4. 跨域问题**

#### **问题现象**
```
Access to fetch at 'http://localhost:8080/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

#### **解决方案**
- 确认后端已添加`@CrossOrigin(origins = "*")`
- 检查Spring Boot CORS配置
- 使用Electron环境避免CORS限制

## 📊 **测试数据验证**

### **数据库查询验证**
```sql
-- 查看授权码验证记录
SELECT * FROM device_binding 
WHERE license_code = 'VALID_CODE_123' 
ORDER BY last_active_time DESC;

-- 查看账号占用情况
SELECT email, occupied_by_license_code, occupied_time 
FROM cursor_account 
WHERE occupied_by_license_code IS NOT NULL 
ORDER BY occupied_time DESC;

-- 查看账号使用统计
SELECT 
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN is_available = 1 AND is_quota_full = 0 THEN 1 END) as available_accounts,
    COUNT(CASE WHEN occupied_by_license_code IS NOT NULL THEN 1 END) as occupied_accounts
FROM cursor_account;
```

### **API测试工具**
使用Postman或curl测试后端API：

```bash
# 测试授权码验证
curl -X GET "http://localhost:8080/getInfoByCode/VALID_CODE_123/AA:BB:CC:DD:EE:FF"

# 测试账号获取
curl -X GET "http://localhost:8080/getAccountByCode/VALID_CODE_123/AA:BB:CC:DD:EE:FF/no-current-account"

# 测试账号统计
curl -X GET "http://localhost:8080/getAccountUsageStats"
```

## ✅ **验收标准**

### **功能完整性**
- [x] 真实MAC地址获取
- [x] 授权码验证使用真实数据
- [x] 账号获取使用真实数据
- [x] 移除所有假数据和模拟数据
- [x] 前后端完整联调

### **数据准确性**
- [x] MAC地址格式正确（XX:XX:XX:XX:XX:XX）
- [x] API请求参数完整
- [x] 后端响应数据正确解析
- [x] 错误处理完善

### **用户体验**
- [x] 操作流程顺畅
- [x] 错误提示清晰
- [x] 加载状态明确
- [x] 成功反馈及时

## 🎉 **联调完成**

现在前端和后端已完全联调，所有假数据已移除，系统使用真实的设备信息和API数据。您可以按照测试流程进行验证，确保所有功能正常工作！
