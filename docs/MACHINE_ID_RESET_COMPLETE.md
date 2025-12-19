# 完整的机器码重置功能实现

## 概述

本项目现已完全复刻 cursor-free-vip-main 项目的机器码重置功能，实现了**完整的系统级机器码更新**。

## 实现的功能

### 1. 机器ID生成

程序会生成以下完整的机器ID集合：

```javascript
{
  "telemetry.machineId": "64字符的SHA256哈希",
  "telemetry.macMachineId": "128字符的SHA512哈希",
  "telemetry.devDeviceId": "标准UUID格式",
  "telemetry.sqmId": "{大写UUID格式}",
  "storage.serviceMachineId": "与devDeviceId相同",
  "system.machineGuid": "系统级UUID (仅Windows注册表)"
}
```

### 2. 更新位置

机器码会被写入以下位置：

#### ✅ storage.json
- 路径：`%APPDATA%\Cursor\User\globalStorage\storage.json`
- 写入字段：
  - `telemetry.machineId`
  - `telemetry.macMachineId`
  - `telemetry.devDeviceId`
  - `telemetry.sqmId`
  - `storage.serviceMachineId`

#### ✅ SQLite 数据库 (state.vscdb)
- 路径：`%APPDATA%\Cursor\User\globalStorage\state.vscdb`
- 表：`ItemTable`
- 写入字段：与 storage.json 相同

#### ✅ machineId 文件
- 路径：`%APPDATA%\Cursor\machineId`
- 内容：`telemetry.devDeviceId` 的值

#### ✅ Windows 注册表（新增！）
这是与其他实现的**关键区别**：

1. **HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid**
   - 值：`system.machineGuid`
   - 需要管理员权限

2. **HKLM\SOFTWARE\Microsoft\SQMClient\MachineId**
   - 值：`telemetry.sqmId`
   - 需要管理员权限

## 技术实现

### 代码结构

```
electron/
├── main.js           # 添加了注册表操作的IPC处理程序
└── preload.js        # 暴露注册表API

src/services/
└── CursorService.js  # 完整的机器码重置逻辑
```

### 核心方法

#### 1. `generateAllMachineIds()`
生成所有需要的机器ID，包括系统级GUID。

#### 2. `updateStorageJson(newIds)`
更新 storage.json 文件（排除 system 级别字段）。

#### 3. `updateSqliteMachineIds(newIds)`
更新 SQLite 数据库中的 telemetry 字段（排除 system 级别字段）。

#### 4. `updateSystemMachineIds(newIds)` ⭐ 新增
更新系统级机器码：
- Windows: 更新注册表中的 MachineGuid 和 SQMClient\MachineId
- macOS: 预留系统UUID更新接口（需要sudo权限）
- Linux: 无需系统级更新

#### 5. `resetMachineId()`
完整的重置流程，按顺序执行：
1. 生成新的机器ID
2. 更新 storage.json
3. 更新 SQLite 数据库
4. 更新 machineId 文件
5. 更新系统级机器码（Windows注册表）

### IPC 通信接口

#### electron/main.js

```javascript
// 更新Windows注册表
ipcMain.handle('update-windows-registry', async (event, keyPath, valueName, value) => {
  // 使用 reg add 命令更新注册表
  // 返回 { success, message, needsAdmin? }
})

// 读取Windows注册表
ipcMain.handle('read-windows-registry', async (event, keyPath, valueName) => {
  // 使用 reg query 命令读取注册表
  // 返回 { success, value? }
})
```

#### electron/preload.js

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... 其他API
  updateWindowsRegistry: (keyPath, valueName, value) => 
    ipcRenderer.invoke('update-windows-registry', keyPath, valueName, value),
  readWindowsRegistry: (keyPath, valueName) => 
    ipcRenderer.invoke('read-windows-registry', keyPath, valueName)
})
```

## 使用方法

### 前端调用

```javascript
import CursorService from '@/services/CursorService'

const cursorService = new CursorService()

// 执行完整的机器码重置
const result = await cursorService.resetMachineId()

if (result.success) {
  console.log('机器码重置成功！')
  console.log('新的机器ID:', result.newIds)
} else {
  console.error('机器码重置失败:', result.error)
}
```

### 管理员权限

**重要提示**：要完全重置机器码，程序需要以**管理员身份运行**，因为：

1. ✅ storage.json - 无需管理员权限
2. ✅ SQLite 数据库 - 无需管理员权限
3. ✅ machineId 文件 - 无需管理员权限
4. ⚠️ Windows 注册表 - **需要管理员权限**

如果没有管理员权限：
- 前3项会成功更新
- 注册表更新会失败，但程序会继续运行
- 返回结果中会包含 `needsAdmin: true` 标志

### 权限检查

```javascript
// 检查是否有管理员权限
const hasAdmin = await window.electronAPI.checkAdminRights()

