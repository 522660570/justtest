# 机器码重置功能使用示例

## 基础使用

### 示例1：简单的机器码重置

```javascript
import CursorService from '@/services/CursorService'

const cursorService = new CursorService()

// 执行机器码重置
async function resetMachineCode() {
  console.log('开始重置机器码...')
  
  const result = await cursorService.resetMachineId()
  
  if (result.success) {
    console.log('✅ 机器码重置成功！')
    console.log('新的机器ID:', result.newIds)
    
    // 显示生成的机器ID
    Object.entries(result.newIds).forEach(([key, value]) => {
      console.log(`${key}: ${value}`)
    })
  } else {
    console.error('❌ 机器码重置失败:', result.error)
  }
}

resetMachineCode()
```

### 示例2：带权限检查的完整流程

```javascript
import CursorService from '@/services/CursorService'
import { ElMessage, ElMessageBox } from 'element-plus'

const cursorService = new CursorService()

async function resetMachineCodeWithPermissionCheck() {
  try {
    // 1. 检查管理员权限
    const hasAdmin = await window.electronAPI.checkAdminRights()
    
    if (!hasAdmin) {
      const confirmResult = await ElMessageBox.confirm(
        '检测到当前没有管理员权限，将无法更新Windows注册表。\n' +
        '机器码重置可能不完整。\n\n' +
        '是否继续？',
        '权限不足警告',
        {
          confirmButtonText: '继续重置',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      if (confirmResult !== 'confirm') {
        ElMessage.info('已取消机器码重置')
        return
      }
    }
    
    // 2. 检查Cursor进程
    const processStatus = await cursorService.checkCursorProcess()
    
    if (processStatus.running) {
      await ElMessageBox.confirm(
        'Cursor正在运行，需要先关闭才能重置机器码',
        '提示',
        {
          confirmButtonText: '关闭Cursor并继续',
          cancelButtonText: '取消',
          type: 'info'
        }
      )
      
      // 关闭Cursor
      ElMessage.info('正在关闭Cursor...')
      await cursorService.killCursorProcess()
      
      // 等待进程完全关闭
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    
    // 3. 执行机器码重置
    ElMessage.info('正在重置机器码...')
    const result = await cursorService.resetMachineId()
    
    if (result.success) {
      // 4. 显示成功结果
      let message = '机器码重置成功！\n\n'
      message += '新的机器ID:\n'
      
      Object.entries(result.newIds).forEach(([key, value]) => {
        const shortValue = value.length > 30 ? value.substring(0, 30) + '...' : value
        message += `\n${key}:\n  ${shortValue}`
      })
      
      await ElMessageBox.alert(message, '重置成功', {
        confirmButtonText: '确定',
        type: 'success'
      })
      
      // 5. 询问是否重启Cursor
      const restartResult = await ElMessageBox.confirm(
        '是否现在重启Cursor？',
        '提示',
        {
          confirmButtonText: '重启',
          cancelButtonText: '稍后',
          type: 'info'
        }
      )
      
      if (restartResult === 'confirm') {
        ElMessage.info('正在启动Cursor...')
        await cursorService.startCursor()
        ElMessage.success('Cursor已启动')
      }
    } else {
      ElMessage.error(`机器码重置失败: ${result.error}`)
    }
    
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error(`操作失败: ${error.message}`)
  }
}

// 导出函数
export { resetMachineCodeWithPermissionCheck }
```

### 示例3：Vue组件中使用

```vue
<template>
  <div class="machine-reset-panel">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>机器码重置</span>
          <el-tag v-if="hasAdmin" type="success">管理员权限</el-tag>
          <el-tag v-else type="warning">普通权限</el-tag>
        </div>
      </template>
      
      <div class="content">
        <el-alert
          v-if="!hasAdmin"
          title="权限提示"
          type="warning"
          description="当前没有管理员权限，无法更新Windows注册表。建议以管理员身份运行程序。"
          show-icon
          :closable="false"
          style="margin-bottom: 20px;"
        />
        
        <el-button
          type="primary"
          :loading="loading"
          :disabled="cursorRunning"
          @click="handleReset"
        >
          {{ loading ? '重置中...' : '重置机器码' }}
        </el-button>
        
        <el-alert
          v-if="cursorRunning"
          title="Cursor正在运行"
          type="info"
          description="请先关闭Cursor，或点击下方按钮强制关闭"
          show-icon
          style="margin-top: 20px;"
        >
          <el-button size="small" @click="handleKillCursor">
            强制关闭Cursor
          </el-button>
        </el-alert>
        
        <div v-if="lastResetResult" class="result-info">
          <h4>上次重置结果:</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item
              v-for="(value, key) in lastResetResult"
              :key="key"
              :label="key"
            >
              {{ value.substring(0, 40) }}{{ value.length > 40 ? '...' : '' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CursorService from '@/services/CursorService'

const cursorService = new CursorService()

const loading = ref(false)
const hasAdmin = ref(false)
const cursorRunning = ref(false)
const lastResetResult = ref(null)

// 检查管理员权限
onMounted(async () => {
  hasAdmin.value = await window.electronAPI.checkAdminRights()
  await checkCursorStatus()
})

// 检查Cursor运行状态
const checkCursorStatus = async () => {
  const status = await cursorService.checkCursorProcess()
  cursorRunning.value = status.running
}

// 关闭Cursor
const handleKillCursor = async () => {
  try {
    loading.value = true
    ElMessage.info('正在关闭Cursor...')
    await cursorService.killCursorProcess()
    await new Promise(resolve => setTimeout(resolve, 2000))
    await checkCursorStatus()
    ElMessage.success('Cursor已关闭')
  } catch (error) {
    ElMessage.error(`关闭失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 重置机器码
