# 机器码重置功能 - 快速开始

## 🎯 快速使用（3步走）

### 1️⃣ 以管理员身份运行程序

**Windows**：
- 右键点击程序
- 选择 "以管理员身份运行"

> ⚠️ **重要**：没有管理员权限将无法更新Windows注册表！

---

### 2️⃣ 调用重置功能

**在你的Vue组件中**：

```javascript
import CursorService from '@/services/CursorService'

const cursorService = new CursorService()

// 简单调用
async function resetMachine() {
  const result = await cursorService.resetMachineId()
  
  if (result.success) {
    console.log('✅ 成功！新的机器ID:', result.newIds)
  } else {
    console.error('❌ 失败:', result.error)
  }
}

resetMachine()
```

---

### 3️⃣ 查看结果

控制台会输出：

```
🔄 开始完整的机器ID重置流程（参考cursor-free-vip-main）...
✅ 生成新的机器ID集合
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
✅ 机器ID完整重置成功！
```

---

## 🔧 完整示例（推荐）

```vue
<template>
  <el-button 
    type="primary" 
    @click="handleReset"
    :loading="loading"
  >
    重置机器码
  </el-button>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CursorService from '@/services/CursorService'

const cursorService = new CursorService()
const loading = ref(false)

const handleReset = async () => {
  try {
    // 1. 检查管理员权限
    const hasAdmin = await window.electronAPI.checkAdminRights()
    if (!hasAdmin) {
      await ElMessageBox.confirm(
        '没有管理员权限，无法更新Windows注册表，是否继续？',
        '权限警告',
        { type: 'warning' }
      )
    }
    
    // 2. 确认操作
    await ElMessageBox.confirm(
      '确定要重置所有机器ID吗？',
      '确认',
      { type: 'warning' }
    )
    
    loading.value = true
    
    // 3. 执行重置
    const result = await cursorService.resetMachineId()
    
    if (result.success) {
      ElMessage.success('机器码重置成功！')
      console.log('新的机器ID:', result.newIds)
    } else {
      ElMessage.error(`重置失败: ${result.error}`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`操作失败: ${error.message}`)
    }
  } finally {
    loading.value = false
  }
}
</script>
```

---

## 📋 生成的机器ID字段

重置后会生成以下6个字段：

| 字段 | 格式 | 长度 | 存储位置 |
|------|------|------|----------|
| `telemetry.machineId` | 十六进制 | 64字符 | storage.json + SQLite |
| `telemetry.macMachineId` | 十六进制 | 128字符 | storage.json + SQLite |
| `telemetry.devDeviceId` | UUID | 36字符 | storage.json + SQLite + machineId文件 |
| `telemetry.sqmId` | {UUID} | 38字符 | storage.json + SQLite + 注册表 |
| `storage.serviceMachineId` | UUID | 36字符 | storage.json + SQLite |
| `system.machineGuid` | UUID | 36字符 | **仅Windows注册表** ⭐ |

**示例输出**：
```json
{
  "telemetry.machineId": "61757468307c757365725f8937636780d2ae226b8f1d32480dfe81eadf99cdc9",
  "telemetry.macMachineId": "f626410c3e3e4184b36ba51767da9caaf626410c3e3e4184b36ba51767da9caa...",
  "telemetry.devDeviceId": "6b5dc075-62e8-4a84-bf77-3ac0f175ef67",
  "telemetry.sqmId": "{A717627D-A4BC-439C-8B2D-D0277F08E944}",
  "storage.serviceMachineId": "6b5dc075-62e8-4a84-bf77-3ac0f175ef67",
  "system.machineGuid": "3df1c793-e751-47dd-b264-71fc77519f97"
}
```

---

## ❓ 常见问题

### Q: 为什么需要管理员权限？

A: 更新Windows注册表需要管理员权限。具体更新这两个键：
- `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`
- `HKLM\SOFTWARE\Microsoft\SQMClient\MachineId`

### Q: 没有管理员权限会怎样？

A: 
- ✅ storage.json 会正常更新
- ✅ SQLite数据库会正常更新
- ✅ machineId文件会正常更新
- ❌ Windows注册表**不会**更新
- ⚠️ 机器码重置**不完整**

### Q: 如何验证重置成功？

A: 检查控制台输出，应该看到：
```
✅ Windows注册表更新完成 (2/2 个键值)
✅ 机器ID完整重置成功！
```

如果看到：
```
⚠️ 需要管理员权限才能完全重置机器码
```
说明注册表更新失败。

### Q: 是否需要关闭Cursor？

A: **强烈建议**在重置前关闭Cursor，避免文件被锁定。

```javascript
// 推荐的完整流程
async function resetMachineCodeSafely() {
  // 1. 关闭Cursor
  await cursorService.killCursorProcess()
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // 2. 执行重置
  await cursorService.resetMachineId()
  
  // 3. 重启Cursor
  await cursorService.startCursor()
}
```

### Q: 出错怎么办？

A: 程序会自动备份原有数据：
- `machineId.backup` - machineId文件备份
- `storage.json.backup` - storage.json备份

如果重置失败，可以手动恢复这些文件。

---

## 🚀 进阶用法

### 批量操作：重置 + 导入账号

```javascript
async function resetAndImport(accountData) {
  // 1. 关闭Cursor
  await cursorService.killCursorProcess()
  await sleep(3000)
  
  // 2. 重置机器码
  const resetResult = await cursorService.resetMachineId()
  if (!resetResult.success) {
    throw new Error('机器码重置失败')
  }
  
  // 3. 导入账号
  await renewalService.importAccount(accountData)
  
  // 4. 启动Cursor
  await cursorService.startCursor()
  
  return { success: true }
}
```

### 验证重置结果

```javascript
async function verifyReset() {
  // 重置前
  const before = await getCurrentMachineIds()
  
  // 重置
  await cursorService.resetMachineId()
  
  // 重置后
  const after = await getCurrentMachineIds()
  
  // 对比
  const changed = before.machineId !== after.machineId
  console.log(changed ? '✅ 验证通过' : '❌ 验证失败')
}
```

---

## 📚 更多文档

- [完整功能说明](./MACHINE_ID_RESET_COMPLETE.md) - 详细的技术文档
- [使用示例大全](./MACHINE_ID_RESET_EXAMPLE.md) - 各种使用场景
- [修改总结](./MACHINE_ID_RESET_CHANGES_SUMMARY.md) - 开发者文档

---

## ✅ 核心要点

1. **管理员权限**：以管理员身份运行程序
2. **关闭Cursor**：重置前先关闭Cursor
3. **检查结果**：查看控制台确认成功
4. **备份文件**：自动备份，可安全回滚

记住这4点，就能顺利使用机器码重置功能！🎉







