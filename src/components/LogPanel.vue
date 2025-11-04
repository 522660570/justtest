<template>
  <div class="log-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <el-icon><Document /></el-icon>
        操作日志
      </h2>
      <div class="header-actions">
        <el-button 
          type="danger" 
          :icon="Delete" 
          @click="$emit('clear-logs')"
          size="small"
          plain
        >
          清空日志
        </el-button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 日志统计 -->
      <div class="log-stats">
        <el-row :gutter="16">
          <el-col :xs="12" :sm="6">
            <div class="stat-item success">
              <el-icon class="stat-icon"><SuccessFilled /></el-icon>
              <div class="stat-content">
                <div class="stat-number">{{ successCount }}</div>
                <div class="stat-label">成功</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-item error">
              <el-icon class="stat-icon"><CircleCloseFilled /></el-icon>
              <div class="stat-content">
                <div class="stat-number">{{ errorCount }}</div>
                <div class="stat-label">错误</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-item warning">
              <el-icon class="stat-icon"><WarningFilled /></el-icon>
              <div class="stat-content">
                <div class="stat-number">{{ warningCount }}</div>
                <div class="stat-label">警告</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-item info">
              <el-icon class="stat-icon"><InfoFilled /></el-icon>
              <div class="stat-content">
                <div class="stat-number">{{ infoCount }}</div>
                <div class="stat-label">信息</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 日志过滤 -->
      <div class="log-filters">
        <el-row :gutter="16" justify="space-between" align="middle">
          <el-col :xs="24" :sm="12">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索日志内容..."
              :prefix-icon="Search"
              clearable
              size="default"
            />
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="filter-controls">
              <el-select 
                v-model="typeFilter" 
                placeholder="筛选类型" 
                clearable
                size="default"
                style="width: 120px;"
              >
                <el-option label="全部" value="" />
                <el-option label="成功" value="success" />
                <el-option label="错误" value="error" />
                <el-option label="警告" value="warning" />
                <el-option label="信息" value="info" />
              </el-select>
              <el-checkbox v-model="autoScroll" size="default">
                自动滚动
              </el-checkbox>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 日志列表 -->
      <div class="log-list" ref="logListRef">
        <div v-if="filteredLogs.length === 0" class="empty-logs">
          <el-empty description="暂无日志记录">
            <template #image>
              <el-icon size="60" color="#c0c4cc"><Document /></el-icon>
            </template>
          </el-empty>
        </div>
        
        <div v-else class="log-items">
          <div 
            v-for="log in filteredLogs" 
            :key="log.id"
            :class="['log-item', `log-${log.type}`]"
          >
            <div class="log-header">
              <div class="log-type-icon">
                <el-icon>
                  <component :is="getLogIcon(log.type)" />
                </el-icon>
              </div>
              <div class="log-meta">
                <span class="log-timestamp">{{ log.timestamp }}</span>
                <el-tag 
                  :type="getLogTagType(log.type)" 
                  size="small" 
                  effect="dark"
                >
                  {{ getLogTypeText(log.type) }}
                </el-tag>
              </div>
            </div>
            
            <div class="log-content">
              <div class="log-message">{{ log.message }}</div>
              <div v-if="log.details" class="log-details">
                <el-collapse>
                  <el-collapse-item title="详细信息" :name="log.id">
                    <pre class="details-content">{{ formatDetails(log.details) }}</pre>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, watch } from 'vue'
import { 
  Document, 
  Delete, 
  Search,
  SuccessFilled,
  CircleCloseFilled,
  WarningFilled,
  InfoFilled
} from '@element-plus/icons-vue'

