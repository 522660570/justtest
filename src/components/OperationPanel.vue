<template>
  <div class="operation-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <el-icon><Setting /></el-icon>
        操作中心
      </h2>
    </div>

    <div class="panel-content">
      <!-- 快速操作区域 -->
      <div class="quick-actions">
        <el-card shadow="hover" class="action-card">
          <template #header>
            <div class="card-header">
              <el-icon class="card-icon"><MagicStick /></el-icon>
              <span class="card-title">一键操作</span>
            </div>
          </template>
          <div class="quick-action-content">
            <el-button 
              type="primary" 
              size="large"
              :icon="Refresh"
              @click="$emit('full-reset')"
              :loading="loading.operations"
              class="full-reset-btn"
            >
              <span class="button-text">完整重置流程</span>
              <span class="button-description">自动选择最佳账号并完成所有重置步骤</span>
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 分步操作区域 -->
      <div class="step-operations">
        <el-row :gutter="24">
          <!-- 机器ID管理 -->
          <el-col :xs="24" :lg="12">
            <el-card shadow="hover" class="operation-card">
              <template #header>
                <div class="card-header">
                  <el-icon class="card-icon machine-id-icon"><Cpu /></el-icon>
                  <span class="card-title">机器ID管理</span>
                </div>
              </template>
              <div class="card-content">
                <div class="current-info">
                  <div class="info-item">
                    <span class="info-label">当前机器ID:</span>
                    <el-input
                      :value="displayMachineId"
                      readonly
                      size="small"
                      class="machine-id-display"
                    >
                      <template #append>
                        <el-button 
                          :icon="CopyDocument" 
                          @click="copyMachineId"
                          size="small"
                        />
                      </template>
                    </el-input>
                  </div>
                </div>
                <div class="action-buttons">
                  <el-button 
                    type="warning" 
                    :icon="RefreshRight"
                    @click="$emit('reset-machine-id')"
                    :loading="loading.operations"
                    block
                  >
                    重置机器ID
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 账号切换 -->
          <el-col :xs="24" :lg="12">
            <el-card shadow="hover" class="operation-card">
              <template #header>
                <div class="card-header">
                  <el-icon class="card-icon account-icon"><UserFilled /></el-icon>
                  <span class="card-title">账号切换</span>
                </div>
              </template>
              <div class="card-content">
                <div class="current-info">
                  <div class="info-item">
                    <span class="info-label">选中账号:</span>
                    <div v-if="selectedAccount" class="selected-account-info">
                      <el-tag type="success" size="small">
                        {{ selectedAccount.email }}
                      </el-tag>
                      <el-progress 
                        :percentage="getUsagePercentage(selectedAccount.usage)"
                        :status="getUsageStatus(selectedAccount.usage)"
                        :stroke-width="4"
                        :show-text="false"
                        class="usage-progress"
                      />
                    </div>
                    <el-text v-else type="info" size="small">
                      请先在账号管理中选择一个账号
                    </el-text>
                  </div>
                </div>
                <div class="action-buttons">
                  <el-button 
                    type="success" 
                    :icon="Switch"
                    @click="$emit('switch-account', selectedAccount)"
                    :disabled="!selectedAccount"
                    :loading="loading.operations"
                    block
                  >
                    切换到此账号
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 环境状态监控 -->
      <div class="status-monitor">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon class="card-icon"><Monitor /></el-icon>
              <span class="card-title">当前状态</span>
            </div>
          </template>
          <div class="status-content">
            <el-row :gutter="24">
              <el-col :xs="24" :sm="8">
                <div class="status-item">
                  <div class="status-icon cursor-status">
                    <el-icon size="24">
                      <component :is="environmentInfo?.process?.running ? 'VideoPlay' : 'VideoPause'" />
                    </el-icon>
                  </div>
                  <div class="status-info">
                    <div class="status-title">Cursor状态</div>
                    <div class="status-value">
                      <el-tag 
                        :type="environmentInfo?.process?.running ? 'success' : 'info'"
                        effect="dark"
                        size="small"
                      >
                        {{ environmentInfo?.process?.running ? '运行中' : '已停止' }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </el-col>

              <el-col :xs="24" :sm="8">
                <div class="status-item">
                  <div class="status-icon install-status">
                    <el-icon size="24">
                      <component :is="environmentInfo?.installation?.installed ? 'Check' : 'Close'" />
                    </el-icon>
                  </div>
                  <div class="status-info">
                    <div class="status-title">安装状态</div>
                    <div class="status-value">
                      <el-tag 
                        :type="environmentInfo?.installation?.installed ? 'success' : 'danger'"
                        effect="dark"
                        size="small"
                      >
                        {{ environmentInfo?.installation?.installed ? '已安装' : '未安装' }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </el-col>

              <el-col :xs="24" :sm="8">
                <div class="status-item">
                  <div class="status-icon platform-status">
                    <el-icon size="24"><Platform /></el-icon>
                  </div>
                  <div class="status-info">
                    <div class="status-title">操作系统</div>
                    <div class="status-value">
                      <el-tag type="primary" effect="dark" size="small">
                        {{ getPlatformName(environmentInfo?.platform) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>

      <!-- 操作说明 -->
      <div class="operation-guide">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon class="card-icon"><InfoFilled /></el-icon>
              <span class="card-title">操作说明</span>
            </div>
          </template>
          <div class="guide-content">
            <el-steps :active="4" finish-status="success" simple>
              <el-step title="选择账号" description="在账号管理中选择一个可用账号" />
              <el-step title="关闭Cursor" description="自动关闭正在运行的Cursor进程" />
              <el-step title="重置机器ID" description="生成新的机器标识符" />
              <el-step title="切换账号" description="更新本地存储的账号信息" />
              <el-step title="启动Cursor" description="重新启动Cursor应用" />
            </el-steps>
            
            <div class="guide-tips">
              <el-alert
                title="操作提示"
                type="info"
                :closable="false"
                show-icon
              >
                <ul class="tips-list">
                  <li>建议在进行任何操作前先备份重要数据</li>
                  <li>完整重置流程会自动执行所有步骤，推荐使用</li>
                  <li>单独操作适合有经验的用户进行精确控制</li>
                  <li>操作过程中请不要手动启动Cursor</li>
                </ul>
              </el-alert>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Setting, 
  MagicStick, 
  Refresh, 
  Cpu, 
  RefreshRight,
  CopyDocument,
  UserFilled,
  Switch,
  Monitor,
  VideoPlay,
  VideoPause,
  Check,
  Close,
  Platform,
  InfoFilled
} from '@element-plus/icons-vue'

export default {
  name: 'OperationPanel',
  components: {
    Setting,
    MagicStick,
    Refresh,
    Cpu,
    RefreshRight,
    CopyDocument,
    UserFilled,
    Switch,
    Monitor,
    VideoPlay,
    VideoPause,
    Check,
    Close,
    Platform,
    InfoFilled
  },
  props: {
    selectedAccount: {
      type: Object,
      default: null
    },
    environmentInfo: {
      type: Object,
      default: null
    },
    loading: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['reset-machine-id', 'switch-account', 'full-reset'],
  setup(props) {
    // 计算属性
    const displayMachineId = computed(() => {
      if (!props.environmentInfo?.machineId?.machineId) {
        return '未获取到机器ID'
      }
      const id = props.environmentInfo.machineId.machineId
      return id.length > 16 ? `${id.substring(0, 8)}...${id.substring(id.length - 8)}` : id
    })

    // 方法
    const getPlatformName = (platform) => {
      const platformMap = {
        'win32': 'Windows',
        'darwin': 'macOS',
        'linux': 'Linux'
      }
      return platformMap[platform] || platform || '未知'
    }

    const getUsagePercentage = (usage) => {
      if (!usage) return 0
      return Math.round((usage.requests / usage.limit) * 100)
    }

    const getUsageStatus = (usage) => {
      if (!usage) return 'success'
      const percentage = (usage.requests / usage.limit) * 100
      if (percentage >= 95) return 'exception'
      if (percentage >= 90) return 'warning'
      return 'success'
    }

    const copyMachineId = async () => {
      if (!props.environmentInfo?.machineId?.machineId) {
        ElMessage.warning('没有可复制的机器ID')
        return
      }

      try {
        await navigator.clipboard.writeText(props.environmentInfo.machineId.machineId)
        ElMessage.success('机器ID已复制到剪贴板')
      } catch (error) {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = props.environmentInfo.machineId.machineId
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          ElMessage.success('机器ID已复制到剪贴板')
        } catch (err) {
          ElMessage.error('复制失败')
        }
        document.body.removeChild(textArea)
      }
    }

    return {
      displayMachineId,
      getPlatformName,
      getUsagePercentage,
      getUsageStatus,
      copyMachineId
    }
  }
}
</script>

<style scoped>
.operation-panel {
  padding: 0;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.panel-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-content {
  padding: 24px;
}

.quick-actions {
  margin-bottom: 32px;
}

.action-card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-icon {
  font-size: 18px;
}

.card-icon.machine-id-icon {
  color: #409eff;
}

.card-icon.account-icon {
  color: #67c23a;
}

.quick-action-content {
  padding: 24px 0;
  text-align: center;
}

.full-reset-btn {
  height: auto;
  padding: 20px 40px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.full-reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.button-text {
  font-size: 18px;
  font-weight: 600;
}

.button-description {
  font-size: 12px;
  opacity: 0.9;
  font-weight: normal;
}

.step-operations {
  margin-bottom: 32px;
}

.operation-card {
  border-radius: 8px;
  height: 100%;
}

.card-content {
  padding-top: 16px;
}

.current-info {
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 16px;
}

.info-label {
  display: block;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
  font-size: 14px;
}

.machine-id-display {
  width: 100%;
}

.selected-account-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.usage-progress {
  width: 100%;
}

.action-buttons {
  margin-top: 16px;
}

.status-monitor {
  margin-bottom: 32px;
}

.status-content {
  padding-top: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.status-item:hover {
  background: #e9ecef;
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon.cursor-status {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: white;
}

.status-icon.install-status {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}

.status-icon.platform-status {
  background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
  color: #333;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.status-value {
  font-size: 16px;
  font-weight: 500;
}

.operation-guide {
  margin-bottom: 24px;
}

.guide-content {
  padding-top: 16px;
}

.guide-tips {
  margin-top: 24px;
}

.tips-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.tips-list li {
  margin-bottom: 4px;
  color: #606266;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-content {
    padding: 16px;
  }
  
  .full-reset-btn {
    width: 100%;
    padding: 16px 24px;
  }
  
  .button-text {
    font-size: 16px;
  }
  
  .status-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .status-info {
    text-align: center;
  }
}

/* 步骤条样式优化 */
.el-steps {
  margin-bottom: 24px;
}

/* 卡片悬停效果 */
.el-card {
  transition: all 0.3s ease;
}

.el-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* 按钮加载状态优化 */
.el-button.is-loading {
  pointer-events: none;
}
</style>