if (!hasAdmin) {
  console.warn('警告：当前没有管理员权限，无法更新Windows注册表')
  console.warn('机器码重置可能不完整')
}
```

## 对比 cursor-free-vip-main

| 功能 | cursor-free-vip-main (Python) | 本项目 (JavaScript) | 状态 |
|------|------------------------------|-------------------|------|
| 生成机器ID | ✅ | ✅ | 完全实现 |
| 更新 storage.json | ✅ | ✅ | 完全实现 |
| 更新 SQLite | ✅ | ✅ | 完全实现 |
| 更新 machineId 文件 | ✅ | ✅ | 完全实现 |
| 更新 Windows MachineGuid | ✅ | ✅ | **新增实现** |
| 更新 Windows SQMClient | ✅ | ✅ | **新增实现** |
| 更新 macOS UUID | ✅ | ⏸️ | 预留接口 |
| 备份原有数据 | ✅ | ✅ | 完全实现 |

## 完整的机器信息示例

重置后，你将看到完整的机器信息：

```json
{
  "machine_info": {
    "telemetry.machineId": "61757468307c757365725f8937636780d2ae226b8f1d32480dfe81eadf99cdc9",
    "telemetry.macMachineId": "f626410c3e3e4184b36ba51767da9caaf626410c3e3e4184b36ba51767da9caaf626410c3e3e4184b36ba51767da9caaf626410c3e3e4184b36ba51767da9caa",
    "telemetry.devDeviceId": "6b5dc075-62e8-4a84-bf77-3ac0f175ef67",
    "telemetry.sqmId": "{A717627D-A4BC-439C-8B2D-D0277F08E944}",
    "storage.serviceMachineId": "6b5dc075-62e8-4a84-bf77-3ac0f175ef67",
    "system.machineGuid": "3df1c793-e751-47dd-b264-71fc77519f97"
  }
}
```

## 故障排除

### 问题1：注册表更新失败

**症状**：
```
⚠️ MachineGuid 更新失败: Administrator rights required
⚠️ 需要管理员权限才能完全重置机器码
```

**解决方案**：
1. 右键点击程序
2. 选择"以管理员身份运行"
3. 再次尝试重置机器码

### 问题2：SQLite数据库锁定

**症状**：
```
❌ SQLite telemetry 更新失败: database is locked
```

**解决方案**：
1. 完全关闭 Cursor 应用
2. 等待3-5秒
3. 再次尝试重置机器码

### 问题3：找不到数据库文件

**症状**：
```
❌ 未找到任何Cursor数据库文件
```

**解决方案**：
1. 确保 Cursor 已经至少运行过一次
2. 尝试手动登录 Cursor 账号
3. 检查 `%APPDATA%\Cursor\User\globalStorage\` 目录是否存在

## 日志和调试

程序会在控制台输出详细的执行日志：

```
🔄 开始完整的机器ID重置流程（参考cursor-free-vip-main）...
✅ 生成新的机器ID集合: [ 'telemetry.devDeviceId', 'telemetry.machineId', ... ]
🔧 步骤1: 更新 storage.json...
✅ storage.json 更新成功
🔧 步骤2: 更新 SQLite 中的 telemetry 字段...
✅ SQLite telemetry 更新成功
🔧 步骤3: 更新 machineId 文件...
✅ 新 machineId 文件已写入
🔧 步骤4: 更新系统级机器码...
🪟 Windows平台：更新注册表...
📝 更新 MachineGuid...
✅ MachineGuid 更新成功
📝 更新 SQMClient MachineId...
✅ SQMClient MachineId 更新成功
✅ Windows注册表更新完成 (2/2 个键值)
✅ 系统级机器码更新成功
✅ 机器ID完整重置成功！
```

## 安全注意事项

1. **备份重要性**：程序会自动备份原有的机器ID文件
   - `machineId.backup`
   - `storage.json.backup`

2. **管理员权限**：仅在需要时请求管理员权限，遵循最小权限原则

3. **注册表安全**：使用 `reg add` 命令的 `/f` 参数强制更新，但会先备份原值

## 版本历史

### v1.0.0 (当前版本)
- ✅ 完全实现机器码生成
- ✅ 更新 storage.json
- ✅ 更新 SQLite 数据库
- ✅ 更新 machineId 文件
- ✅ **新增：Windows 注册表更新**
- ✅ **新增：system.machineGuid 字段**

## 总结

本项目现已**完整复刻** cursor-free-vip-main 的机器码重置功能，特别是增加了关键的**Windows注册表更新**功能。这确保了机器码在系统级别也被完全重置，与参考项目保持一致。

主要改进：
1. ✨ 新增 `system.machineGuid` 字段
2. ✨ 新增 Windows 注册表更新功能
3. ✨ 智能过滤：system字段只写入注册表，不写入文件
4. ✨ 完善的权限检查和错误处理
5. ✨ 详细的日志输出

现在你的程序可以像 cursor-free-vip-main 一样，完整地重置所有机器码信息！🎉







