<template>
  <div class="account-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <el-icon><User /></el-icon>
        账号管理
      </h2>
      <div class="header-actions">
        <el-button 
          type="primary" 
          :icon="Refresh" 
          @click="$emit('refresh')"
          :loading="loading"
          size="small"
        >
          刷新账号
        </el-button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 统计信息 -->
      <div class="stats-section">
        <el-row :gutter="16">
          <el-col :xs="12" :sm="6">
            <div class="stat-card total">
              <div class="stat-number">{{ accounts.length }}</div>
              <div class="stat-label">总账号数</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card active">
              <div class="stat-number">{{ activeAccountsCount }}</div>
              <div class="stat-label">可用账号</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card warning">
              <div class="stat-number">{{ warningAccountsCount }}</div>
              <div class="stat-label">即将限制</div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card limited">
              <div class="stat-number">{{ limitedAccountsCount }}</div>
              <div class="stat-label">已限制</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选和搜索 -->
      <div class="filter-section">
        <el-row :gutter="16" justify="space-between">
          <el-col :xs="24" :sm="12">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索账号邮箱..."
              :prefix-icon="Search"
              clearable
              size="default"
            />
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="filter-controls">
              <el-select 
                v-model="statusFilter" 
                placeholder="筛选状态" 
                clearable
                size="default"
                style="width: 140px;"
              >
                <el-option label="全部状态" value="" />
                <el-option label="可用" value="active" />
                <el-option label="警告" value="warning" />
                <el-option label="受限" value="limited" />
              </el-select>
              <el-button 
                type="success" 
                :icon="Star"
                @click="selectBestAccount"
                size="default"
              >
                选择最佳账号
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 账号列表 -->
      <div class="accounts-list">
        <el-table 
          :data="filteredAccounts" 
          stripe 
          style="width: 100%"
          :loading="loading"
          empty-text="暂无账号数据"
          @row-click="handleRowClick"
        >
          <el-table-column type="index" width="50" label="#" />
          
          <el-table-column prop="email" label="邮箱地址" min-width="200">
            <template #default="{ row }">
              <div class="email-cell">
                <el-avatar :size="32" :src="row.user.avatar" class="account-avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <div class="email-info">
                  <div class="email-address">{{ row.email }}</div>
                  <div class="account-name">{{ row.user.name }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag 
                :type="getStatusTagType(row.status)" 
                effect="dark"
                size="small"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="使用情况" width="200" align="center">
            <template #default="{ row }">
              <div class="usage-cell">
                <el-progress 
                  :percentage="getUsagePercentage(row.usage)"
                  :status="getUsageStatus(row.usage)"
                  :stroke-width="8"
                />
                <div class="usage-text">
                  {{ row.usage.requests }} / {{ row.usage.limit }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
            <template #default="{ row }">
              <el-text size="small" type="info">
                {{ formatDate(row.createdAt) }}
              </el-text>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="small"
                  :icon="Pointer"
                  @click.stop="selectAccount(row)"
                >
                  选择
                </el-button>
                <el-button 
                  type="success" 
                  size="small"
                  :icon="Check"
                  @click.stop="validateAccount(row)"
                  :loading="validatingAccountId === row.id"
                >
                  验证
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 选中账号信息 -->
      <div v-if="selectedAccount" class="selected-account">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon class="card-icon"><StarFilled /></el-icon>
              <span class="card-title">当前选中账号</span>
            </div>
          </template>
          <div class="selected-account-content">
            <el-row :gutter="24">
              <el-col :xs="24" :sm="12">
                <div class="account-detail">
                  <el-avatar :size="48" :src="selectedAccount.user.avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <div class="account-info">
                    <h3 class="account-email">{{ selectedAccount.email }}</h3>
                    <p class="account-name">{{ selectedAccount.user.name }}</p>
                    <el-tag 
                      :type="getStatusTagType(selectedAccount.status)" 
                      effect="dark"
                    >
                      {{ getStatusText(selectedAccount.status) }}
                    </el-tag>
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12">
                <div class="account-stats">
                  <div class="stat-item">
                    <span class="stat-label">使用率:</span>
                    <el-progress 
                      :percentage="getUsagePercentage(selectedAccount.usage)"
                      :status="getUsageStatus(selectedAccount.usage)"
                      :stroke-width="6"
                    />
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">请求数:</span>
                    <span class="stat-value">
                      {{ selectedAccount.usage.requests }} / {{ selectedAccount.usage.limit }}
                    </span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">创建时间:</span>
                    <span class="stat-value">{{ formatDate(selectedAccount.createdAt) }}</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Refresh, 
  Search, 
  Star, 
  Pointer, 
  Check, 
  StarFilled 
} from '@element-plus/icons-vue'

export default {
  name: 'AccountPanel',
  components: {
    User,
    Refresh,
    Search,
    Star,
    Pointer,
    Check,
    StarFilled
  },
  props: {
    accounts: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['refresh', 'select-account', 'validate-account'],
  setup(props, { emit }) {
    // 响应式数据
    const searchKeyword = ref('')
    const statusFilter = ref('')
    const selectedAccount = ref(null)
    const validatingAccountId = ref(null)

    // 计算属性
    const activeAccountsCount = computed(() => {
      return props.accounts.filter(account => account.status === 'active').length
    })

    const warningAccountsCount = computed(() => {
      return props.accounts.filter(account => account.status === 'warning').length
    })

    const limitedAccountsCount = computed(() => {
      return props.accounts.filter(account => account.status === 'limited').length
    })

    const filteredAccounts = computed(() => {
      let filtered = props.accounts

      // 搜索过滤
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        filtered = filtered.filter(account => 
          account.email.toLowerCase().includes(keyword) ||
          account.user.name.toLowerCase().includes(keyword)
        )
      }

      // 状态过滤
      if (statusFilter.value) {
        filtered = filtered.filter(account => account.status === statusFilter.value)
      }

      return filtered
    })

    // 方法
    const getStatusTagType = (status) => {
      const statusMap = {
        'active': 'success',
        'warning': 'warning',
        'limited': 'danger'
      }
      return statusMap[status] || 'info'
    }

    const getStatusText = (status) => {
      const statusMap = {
        'active': '可用',
        'warning': '警告',
        'limited': '受限'
      }
      return statusMap[status] || status
    }

    const getUsagePercentage = (usage) => {
      return Math.round((usage.requests / usage.limit) * 100)
    }

    const getUsageStatus = (usage) => {
      const percentage = (usage.requests / usage.limit) * 100
      if (percentage >= 95) return 'exception'
      if (percentage >= 90) return 'warning'
      return 'success'
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const selectAccount = (account) => {
      selectedAccount.value = account
      emit('select-account', account)
      ElMessage.success(`已选择账号: ${account.email}`)
    }

    const validateAccount = async (account) => {
      validatingAccountId.value = account.id
      try {
        await emit('validate-account', account)
      } finally {
        validatingAccountId.value = null
      }
    }

    const selectBestAccount = () => {
      const availableAccounts = props.accounts.filter(account => 
        account.status === 'active' && account.usage.requests < account.usage.limit * 0.9
      )

      if (availableAccounts.length === 0) {
        ElMessage.warning('没有可用的账号')
        return
      }

      const bestAccount = availableAccounts.reduce((best, current) => {
        const bestUsagePercent = (best.usage.requests / best.usage.limit) * 100
        const currentUsagePercent = (current.usage.requests / current.usage.limit) * 100
        return currentUsagePercent < bestUsagePercent ? current : best
      })

      selectAccount(bestAccount)
    }

    const handleRowClick = (row) => {
      selectAccount(row)
    }

    return {
      // 响应式数据
      searchKeyword,
      statusFilter,
      selectedAccount,
      validatingAccountId,

      // 计算属性
      activeAccountsCount,
      warningAccountsCount,
      limitedAccountsCount,
      filteredAccounts,

      // 方法
      getStatusTagType,
      getStatusText,
      getUsagePercentage,
      getUsageStatus,
      formatDate,
      selectAccount,
      validateAccount,
      selectBestAccount,
      handleRowClick
    }
  }
}
</script>

<style scoped>
.account-panel {
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

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.active {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: white;
}

.stat-card.warning {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #d25f00;
}

.stat-card.limited {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: #c53030;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-controls {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.accounts-list {
  margin-bottom: 24px;
}

.email-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-avatar {
  flex-shrink: 0;
}

.email-info {
  flex: 1;
  min-width: 0;
}

.email-address {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.account-name {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.usage-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.usage-text {
  font-size: 12px;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.selected-account {
  margin-top: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-icon {
  color: #f39c12;
}

.selected-account-content {
  padding-top: 16px;
}

.account-detail {
  display: flex;
  align-items: center;
  gap: 16px;
}

.account-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
}

.account-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.account-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-label {
  min-width: 70px;
  font-weight: 500;
  color: #606266;
}

.stat-value {
  color: #303133;
  font-weight: 500;
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
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .action-buttons .el-button {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  .account-detail {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .stat-item {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}

/* 表格行悬停效果 */
.el-table tbody tr {
  cursor: pointer;
}

.el-table tbody tr:hover {
  background-color: #f5f7fa;
}

/* 进度条动画 */
.el-progress {
  transition: all 0.3s ease;
}
</style>
