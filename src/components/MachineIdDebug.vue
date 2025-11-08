<template>
  <div class="machine-id-debug">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>🔍 机器码调试工具</span>
          <el-tag v-if="hasAdmin" type="success">管理员权限</el-tag>
          <el-tag v-else type="warning">普通权限</el-tag>
        </div>
      </template>

      <el-space direction="vertical" :size="20" style="width: 100%">
        <!-- 操作按钮区 -->
        <el-space wrap>
          <el-button 
            type="primary" 
            @click="viewCurrentIds"
            :loading="loading.view"
          >
            📊 查看当前机器码
          </el-button>
          
          <el-button 
            type="warning" 
            @click="resetMachineIds"
            :loading="loading.reset"
          >
            🔄 重置机器码
          </el-button>
          
          <el-button 
            @click="clearConsole"
          >
            🧹 清空控制台
          </el-button>

          <el-button 
            @click="checkPaths"
            :loading="loading.paths"
          >
            📁 检查路径
          </el-button>
        </el-space>

        <!-- 权限提示 -->
        <el-alert
          v-if="!hasAdmin"
          title="权限提示"
          type="warning"
          show-icon
          :closable="false"
        >
          <template #default>
            当前没有管理员权限，无法更新Windows注册表。<br>
            请以<strong>管理员身份运行</strong>程序以获得完整功能。
          </template>
        </el-alert>

        <!-- Cursor进程状态 -->
        <el-alert
          v-if="cursorRunning"
          title="Cursor正在运行"
          type="info"
          show-icon
        >
          <template #default>
            建议先关闭Cursor，再进行机器码重置操作。
            <el-button 
              type="text" 
              size="small" 
              @click="killCursor"
              :loading="loading.kill"
            >
              强制关闭
            </el-button>
          </template>
        </el-alert>

        <!-- 当前机器码信息展示 -->
        <el-card v-if="currentIds" shadow="never">
          <template #header>
            <span>📊 当前机器码信息</span>
          </template>
          
          <el-tabs>
            <el-tab-pane label="storage.json">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item
                  v-for="(value, key) in currentIds.storageJson"
                  :key="key"
                  :label="key"
                  label-class-name="id-label"
                >
                  <el-text class="id-value" :copyable="{ text: value }">
                    {{ formatValue(value) }}
                  </el-text>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <el-tab-pane label="SQLite">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item
                  v-for="(value, key) in currentIds.sqlite"
                  :key="key"
                  :label="key"
                  label-class-name="id-label"
                >
                  <el-text class="id-value" :copyable="{ text: value }">
                    {{ formatValue(value) }}
                  </el-text>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>

            <el-tab-pane label="machineId 文件">
              <el-text class="id-value" :copyable="{ text: currentIds.machineIdFile }">
                {{ currentIds.machineIdFile }}
              </el-text>
            </el-tab-pane>

            <el-tab-pane v-if="currentIds.windowsRegistry" label="Windows 注册表">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item
                  v-for="(value, key) in currentIds.windowsRegistry"
                  :key="key"
                  :label="key"
                  label-class-name="id-label"
                >
                  <el-text class="id-value" :copyable="{ text: value }">
                    {{ formatValue(value) }}
                  </el-text>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 路径信息 -->
        <el-card v-if="pathsInfo" shadow="never">
          <template #header>
            <span>📁 Cursor 路径信息</span>
          </template>
          
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="Platform">
              {{ pathsInfo.platform }}
            </el-descriptions-item>
            <el-descriptions-item label="storage.json">
              <el-text :copyable="{ text: pathsInfo.paths.storage }">
                {{ pathsInfo.paths.storage }}
              </el-text>
            </el-descriptions-item>
            <el-descriptions-item label="SQLite DB">
              <el-text :copyable="{ text: pathsInfo.paths.sqlite }">
                {{ pathsInfo.paths.sqlite }}
              </el-text>
            </el-descriptions-item>
            <el-descriptions-item label="machineId">
              <el-text :copyable="{ text: pathsInfo.paths.machineId }">
                {{ pathsInfo.paths.machineId }}
              </el-text>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 控制台提示 -->
        <el-alert
          title="💡 提示"
          type="info"
          :closable="false"
        >
          <template #default>
            按<kbd>F12</kbd>打开开发者工具，在<strong>Console</strong>标签页可以看到详细的执行日志。
          </template>
        </el-alert>
      </el-space>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CursorService from '@/services/CursorService'

const cursorService = new CursorService()

const loading = ref({
  view: false,
  reset: false,
  kill: false,
  paths: false
})

const hasAdmin = ref(false)
const cursorRunning = ref(false)
const currentIds = ref(null)
const pathsInfo = ref(null)

// 初始化
onMounted(async () => {
  console.log('🔧 机器码调试工具已加载')
  console.log('💡 提示：按 F12 打开开发者工具查看详细日志')
  
  // 检查管理员权限
  try {
    hasAdmin.value = await window.electronAPI.checkAdminRights()
    console.log('🔐 管理员权限:', hasAdmin.value ? '✅ 是' : '❌ 否')
  } catch (error) {
    console.warn('⚠️ 无法检查管理员权限:', error)
  }
  
  // 检查Cursor运行状态
  await checkCursorStatus()
})

