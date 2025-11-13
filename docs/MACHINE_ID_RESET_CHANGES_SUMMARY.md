# 机器码重置功能 - 修改总结

## 问题描述

用户反馈：程序没有成功修改机器码，缺少了完整的系统级机器码更新，特别是Windows注册表中的 `system.machineGuid` 等字段。

参考项目 cursor-free-vip-main 会重写以下字段：
```json
{
  "machine_info": {
    "telemetry.machineId": "...",
    "telemetry.macMachineId": "...",
    "telemetry.devDeviceId": "...",
    "telemetry.sqmId": "...",
    "system.machineGuid": "..."
  }
}
```

## 解决方案

### 1. 添加 Windows 注册表操作功能

#### 文件：`electron/main.js`

**新增 IPC 处理程序**：

```javascript
// 更新Windows注册表
ipcMain.handle('update-windows-registry', async (event, keyPath, valueName, value) => {
  // 使用 reg add 命令更新注册表
  // 支持管理员权限检查
  // 返回 { success, message, needsAdmin? }
})

// 读取Windows注册表
ipcMain.handle('read-windows-registry', async (event, keyPath, valueName) => {
  // 使用 reg query 命令读取注册表
  // 返回 { success, value?, notFound? }
})
```

**位置**：第948-1029行

**功能**：
- 通过 `reg add` 命令更新注册表
- 通过 `reg query` 命令读取注册表
- 自动检测是否需要管理员权限
- 详细的日志记录

---

#### 文件：`electron/preload.js`

**暴露注册表 API**：

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... 其他API
  updateWindowsRegistry: (keyPath, valueName, value) => 
    ipcRenderer.invoke('update-windows-registry', keyPath, valueName, value),
  readWindowsRegistry: (keyPath, valueName) => 
    ipcRenderer.invoke('read-windows-registry', keyPath, valueName)
})
```

**位置**：第41-43行

---

### 2. 完善机器ID生成

#### 文件：`src/services/CursorService.js`

**修改 `generateAllMachineIds()` 方法**：

```javascript
generateAllMachineIds() {
  // ... 原有代码
  const systemMachineGuid = generateUUID()  // 新增
  
  return {
    'telemetry.devDeviceId': devDeviceId,
    'telemetry.machineId': machineId,
    'telemetry.macMachineId': macMachineId,
    'telemetry.sqmId': sqmId,
    'storage.serviceMachineId': devDeviceId,
    'system.machineGuid': systemMachineGuid  // 新增
  }
}
```

**位置**：第558-606行

**改动**：
- ✨ 新增 `system.machineGuid` 字段生成
- ✅ 现在生成6个字段（原来5个）

---

### 3. 添加系统级机器码更新

#### 文件：`src/services/CursorService.js`

**新增 `updateSystemMachineIds()` 方法**：

```javascript
async updateSystemMachineIds(newIds) {
  if (this.platform === 'win32') {
    // 1. 更新 HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid
    const machineGuidResult = await window.electronAPI.updateWindowsRegistry(
      'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
      'MachineGuid',
      newIds['system.machineGuid']
    )
    
    // 2. 更新 HKLM\SOFTWARE\Microsoft\SQMClient\MachineId
    const sqmIdResult = await window.electronAPI.updateWindowsRegistry(
      'HKLM\\SOFTWARE\\Microsoft\\SQMClient',
      'MachineId',
      newIds['telemetry.sqmId']
    )
    
    // 返回更新结果
  }
  // ... macOS 和 Linux 处理
}
```

**位置**：第650-748行

**功能**：
- 🪟 Windows：更新2个注册表键值
  - `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`
  - `HKLM\SOFTWARE\Microsoft\SQMClient\MachineId`
- 🍎 macOS：预留接口（需要sudo权限）
- 🐧 Linux：无需系统级更新
- 🔒 权限检查：自动检测是否需要管理员权限

---

### 4. 修改 storage.json 和 SQLite 更新逻辑

#### 文件：`src/services/CursorService.js`

**修改 `updateStorageJson()` 方法**：

```javascript
async updateStorageJson(newIds) {
  // 过滤出需要写入storage.json的字段（排除system级别的字段）
  const storageIds = {}
  for (const [key, value] of Object.entries(newIds)) {
    if (!key.startsWith('system.')) {
      storageIds[key] = value
    }
  }
  
  // 更新配置
  Object.assign(config, storageIds)
  // ... 写入文件
}
```

**位置**：第620-656行

**改动**：
- ⚡ 智能过滤：`system.` 开头的字段不写入 storage.json
- ✅ 只写入5个 telemetry/storage 字段

---

**修改 `updateSqliteMachineIds()` 方法**：

```javascript
async updateSqliteMachineIds(newIds) {
  // 过滤出需要写入SQLite的字段（排除system级别的字段）
  for (const [key, value] of Object.entries(newIds)) {
    if (!key.startsWith('system.')) {
      // 写入数据库
    }
  }
}
```

**位置**：第758-780行

**改动**：
- ⚡ 智能过滤：`system.` 开头的字段不写入 SQLite
- ✅ 只写入5个 telemetry/storage 字段

---

### 5. 完善 resetMachineId() 流程

#### 文件：`src/services/CursorService.js`

**修改 `resetMachineId()` 方法**：

```javascript
async resetMachineId() {
  // 1. 生成新的所有ID
  const newIds = this.generateAllMachineIds()
  
  // 2. 更新 storage.json
  await this.updateStorageJson(newIds)
  
  // 3. 更新 SQLite 数据库
  await this.updateSqliteMachineIds(newIds)
  
  // 4. 更新 machineId 文件
  await api.fsWriteFile(this.cursorPaths.machineId, newIds['telemetry.devDeviceId'])
  
  // 5. 更新系统级机器码（Windows注册表）⭐ 新增
  const systemUpdateResult = await this.updateSystemMachineIds(newIds)
  if (!systemUpdateResult.success) {
    console.warn('⚠️ 系统级机器码更新失败:', systemUpdateResult.error)
    if (systemUpdateResult.needsAdmin) {
      console.warn('⚠️ 需要管理员权限才能完全重置机器码')
    }
  }
  
  return { success: true, newIds }
}
```

**位置**：第486-556行

**改动**：
- ✨ 新增步骤5：系统级机器码更新
- ⚠️ 权限检查：如果没有管理员权限，会警告但不阻止操作
- ✅ 更完善的错误处理

---

## 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `electron/main.js` | 新增 | 添加注册表操作的IPC处理程序 |
| `electron/preload.js` | 修改 | 暴露注册表API给渲染进程 |
| `src/services/CursorService.js` | 修改 | 完善机器ID生成和更新逻辑 |
| `docs/MACHINE_ID_RESET_COMPLETE.md` | 新建 | 完整功能说明文档 |
| `docs/MACHINE_ID_RESET_EXAMPLE.md` | 新建 | 使用示例文档 |
| `docs/MACHINE_ID_RESET_CHANGES_SUMMARY.md` | 新建 | 修改总结（本文档）|

## 功能对比

### 修改前 ❌

```
✅ 生成5个机器ID
✅ 更新 storage.json (5个字段)
✅ 更新 SQLite (5个字段)
✅ 更新 machineId 文件
❌ 未更新 Windows 注册表
❌ 缺少 system.machineGuid
```

### 修改后 ✅

```
✅ 生成6个机器ID (新增 system.machineGuid)
✅ 更新 storage.json (5个字段，排除system)
✅ 更新 SQLite (5个字段，排除system)
✅ 更新 machineId 文件
✅ 更新 Windows 注册表 (2个键值) ⭐ 新增
✅ 完整的系统级机器码重置
```

## 技术亮点

1. **智能字段过滤**
   - `system.` 字段只写入注册表
   - `telemetry./storage.` 字段写入文件和数据库
   - 避免数据混乱

2. **权限管理**
   - 自动检测管理员权限
   - 无权限时警告但不阻止
   - 用户体验友好

3. **错误处理**
   - 详细的日志输出
   - 每个步骤独立的错误处理
   - 部分失败不影响其他步骤

4. **跨平台支持**
   - Windows: 完整支持
   - macOS: 预留接口
   - Linux: 无需系统级更新

5. **向后兼容**
   - 不影响现有功能
   - API保持一致
   - 渐进式增强

## 测试建议

### 1. 基础功能测试

```javascript
// 测试机器ID生成
const ids = cursorService.generateAllMachineIds()
console.assert(Object.keys(ids).length === 6, '应该生成6个字段')
console.assert(ids['system.machineGuid'], '应该包含system.machineGuid')
```

### 2. 注册表测试（需要管理员权限）

```javascript
// 测试注册表写入
const result = await window.electronAPI.updateWindowsRegistry(
  'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
  'MachineGuid',
  'test-guid-123'
)
console.assert(result.success === true, '注册表写入应该成功')

