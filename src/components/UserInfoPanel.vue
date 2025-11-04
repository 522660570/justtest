<template>
  <div class="one-click-renewal-panel">
    <el-card shadow="hover" class="renewal-card">
      <div class="renewal-content">
        <!-- 当前账号信息 -->
        <div class="current-account-section">
          <el-card shadow="never" class="account-info-card">
            <div class="account-info">
              <div class="account-label">当前Cursor账号：</div>
              <div class="account-value">
                <span v-if="currentAccount.loading" class="loading-text">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  正在获取...
                </span>
                <span v-else-if="currentAccount.email" class="email-text">
                  {{ currentAccount.email }}
                </span>
                <span v-else class="no-account-text">未检测到登录账号</span>
              </div>
              <div class="account-status">
                <el-tag 
                  :type="currentAccount.isAuthenticated ? 'success' : 'danger'" 
                  size="small"
                >
                  {{ currentAccount.isAuthenticated ? '已认证' : '未认证' }}
                </el-tag>
                <el-tag 
                  :type="currentAccount.hasAccessToken ? 'success' : 'warning'" 
                  size="small"
                  style="margin-left: 8px;"
                >
                  {{ currentAccount.hasAccessToken ? 'Token有效' : 'Token无效' }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 一键续杯按钮 -->
        <div class="action-section">
          <el-button 
            type="success" 
            size="large"
            :icon="MagicStick"
            @click="$emit('renew-pro')"
            :loading="loading"
            class="renewal-button"
          >
            <span v-if="loading">正在续杯中...</span>
            <span v-else>🚀 一键续杯</span>
          </el-button>

        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { computed } from 'vue'
import { 
  MagicStick,
  Search,
  Loading
} from '@element-plus/icons-vue'

export default {
  name: 'OneClickRenewalPanel',
  components: {
    MagicStick,
    Search,
    Loading
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    currentAccount: {
      type: Object,
      default: () => ({
        loading: false,
        email: null,
        isAuthenticated: false,
        hasAccessToken: false
      })
    }
  },
  emits: ['renew-pro', 'diagnose-config'],
  setup(props, { emit }) {
    return {
      // 无需返回任何数据
    }
  }
}
</script>

<style scoped>
.one-click-renewal-panel {
  margin-bottom: 0;
}

.renewal-card {
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
}

.renewal-card :deep(.el-card__body) {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.main-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.renewal-content {
  padding: 32px;
}



/* 操作按钮区域 */
.action-section {
  text-align: center;
}

.renewal-button {
  width: 100%;
  max-width: 300px;
  height: 56px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 28px;
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.4);
  transition: all 0.3s ease;
}

.renewal-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(103, 194, 58, 0.5);
  background: linear-gradient(135deg, #85ce61 0%, #67c23a 100%);
}

.renewal-button:active {
  transform: translateY(0);
}

.renewal-button.is-loading {
  background: linear-gradient(135deg, #a0cfff 0%, #909399 100%);
}

/* 当前账号信息样式 */
.current-account-section {
  margin-bottom: 24px;
}

.account-info-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 12px;
}

.account-info {
  text-align: left;
}

.account-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;
}

.account-value {
  margin-bottom: 12px;
}

.email-text {
  font-size: 16px;
  color: #495057;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.loading-text {
  font-size: 14px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-account-text {
  font-size: 14px;
  color: #dc3545;
  font-style: italic;
}

.account-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diagnose-button {
  margin-left: 16px;
  height: 40px;
}


/* 响应式设计 */

@media (max-width: 768px) {
  .card-header {
    padding: 20px 24px;
    flex-direction: column;
    text-align: center;
  }
  
  .renewal-content {
    padding: 24px 20px;
  }
  
  .main-title {
    font-size: 24px;
  }
  
  .subtitle {
    font-size: 14px;
  }
  
  
  
  .renewal-button {
    height: 48px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .card-header {
    padding: 16px 20px;
  }
  
  .renewal-content {
    padding: 20px 16px;
  }
  
  .main-title {
    font-size: 20px;
  }
  
  
}

/* 动画效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.renewal-button.is-loading {
  animation: pulse 2s infinite;
}

/* 毛玻璃效果增强 */
.one-click-renewal-panel {
  position: relative;
}

.one-click-renewal-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  z-index: -1;
}
</style>