// 格式化值（截断长字符串）
const formatValue = (value) => {
  if (!value || typeof value !== 'string') return value
  if (value.length > 80) {
    return value.substring(0, 80) + '...'
  }
  return value
}

// 查看当前机器码
const viewCurrentIds = async () => {
  loading.value.view = true
  try {
    console.log('🔍 开始查看当前机器码...')
    const result = await cursorService.getAllCurrentMachineIds()
    
    if (result.success) {
      currentIds.value = result.data
      pathsInfo.value = {
        platform: result.data.platform,
        paths: result.data.paths
      }
      ElMessage.success('机器码信息已加载，请查看控制台(F12)获取完整信息')
    } else {
      ElMessage.error(`加载失败: ${result.error || result.message}`)
    }
  } catch (error) {
    console.error('❌ 查看机器码失败:', error)
    ElMessage.error(`查看失败: ${error.message}`)
  } finally {
    loading.value.view = false
  }
}

// 重置机器码
const resetMachineIds = async () => {
  try {
    // 先检查Cursor是否运行
    await checkCursorStatus()
    
    if (cursorRunning.value) {
      await ElMessageBox.confirm(
        '⚠️ 检测到Cursor正在运行！\n\n' +
        '文件被锁定时无法重置机器码。\n\n' +
        '是否现在关闭Cursor？',
        'Cursor正在运行',
        {
          confirmButtonText: '关闭Cursor并继续',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      // 关闭Cursor
      await killCursor()
      
      // 等待进程完全结束
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // 确认对话框
    await ElMessageBox.confirm(
      '此操作将重置所有机器ID，包括：\n' +
      '• storage.json (5个字段)\n' +
      '• SQLite数据库 (5个字段)\n' +
      '• machineId文件\n' +
      (hasAdmin.value ? '• Windows注册表 (2个键值)\n' : '⚠️ 无管理员权限，无法更新注册表\n') +
      '\n是否继续？',
      '确认重置机器码',
      {
        confirmButtonText: '确认重置',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )

    loading.value.reset = true
    
    console.log('🔄 开始重置机器码...')
    console.log('═'.repeat(50))
    
    const result = await cursorService.resetMachineId()
    
    if (result.success) {
      ElMessage.success('机器码重置成功！请查看控制台(F12)获取详细信息')
      
      // 自动刷新当前机器码显示
      setTimeout(() => {
        viewCurrentIds()
      }, 1000)
    } else {
      // 根据错误类型显示不同的提示
      if (result.errorType === 'CURSOR_RUNNING') {
        ElMessage.error('Cursor正在运行，请先关闭Cursor')
      } else if (result.errorType === 'PERMISSION_DENIED') {
        ElMessage.error('文件被锁定，请确保Cursor已完全关闭')
      } else {
        ElMessage.error(`重置失败: ${result.message || result.error}`)
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('❌ 重置机器码失败:', error)
      ElMessage.error(`操作失败: ${error.message}`)
    }
  } finally {
    loading.value.reset = false
  }
}

// 检查Cursor运行状态
const checkCursorStatus = async () => {
  try {
    const status = await cursorService.checkCursorProcess()
    cursorRunning.value = status.running
    console.log('🖥️ Cursor进程状态:', cursorRunning.value ? '运行中' : '未运行')
  } catch (error) {
    console.warn('⚠️ 无法检查Cursor状态:', error)
  }
}

// 关闭Cursor
const killCursor = async () => {
  loading.value.kill = true
  try {
    console.log('🔪 正在关闭Cursor...')
    await cursorService.killCursorProcess()
    await new Promise(resolve => setTimeout(resolve, 3000))
    await checkCursorStatus()
    ElMessage.success('Cursor已关闭')
  } catch (error) {
    console.error('❌ 关闭Cursor失败:', error)
    ElMessage.error(`关闭失败: ${error.message}`)
  } finally {
    loading.value.kill = false
  }
}

// 检查路径
const checkPaths = async () => {
  loading.value.paths = true
  try {
    await cursorService.initialize()
    pathsInfo.value = {
      platform: cursorService.platform,
      paths: cursorService.cursorPaths
    }
    console.log('📁 Cursor路径信息:', pathsInfo.value)
    ElMessage.success('路径信息已加载')
  } catch (error) {
    console.error('❌ 检查路径失败:', error)
    ElMessage.error(`检查失败: ${error.message}`)
  } finally {
    loading.value.paths = false
  }
}

// 清空控制台
const clearConsole = () => {
  console.clear()
  console.log('🧹 控制台已清空')
  console.log('💡 提示：使用上方按钮进行操作')
}
</script>

<style scoped>
.machine-id-debug {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: bold;
}

.id-label {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.id-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
}

kbd {
  padding: 2px 6px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background-color: #f5f5f5;
  font-family: monospace;
  font-size: 12px;
}
</style>