export default {
  name: 'LogPanel',
  components: {
    Document,
    Delete,
    Search,
    SuccessFilled,
    CircleCloseFilled,
    WarningFilled,
    InfoFilled
  },
  props: {
    logs: {
      type: Array,
      default: () => []
    }
  },
  emits: ['clear-logs'],
  setup(props) {
    // 响应式数据
    const searchKeyword = ref('')
    const typeFilter = ref('')
    const autoScroll = ref(true)
    const logListRef = ref(null)

    // 计算属性
    const successCount = computed(() => {
      return props.logs.filter(log => log.type === 'success').length
    })

    const errorCount = computed(() => {
      return props.logs.filter(log => log.type === 'error').length
    })

    const warningCount = computed(() => {
      return props.logs.filter(log => log.type === 'warning').length
    })

    const infoCount = computed(() => {
      return props.logs.filter(log => log.type === 'info').length
    })

    const filteredLogs = computed(() => {
      let filtered = props.logs

      // 类型过滤
      if (typeFilter.value) {
        filtered = filtered.filter(log => log.type === typeFilter.value)
      }

      // 搜索过滤
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        filtered = filtered.filter(log => 
          log.message.toLowerCase().includes(keyword) ||
          (log.details && JSON.stringify(log.details).toLowerCase().includes(keyword))
        )
      }

      return filtered
    })

    // 方法
    const getLogIcon = (type) => {
      const iconMap = {
        'success': 'SuccessFilled',
        'error': 'CircleCloseFilled',
        'warning': 'WarningFilled',
        'info': 'InfoFilled'
      }
      return iconMap[type] || 'InfoFilled'
    }

    const getLogTagType = (type) => {
      const tagMap = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
      }
      return tagMap[type] || 'info'
    }

    const getLogTypeText = (type) => {
      const textMap = {
        'success': '成功',
        'error': '错误',
        'warning': '警告',
        'info': '信息'
      }
      return textMap[type] || type
    }

    const formatDetails = (details) => {
      if (typeof details === 'string') {
        return details
      }
      return JSON.stringify(details, null, 2)
    }

    const scrollToBottom = () => {
      if (autoScroll.value && logListRef.value) {
        nextTick(() => {
          const element = logListRef.value
          element.scrollTop = element.scrollHeight
        })
      }
    }

    // 监听日志变化，自动滚动到底部
    watch(
      () => props.logs.length,
      () => {
        scrollToBottom()
      }
    )

    return {
      // 响应式数据
      searchKeyword,
      typeFilter,
      autoScroll,
      logListRef,

      // 计算属性
      successCount,
      errorCount,
      warningCount,
      infoCount,
      filteredLogs,

      // 方法
      getLogIcon,
      getLogTagType,
      getLogTypeText,
      formatDetails,
      scrollToBottom
    }
  }
}
</script>

<style scoped>
.log-panel {
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

.log-stats {
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-item.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: white;
}

.stat-item.error {
  background: linear-gradient(135deg, #f56c6c, #f78989);
  color: white;
}

.stat-item.warning {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
  color: white;
}

.stat-item.info {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: white;
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}

.log-filters {
  margin-bottom: 24px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
}

.log-list {
  height: 500px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
}

.empty-logs {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.log-items {
  padding: 16px;
}

.log-item {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #fafafa;
  transition: all 0.3s ease;
}

.log-item:hover {
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.log-item:last-child {
  margin-bottom: 0;
}

.log-item.log-success {
  border-left-color: #67c23a;
  background: #f0f9ff;
}

.log-item.log-error {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.log-item.log-warning {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.log-item.log-info {
  border-left-color: #409eff;
  background: #ecf5ff;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-type-icon {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.log-item.log-success .log-type-icon {
  color: #67c23a;
}

.log-item.log-error .log-type-icon {
  color: #f56c6c;
}

.log-item.log-warning .log-type-icon {
  color: #e6a23c;
}

.log-item.log-info .log-type-icon {
  color: #409eff;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-timestamp {
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

.log-content {
  margin-left: 24px;
}

.log-message {
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
  margin-bottom: 8px;
}

.log-details {
  margin-top: 12px;
}

.details-content {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #606266;
  max-height: 200px;
  overflow-y: auto;
}

/* 自定义滚动条 */
.log-list::-webkit-scrollbar {
  width: 6px;
}

.log-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.log-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.log-list::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.details-content::-webkit-scrollbar {
  width: 4px;
}

.details-content::-webkit-scrollbar-track {
  background: #e4e7ed;
  border-radius: 2px;
}

.details-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 2px;
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
  
  .filter-controls {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .log-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .log-meta {
    align-self: flex-end;
  }
  
  .log-content {
    margin-left: 0;
  }
  
  .log-list {
    height: 400px;
  }
}

/* 折叠面板样式优化 */
.el-collapse {
  border: none;
}

.el-collapse-item {
  border: none;
}

.el-collapse-item :deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  padding-left: 0;
  font-size: 12px;
  color: #909399;
}

.el-collapse-item :deep(.el-collapse-item__wrap) {
  border: none;
}

.el-collapse-item :deep(.el-collapse-item__content) {
  padding: 8px 0 0 0;
}
</style>