// 测试注册表读取
const readResult = await window.electronAPI.readWindowsRegistry(
  'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
  'MachineGuid'
)
console.assert(readResult.value === 'test-guid-123', '读取的值应该正确')
```

### 3. 完整流程测试

```javascript
// 完整的机器码重置测试
const resetResult = await cursorService.resetMachineId()
console.assert(resetResult.success === true, '重置应该成功')
console.assert(resetResult.newIds['system.machineGuid'], '应该包含新的system.machineGuid')
```

## 部署注意事项

1. **管理员权限提示**
   - 首次运行时检查权限
   - 提示用户以管理员身份运行
   - 显示功能差异说明

2. **文档更新**
   - 更新用户手册
   - 添加权限说明
   - 提供故障排除指南

3. **版本说明**
   - 在更新日志中说明新功能
   - 提醒用户关于权限要求
   - 提供升级指南

## 后续优化建议

1. **macOS 支持**
   - 实现系统UUID更新
   - 处理sudo权限请求
   - 测试不同macOS版本

2. **权限提升**
   - Windows: UAC自动提升
   - macOS: 使用AppleScript请求sudo
   - 更流畅的用户体验

3. **验证机制**
   - 重置后自动验证
   - 对比重置前后的值
   - 生成验证报告

4. **回滚功能**
   - 保存重置前的完整状态
   - 提供一键回滚功能
   - 备份管理界面

## 总结

本次修改完整实现了 cursor-free-vip-main 项目的机器码重置功能，特别是：

✅ **核心功能**：
- 完整的6字段机器ID生成
- Windows注册表更新
- 系统级机器码重置

✅ **技术改进**：
- 智能字段过滤
- 权限管理
- 错误处理

✅ **用户体验**：
- 详细的日志输出
- 友好的错误提示
- 权限警告

现在你的程序可以完全复刻 cursor-free-vip-main 的机器码重置功能！🎉

## 相关文档

- [完整功能说明](./MACHINE_ID_RESET_COMPLETE.md)
- [使用示例](./MACHINE_ID_RESET_EXAMPLE.md)







