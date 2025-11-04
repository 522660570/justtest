<template>
  <div class="environment-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <el-icon><Monitor /></el-icon>
        Cursor 环境监控
      </h2>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="Refresh" 
          @click="$emit('refresh')"
          :loading="loading"
          size="small"
        >
          刷新状态
        </el-button>
      </div>
    </div>

    <div class="panel-content">
      <el-row :gutter="24">
        <!-- 系统信息卡片 -->
        <el-col :xs="24" :sm="12" :lg="8">
          <el-card class="info-card system-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon class="card-icon"><Platform /></el-icon>
                <span class="card-title">系统信息</span>
              </div>
            </template>
            <div class="card-content">
              <div class="info-item">
                <span class="info-label">操作系统:</span>
                <el-tag :type="getPlatformTagType(environmentInfo?.platform)">
                  {{ getPlatformName(environmentInfo?.platform) }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">机器ID:</span>
                <div class="machine-id-section">
                  <el-input
                    v-model="displayMachineId"
                    readonly
                    size="small"
                    class="machine-id-input"
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
            </div>
          </el-card>
        </el-col>

        <!-- Cursor安装状态卡片 -->
        <el-col :xs="24" :sm="12" :lg="8">
          <el-card class="info-card installation-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon class="card-icon"><FolderOpened /></el-icon>
                <span class="card-title">安装状态</span>
              </div>
            </template>
            <div class="card-content">
              <div class="status-item">
                <div class="status-row">
                  <span class="status-label">安装状态:</span>
                  <el-tag 
                    :type="environmentInfo?.installation?.installed ? 'success' : 'danger'"
                    effect="dark"
                  >
                    {{ environmentInfo?.installation?.installed ? '已安装' : '未安装' }}
                  </el-tag>
                </div>
                <div v-if="environmentInfo?.installation?.installed" class="installation-path">
                  <el-text size="small" type="info" truncated>
                    {{ environmentInfo?.installation?.path }}
                  </el-text>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 进程状态卡片 -->
        <el-col :xs="24" :sm="12" :lg="8">
          <el-card class="info-card process-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon class="card-icon"><VideoPlay /></el-icon>
                <span class="card-title">进程状态</span>
              </div>
            </template>
            <div class="card-content">
              <div class="status-item">
                <div class="status-row">
                  <span class="status-label">运行状态:</span>
                  <el-tag 
                    :type="environmentInfo?.process?.running ? 'success' : 'info'"
                    effect="dark"
                  >
                    <el-icon>
                      <component :is="environmentInfo?.process?.running ? 'VideoPlay' : 'VideoPause'" />
                    </el-icon>
                    {{ environmentInfo?.process?.running ? '运行中' : '已停止' }}
                  </el-tag>
                </div>
                <div v-if="environmentInfo?.process?.processes?.length > 0" class="process-count">
                  <el-text size="small" type="info">
                    活动进程: {{ environmentInfo.process.processes.length }}
                  </el-text>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 操作控制区域 -->
      <div class="control-section">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon class="card-icon"><Setting /></el-icon>
              <span class="card-title">进程控制</span>
            </div>
          </template>
          <div class="control-buttons">
            <el-button-group>
              <el-button 
                type="success" 
                :icon="VideoPlay"
                @click="$emit('start-cursor')"
                :disabled="environmentInfo?.process?.running || !environmentInfo?.installation?.installed"
              >
                启动 Cursor
              </el-button>
              <el-button 
                type="warning" 
                :icon="VideoPause"
                @click="$emit('kill-cursor')"
                :disabled="!environmentInfo?.process?.running"
              >
                关闭 Cursor
              </el-button>
            </el-button-group>
          </div>
        </el-card>
      </div>

      <!-- 路径信息 -->
      <div class="paths-section">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon class="card-icon"><Folder /></el-icon>
              <span class="card-title">路径配置</span>
            </div>
          </template>
          <div class="paths-content">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="存储文件">
                <el-text size="small" class="path-text">
                  {{ environmentInfo?.paths?.storage }}
                </el-text>
              </el-descriptions-item>
              <el-descriptions-item label="数据库文件">
                <el-text size="small" class="path-text">
                  {{ environmentInfo?.paths?.sqlite }}
                </el-text>
              </el-descriptions-item>
              <el-descriptions-item label="机器ID文件">
                <el-text size="small" class="path-text">
                  {{ environmentInfo?.paths?.machineId }}
                </el-text>
              </el-descriptions-item>
              <el-descriptions-item label="可执行文件">
                <el-text size="small" class="path-text">
                  {{ environmentInfo?.paths?.executable }}
                </el-text>
              </el-descriptions-item>
            </el-descriptions>
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
  Monitor, 
  Refresh, 
  Platform, 
  FolderOpened, 
  VideoPlay, 
  VideoPause, 
  Setting, 
  Folder,
  CopyDocument
} from '@element-plus/icons-vue'

export default {
  name: 'EnvironmentPanel',
  components: {
    Monitor,
    Refresh,
    Platform,
    FolderOpened,
    VideoPlay,
    VideoPause,
    Setting,
    Folder,
    CopyDocument
  },
  props: {
    environmentInfo: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['refresh', 'kill-cursor', 'start-cursor'],
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

    const getPlatformTagType = (platform) => {
      const tagMap = {
        'win32': 'primary',
        'darwin': 'success',
        'linux': 'warning'
      }
      return tagMap[platform] || 'info'
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
        // 降级方案：使用传统的复制方法
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
      getPlatformTagType,
      copyMachineId
    }
  }
}
</script>

<style scoped>
.environment-panel {
  padding: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.info-card {
  margin-bottom: 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
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

.system-card .card-icon {
  color: #409eff;
}

.installation-card .card-icon {
  color: #67c23a;
}

.process-card .card-icon {
  color: #e6a23c;
}

.card-content {
  padding-top: 12px;
}

.info-item, .status-item {
  margin-bottom: 16px;
}

.info-item:last-child, .status-item:last-child {
  margin-bottom: 0;
}

.info-label, .status-label {
  display: inline-block;
  width: 80px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.machine-id-section {
  margin-top: 8px;
}

.machine-id-input {
  width: 100%;
}

.installation-path, .process-count {
  margin-top: 8px;
  padding-left: 12px;
}

.control-section {
  margin: 32px 0;
}

.control-buttons {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.paths-section {
  margin-top: 24px;
}

.paths-content {
  padding-top: 12px;
}

.path-text {
  word-break: break-all;
  font-family: 'Courier New', monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .panel-content {
    padding: 16px;
  }
  
  .info-card {
    margin-bottom: 16px;
  }
  
  .control-buttons {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .control-buttons .el-button-group {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  .control-buttons .el-button {
    width: 100%;
  }
}

/* 状态指示器动画 */
.el-tag {
  transition: all 0.3s ease;
}

.el-tag.el-tag--success {
  animation: pulse-success 2s infinite;
}

@keyframes pulse-success {
  0% { box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(103, 194, 58, 0); }
  100% { box-shadow: 0 0 0 0 rgba(103, 194, 58, 0); }
}
</style>