const handleReset = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      '此操作将重置所有机器ID，包括：\n' +
      '• storage.json\n' +
      '• SQLite数据库\n' +
      '• machineId文件\n' +
      (hasAdmin.value ? '• Windows注册表\n' : '') +
      '\n是否继续？',
      '确认重置',
      {
        confirmButtonText: '确认重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    // 执行重置
    const result = await cursorService.resetMachineId()
    
    if (result.success) {
      lastResetResult.value = result.newIds
      
      ElMessage.success('机器码重置成功！')
      
      // 询问是否重启Cursor
      const restartConfirm = await ElMessageBox.confirm(
        '机器码已重置成功，是否立即启动Cursor？',
        '重置成功',
        {
          confirmButtonText: '启动Cursor',
          cancelButtonText: '稍后',
          type: 'success'
        }
      )
      
      if (restartConfirm === 'confirm') {
        await cursorService.startCursor()
        ElMessage.success('Cursor已启动')
      }
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

<style scoped>
.machine-reset-panel {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.content {
  padding: 10px;
}

.result-info {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.result-info h4 {
  margin-bottom: 15px;
  color: #409eff;
}
</style>
```

## 高级用法

### 示例4：批量操作 - 重置并导入账号

```javascript
import CursorService from '@/services/CursorService'
import RenewalService from '@/services/RenewalService'

async function resetAndImportAccount(accountData) {
  const cursorService = new CursorService()
  const renewalService = new RenewalService()
  
  try {
    // 1. 关闭Cursor
    console.log('步骤1: 关闭Cursor...')
    await cursorService.killCursorProcess()
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 2. 重置机器码
    console.log('步骤2: 重置机器码...')
    const resetResult = await cursorService.resetMachineId()
    if (!resetResult.success) {
      throw new Error(`机器码重置失败: ${resetResult.error}`)
    }
    console.log('✅ 机器码重置成功')
    
    // 3. 导入账号
    console.log('步骤3: 导入账号...')
    const importResult = await renewalService.importAccount(accountData)
    if (!importResult.success) {
      throw new Error(`账号导入失败: ${importResult.message}`)
    }
    console.log('✅ 账号导入成功')
    
    // 4. 启动Cursor
    console.log('步骤4: 启动Cursor...')
    await cursorService.startCursor()
    console.log('✅ Cursor已启动')
    
    return {
      success: true,
      message: '重置并导入成功',
      newMachineIds: resetResult.newIds,
      accountEmail: accountData.email
    }
  } catch (error) {
    console.error('操作失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 使用示例
const accountData = {
  email: 'user@example.com',
  accessToken: 'eyJ0eXAi...',
  refreshToken: 'eyJ0eXAi...',
  signUpType: 'Auth0'
}

resetAndImportAccount(accountData)
  .then(result => {
    if (result.success) {
      console.log('✅ 全部完成！')
      console.log('邮箱:', result.accountEmail)
    }
  })
```

### 示例5：验证机器码重置

```javascript
async function verifyMachineIdReset() {
  const cursorService = new CursorService()
  
  // 1. 获取当前机器ID（重置前）
  const beforeIds = await getCurrentMachineIds()
  console.log('重置前的机器ID:', beforeIds)
  
  // 2. 执行重置
  const resetResult = await cursorService.resetMachineId()
  
  if (!resetResult.success) {
    console.error('重置失败:', resetResult.error)
    return false
  }
  
  // 3. 等待一下确保写入完成
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 4. 获取重置后的机器ID
  const afterIds = await getCurrentMachineIds()
  console.log('重置后的机器ID:', afterIds)
  
  // 5. 验证是否真的改变了
  let changedCount = 0
  const keys = ['telemetry.machineId', 'telemetry.devDeviceId', 'telemetry.macMachineId']
  
  for (const key of keys) {
    if (beforeIds[key] !== afterIds[key]) {
      console.log(`✅ ${key} 已改变`)
      changedCount++
    } else {
      console.warn(`⚠️ ${key} 未改变`)
    }
  }
  
  const success = changedCount === keys.length
  console.log(success ? '✅ 验证通过：所有机器ID都已改变' : '❌ 验证失败：部分机器ID未改变')
  
  return success
}

// 辅助函数：获取当前机器ID
async function getCurrentMachineIds() {
  const cursorService = new CursorService()
  await cursorService.initialize()
  
  const ids = {}
  
  // 从storage.json读取
  try {
    const content = await window.electronAPI.fsReadFile(
      cursorService.cursorPaths.storage,
      'utf8'
    )
    const data = JSON.parse(content)
    ids['telemetry.machineId'] = data['telemetry.machineId']
    ids['telemetry.devDeviceId'] = data['telemetry.devDeviceId']
    ids['telemetry.macMachineId'] = data['telemetry.macMachineId']
  } catch (error) {
    console.warn('读取storage.json失败:', error.message)
  }
  
  return ids
}
```

## API 参考

### CursorService 方法

#### `resetMachineId()`
重置所有机器ID

**返回值**:
```typescript
{
  success: boolean
  newIds?: {
    'telemetry.machineId': string
    'telemetry.macMachineId': string
    'telemetry.devDeviceId': string
    'telemetry.sqmId': string
    'storage.serviceMachineId': string
    'system.machineGuid': string
  }
  message?: string
  error?: string
}
```

#### `generateAllMachineIds()`
生成新的机器ID（不写入）

**返回值**:
```typescript
{
  'telemetry.machineId': string       // 64字符
  'telemetry.macMachineId': string    // 128字符
  'telemetry.devDeviceId': string     // UUID
  'telemetry.sqmId': string           // {UUID}
  'storage.serviceMachineId': string  // UUID
  'system.machineGuid': string        // UUID
}
```

#### `updateSystemMachineIds(newIds)`
仅更新系统级机器码（Windows注册表）

**参数**:
- `newIds`: 包含所有机器ID的对象

**返回值**:
```typescript
{
  success: boolean
  message?: string
  updatedCount?: number
  needsAdmin?: boolean
  error?: string
}
```

### ElectronAPI 方法

#### `window.electronAPI.updateWindowsRegistry(keyPath, valueName, value)`
更新Windows注册表

**参数**:
- `keyPath`: 注册表键路径，如 `'HKLM\\SOFTWARE\\Microsoft\\Cryptography'`
- `valueName`: 值名称，如 `'MachineGuid'`
- `value`: 要写入的值

**返回值**:
```typescript
{
  success: boolean
  message?: string
  needsAdmin?: boolean
  error?: string
}
```

#### `window.electronAPI.readWindowsRegistry(keyPath, valueName)`
读取Windows注册表

**返回值**:
```typescript
{
  success: boolean
  value?: string
  notFound?: boolean
  error?: string
}
```

## 最佳实践

1. **总是检查管理员权限**：在执行重置前检查权限，并提示用户
2. **关闭Cursor后操作**：确保Cursor完全关闭后再重置，避免文件锁定
3. **保留备份**：程序会自动备份，不要删除 `.backup` 文件
4. **验证结果**：重置后验证机器ID确实改变了
5. **日志记录**：保留控制台输出，便于调试

## 常见错误处理

```javascript
try {
  const result = await cursorService.resetMachineId()
  
  if (!result.success) {
    // 根据不同错误类型处理
    if (result.error.includes('Administrator rights required')) {
      ElMessage.warning('需要管理员权限来更新注册表')
    } else if (result.error.includes('database is locked')) {
      ElMessage.warning('数据库被锁定，请关闭Cursor后重试')
    } else {
      ElMessage.error(`重置失败: ${result.error}`)
    }
  }
} catch (error) {
  console.error('未知错误:', error)
  ElMessage.error('操作失败，请查看控制台日志')
}
```

## 总结

本文档提供了机器码重置功能的完整使用示例，从简单到复杂，涵盖了各种实际应用场景。选择适合你需求的示例，并根据实际情况进行调整。

关键要点：
- ✅ 检查权限
- ✅ 关闭Cursor
- ✅ 执行重置
- ✅ 验证结果
- ✅ 处理错误







