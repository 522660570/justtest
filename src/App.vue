<template>
  <div id="app">
    <!-- 自定义标题栏 -->
    <CustomTitleBar />
    
    <!-- 机器码调试面板 - 仅在调试模式下可用 -->
    <el-dialog
      v-if="debugMode"
      v-model="showDebugPanel"
      title="🔍 机器码调试工具"
      width="90%"
      :close-on-click-modal="false"
    >
      <MachineIdDebug />
      <template #footer>
        <el-button @click="showDebugPanel = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- Cursor 路径配置对话框 -->
    <el-dialog
      v-model="showPathDialog"
      title="⚙️ Cursor 路径配置"
      width="560px"
      :close-on-click-modal="false"
      class="path-dialog"
    >
      <div class="path-config-section">
        <div class="config-header">
          <p class="config-desc">
            当自动检测不到 Cursor.exe 时，可以在这里手动指定安装路径。
          </p>
        </div>
        
        <div class="current-path-display">
          <div class="path-label">📁 当前路径</div>
          <div class="path-value" :title="cursorExecutablePath || '未设置'">
            {{ cursorExecutablePath || '未设置（使用自动检测）' }}
          </div>
        </div>

        <div class="path-actions">
          <el-button
            type="primary"
            size="large"
            @click="selectCursorPath"
            :loading="loading.pathSelection"
            class="select-path-btn"
          >
            <template v-if="loading.pathSelection">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>选择中...</span>
            </template>
            <template v-else>
              📂 选择 Cursor.exe 文件
            </template>
          </el-button>
          <el-button
            v-if="cursorExecutablePath"
            size="large"
            @click="clearCursorPath"
            class="clear-path-btn"
          >
            🗑️ 清除路径
          </el-button>
        </div>

        <div class="priority-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>优先级：手动配置 > 运行中进程 > 自动检测</span>
        </div>
      </div>
    </el-dialog>
    
    
    <div class="app-container">
      <!-- 主内容区域 -->
      <div class="main-content">
        <div class="content-grid">
          <!-- 左侧：授权激活与说明 -->
          <div class="left-panel">
            <el-card class="left-main-card" shadow="hover">
              <!-- FAQ 入口 -->
              <div class="faq-integrated-entry" @click="openFaqUrl">
                <el-icon class="icon-pulse"><QuestionFilled /></el-icon>
                <div class="faq-text">
                  <span class="label">常见问题与报错指南</span>
                  <span class="desc">遇到问题点击这里，解决 99% 的常见报错</span>
                </div>
                <el-icon class="arrow"><ArrowRight /></el-icon>
              </div>

              <div class="divider-line"></div>

              <!-- 授权码激活区 -->
              <div class="activation-section">
                <div class="section-header-compact">
                  <div class="step-dot">1</div>
                  <h3>输入授权码激活</h3>
                </div>
                
                <div class="input-container">
                  <el-input
                    v-model="licenseCode"
                    placeholder="请输入授权码"
                    size="large"
                    :disabled="loading.license"
                    @keyup.enter="validateLicense"
                  >
                    <template #append>
                      <el-button
                        type="primary"
                        @click="validateLicense"
                        :loading="loading.license"
                      >
                        验证
                      </el-button>
                    </template>
                  </el-input>
                </div>

                <div class="premium-button-wrapper">
                  <el-button
                    type="warning"
                    size="large"
                    @click="openPurchasePage"
                    :loading="loading.purchase"
                    class="premium-purchase-btn"
                  >
                    <el-icon><ShoppingCart /></el-icon>
                    <span>立即购买授权码</span>
                  </el-button>
                  <p class="guide-tip">验证成功后，点击右侧“一键续杯”即可换号</p>
                </div>
              </div>

              <div class="divider-line"></div>

              <!-- 使用须知/系统公告 -->
              <div class="instructions-section">
                <div class="section-header-compact">
                  <el-icon><InfoFilled /></el-icon>
                  <h3>使用须知</h3>
                </div>
                <div class="notices-list">
                  <div 
                    v-for="notice in systemNotices.slice(0, 3)" 
                    :key="notice.id"
                    :class="['notice-item-compact', `type-${notice.noticeType}`]"
                  >
                    <span class="notice-title">{{ notice.title }}</span>
                    <p class="notice-msg">{{ notice.content }}</p>
                  </div>
                  <div class="static-instruction" v-if="!systemNotices.length">
                    <p>1. 请确保您的卡密在有效期内</p>
                    <p>2. 如遇续杯失败，请尝试重新登录 Cursor 账号（登录一次自己的账号）</p>
                    <p>3. 遇到技术问题请联系客服 QQ: 522660570</p>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 右侧：状态显示与续杯按钮 -->
          <div class="right-panel">
            <el-card class="right-main-card" shadow="hover">
              <div class="status-grid">
                <div class="status-item-grid">
                  <span class="status-label-grid">当前授权状态</span>
                  <div class="status-value-wrapper">
                    <el-tag 
                      :type="licenseStatus.statusColor" 
                      size="default"
                      class="status-tag"
                    >
                      {{ licenseStatus.statusText }}
                    </el-tag>
                    <!-- 刷新按钮 -->
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="forceRefreshUI"
                      style="margin-left: 8px;"
                    >
                      🔄
                    </el-button>
                  </div>
                </div>

                <div class="status-item-grid">
                  <span class="status-label-grid">软件版本</span>
                  <span class="status-value">v{{ cursorVersion }}</span>
                </div>

                <div class="status-item-grid">
                  <span class="status-label-grid">Cursor版本</span>
                  <div class="status-value-wrapper">
                    <span class="status-value cursor-version">{{ cursorEditorVersion }}</span>
                    <el-button
                      type="warning"
                      size="small"
                      @click="showPathDialog = true"
                      class="path-config-btn"
                    >
                      ⚙️ 路径配置
                    </el-button>
                  </div>
                </div>



                <div class="status-item-grid">
                  <span class="status-label-grid">到期时间</span>
                  <span class="status-value" :class="expiryClass">{{ expiryTime }}</span>
                </div>
              </div>

              <!-- 当前Cursor登录账号 -->
              <div class="current-account-info">
                <div class="account-info-header">
                  <h4>当前Cursor登录账号</h4>
                </div>
                <div class="account-details">
                  <div class="account-item">
                    <span class="account-label">邮箱</span>
                    <span v-if="currentAccount.loading" class="account-value loading">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      正在获取...
                    </span>
                    <span v-else-if="currentAccount.email" class="account-value email">
                      {{ currentAccount.email }}
                    </span>
                    <span v-else class="account-value no-account">未检测到登录账号</span>
                  </div>
                  <div class="account-item">
                    <span class="account-label">今日换号次数</span>
                    <span class="account-value switch-count">{{ todaySwitchCount }} 次</span>
                  </div>
                </div>
              </div>

              <!-- 卡密有效进度 -->
              <div class="current-account-info">
                <h4>卡密有效期</h4>
                <div class="validity-grid">
                  <div class="validity-item">
                    <span class="validity-label">{{ licenseData?.cardType === 2 ? '剩余次数' : '剩余天数' }}</span>
                    <span class="validity-value">{{ daysRemaining }}</span>
                  </div>
                  <div class="validity-item">
                    <span class="validity-label">{{ licenseData?.cardType === 2 ? '总共次数' : '总有效期' }}</span>
                    <span class="validity-value">{{ totalDays }}</span>
                  </div>
                </div>
                <div class="progress-section">
                  <div class="progress-info"><span>{{ usagePercentage }}%</span></div>
                  <el-progress :percentage="usagePercentage" :color="progressColor" :show-text="false" />
                </div>
              </div>

              <!-- 一键续杯大按钮 -->
              <div class="renewal-container">
                <el-button
                  type="success"
                  size="large"
                  @click="renewPro"
                  :loading="loading.operations"
                  class="renewal-button"
                  :disabled="!isLicenseValid"
                >
                  <el-icon v-if="!loading.operations"><MagicStick /></el-icon>
                  <span v-if="loading.operations">正在续杯中...</span>
                  <span v-else>一键续杯</span>
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import CursorService from './services/CursorService'
import AccountService from './services/AccountService'
import LicenseService from './services/LicenseService'
import StorageService from './services/StorageService'
import DeviceService from './services/DeviceService'
import VersionService from './services/VersionService'
import CustomTitleBar from './components/CustomTitleBar.vue'
import MachineIdDebug from './components/MachineIdDebug.vue'
import { getDefaultPurchaseUrl, getPurchaseMessage } from './config/purchase.js'
import { API_CONFIG, getApiUrl, APP_VERSION } from './config/api.js'

export default {
  name: 'App',
  components: {
    CustomTitleBar,
    MachineIdDebug
  },
  setup() {
    // 🔧 响应式数据
    const licenseCode = ref('')
    const licenseData = ref(null)
    const systemNotices = ref([])
    const debugMode = ref(false)
    const showDebugPanel = ref(false)
    const showPathDialog = ref(false)
    const faqUrl = ref('https://www.yuque.com/u65041907/qqq1xv/esbwnffw2qt4sfof?singleDoc# 《常见问题》')
    const cursorExecutablePath = ref('')
    const cursorEditorVersion = ref('未知')
    const appVersion = ref(APP_VERSION || '1.7.1')
    
    const loading = reactive({
      license: false,
      refresh: false,
      operations: false,
      purchase: false,
      pathSelection: false,
      diagnosis: false
    })

    const currentAccount = reactive({
      loading: false,
      email: null,
      isAuthenticated: false,
      hasAccessToken: false
    })

    const cursorService = new CursorService()
    const accountService = new AccountService()
    const licenseService = new LicenseService()
    const storageService = new StorageService()
    const deviceService = new DeviceService()
    const versionService = new VersionService()

    // 🔧 计算属性
    const cursorVersion = computed(() => appVersion.value)
    const licenseStatus = computed(() => licenseService.formatLicenseStatus(licenseData.value))
    const isLicenseValid = computed(() => licenseData.value?.status === 'valid')
    const expiryTime = computed(() => licenseData.value?.cardType === 2 ? '无期限' : (licenseData.value?.expiryDate || '未激活'))
    const expiryClass = computed(() => isLicenseValid.value ? 'text-success' : 'text-danger')
    
    const daysRemaining = computed(() => {
      if (!licenseData.value) return '---'
      return licenseData.value.cardType === 2 ? ` ${licenseData.value.remainingSwitches} 次` : ` ${licenseData.value.daysRemaining} 天`
    })

    const totalDays = computed(() => {
      if (!licenseData.value) return '---'
      return licenseData.value.cardType === 2 ? ` ${licenseData.value.totalSwitches} 次` : ` ${licenseData.value.totalDays} 天`
    })

    const usagePercentage = computed(() => {
      if (!licenseData.value) return 0
      if (licenseData.value.cardType === 2) {
        return Math.round(((licenseData.value.usedSwitches || 0) / (licenseData.value.totalSwitches || 1)) * 100)
      }
      const usedDays = Math.max(0, (licenseData.value.totalDays || 30) - (licenseData.value.daysRemaining || 0))
      return Math.round((usedDays / (licenseData.value.totalDays || 30)) * 100)
    })

    const progressColor = computed(() => {
      const p = usagePercentage.value
      return p < 50 ? '#67c23a' : (p < 80 ? '#e6a23c' : '#f56c6c')
    })

    const todaySwitchCount = computed(() => licenseData.value?.todaySwitchCount || 0)

    // 🔧 业务逻辑
    const openFaqUrl = () => {
      if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal(faqUrl.value)
      } else {
        window.open(faqUrl.value, '_blank')
      }
    }

    const openPurchasePage = () => {
      const url = getDefaultPurchaseUrl()
      if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal(url)
      } else {
        window.open(url, '_blank')
      }
    }

    const validateLicense = async () => {
      if (!licenseCode.value.trim()) return ElMessage.warning('请输入授权码')
      loading.license = true
      try {
        const result = await licenseService.validateLicense(licenseCode.value)
        if (result.success) {
          licenseData.value = result.data
          await storageService.saveLicenseCode(licenseCode.value)
          ElMessage.success('✅ 授权码验证成功')
        } else {
          ElMessage.error('❌ ' + result.error)
        }
      } catch (e) {
        ElMessage.error('验证出错: ' + e.message)
      } finally {
        loading.license = false
      }
    }

    const renewPro = async () => {
      if (!isLicenseValid.value) return ElMessage.warning('请先激活有效的授权码')
      loading.operations = true
      try {
        await cursorService.killCursorProcess()

        const oldEmail = currentAccount.email || 'no-current-account'
        const accountRes = await accountService.getAccountByCode(licenseCode.value, oldEmail)
        if (!accountRes || !accountRes.success || !accountRes.data) {
          ElMessage.error('❌ 获取新账号失败: ' + (accountRes?.error || '未知错误'))
          loading.operations = false
          return
        }
        
        const newAccount = accountRes.data
        const sessionToken = newAccount.sessionToken || newAccount.token || newAccount.WorkosCursorSessionToken

        const resetRes = await cursorService.resetMachineId()
        if (!resetRes.success) {
          console.warn('机器码重置发生警告 (此步骤可能被跳过): ' + resetRes.error)
        }

        const sqlitePath = cursorService.cursorPaths.sqlite
        const queries = [
          { query: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/cachedEmail', newAccount.email] },
          { query: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/cachedSignUpType', 'Auth_0'] },
          { query: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['WorkosCursorSessionToken', sessionToken] }
        ]
        
        if (window.electronAPI) {
          if (window.electronAPI.sqliteBatchRun) {
            await window.electronAPI.sqliteBatchRun(sqlitePath, queries)
          } else {
            for (const q of queries) {
              await window.electronAPI.sqliteQuery(sqlitePath, q.query, q.params)
            }
          }
        }

        await accountService.confirmAccountSwitch(licenseCode.value, newAccount.email)
        await cursorService.startCursor()

        console.log('🚀 续杯换号成功！')
        ElMessageBox.confirm(
          '续杯换号已完成，Cursor 正在启动。建议手动检查一下 Cursor 登录状态。',
          '🚀 续杯换号成功',
          {
            confirmButtonText: '查看常见问题',
            cancelButtonText: '知道了',
            type: 'success'
          }
        ).then(() => {
          openFaqUrl()
        }).catch(() => {})

        await getCurrentAccount()
        await validateLicense() 
      } catch (e) {
        console.error('续杯失败:', e)
        ElMessage.error('续杯失败: ' + e.message)
      } finally {
        loading.operations = false
      }
    }

    const getCurrentAccount = async () => {
      currentAccount.loading = true
      try {
        let email = null
        let hasAccessToken = false
        let isAuthenticated = false
        
        await cursorService.initialize()
        const sqlitePath = cursorService.cursorPaths?.sqlite
        if (sqlitePath && window.electronAPI) {
          const query = "SELECT value FROM ItemTable WHERE key IN ('cursorAuth/cachedSignUpType', 'cursorAuth/emails', 'cursorAuth/accessToken', 'cursorAuth/cachedEmail')"
          const results = await window.electronAPI.sqliteQuery(sqlitePath, query, [])
          if (results && results.length > 0) {
            for (const row of results) {
              try {
                const strVal = row.value ? row.value.toString() : ''
                if (strVal.includes('@')) {
                  const match = strVal.match(/[\w.-]+@[\w.-]+\.\w+/)
                  if (match && !email) email = match[0]
                }
                if (strVal.includes('accessToken')) hasAccessToken = true
              } catch(e) {}
            }
          }
        }
        if (email || hasAccessToken) isAuthenticated = true
        Object.assign(currentAccount, { email, hasAccessToken, isAuthenticated })
      } catch (e) {
        console.error('获取账号失败:', e)
      } finally {
        currentAccount.loading = false
      }
    }

    const forceRefreshUI = async () => {
      ElMessage.info('正在同步状态...')
      await getCurrentAccount()
      if (licenseCode.value) await validateLicense()
    }

    const checkForUpdates = async () => {
      try {
        const result = await versionService.checkVersion(appVersion.value)
        if (result.success && result.data?.needsUpdate) {
          const { latestVersion, updateInfo } = result.data
          faqUrl.value = result.data.faqUrl || faqUrl.value
          
          ElMessageBox.confirm(
            `发现新版本 v${latestVersion}，点击确定前往下载。`,
            '版本更新',
            { confirmButtonText: '立即下载', cancelButtonText: '稍后' }
          ).then(() => {
            if (updateInfo.downloadUrl) window.electronAPI.openExternal(updateInfo.downloadUrl)
          })
        }
      } catch (e) { console.error('检查更新失败:', e) }
    }

    const selectCursorPath = async () => {
      if (!window.electronAPI?.openFileDialog) return
      loading.pathSelection = true
      try {
        const result = await window.electronAPI.openFileDialog({ title: '选择 Cursor.exe' })
        if (result.success) {
          cursorExecutablePath.value = result.filePath
          ElMessage.success('路径设置成功')
          showPathDialog.value = false
        }
      } finally { loading.pathSelection = false }
    }

    const clearCursorPath = () => {
      cursorExecutablePath.value = ''
      ElMessage.info('已使用默认路径')
    }

    onMounted(async () => {
      const result = await storageService.loadLicenseCode()
      if (result && result.success && result.licenseCode) {
        licenseCode.value = result.licenseCode
        validateLicense()
      }
      getCurrentAccount()
      checkForUpdates()
      
      // 初始化获取 Cursor 状况和内部版本
      try {
        await cursorService.initialize()
        if (cursorService.cursorPaths?.executable) {
           cursorExecutablePath.value = cursorService.cursorPaths.executable
        }
        if (window.electronAPI) {
          const ver = await window.electronAPI.getCursorVersion()
          if (ver) cursorEditorVersion.value = typeof ver === 'object' ? ver.version : ver
        }
      } catch (e) {}

      // 初始化调试模式：从主进程获取 DEBUG_MODE，并监听 Ctrl+Shift+D 切换
      if (window.electronAPI) {
        try {
          debugMode.value = await window.electronAPI.getDebugMode()
        } catch (e) {}
        if (window.electronAPI.onToggleDebugPanel) {
          window.electronAPI.onToggleDebugPanel(() => {
            showDebugPanel.value = !showDebugPanel.value
          })
        }
      }
    })

    return {
      licenseCode, licenseData, systemNotices, debugMode, showDebugPanel, showPathDialog,
      faqUrl, cursorExecutablePath, cursorEditorVersion, loading, currentAccount,
      cursorVersion, licenseStatus, isLicenseValid,
      expiryTime, expiryClass, daysRemaining, totalDays, usagePercentage, progressColor,
      todaySwitchCount, validateLicense, openPurchasePage, renewPro, openFaqUrl,
      forceRefreshUI, selectCursorPath, clearCursorPath, getCurrentAccount
    }
  }
}
</script>

<style scoped>
.step-dot {
  width: 24px;
  height: 24px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}
/* 🎨 极致对称与全平铺最终修订版 */
.app-container {
  height: 100vh;
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
  font-family: 'Inter', 'PingFang SC', -apple-system, sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 10px 40px 20px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1100px;
  width: 100%;
  align-items: stretch; /* 确保左右高度一致 */
}

/* 统一两侧卡片外观 */
.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
}

.left-main-card, .right-main-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(25px);
  border-radius: 20px;
  border: none;
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 覆盖 el-card 的内部结构样式，避免双重 padding 且保证内部可以使用 flex 布局推到底部 */
:deep(.el-card__body) {
  padding: 24px !important;
  display: flex;
  flex-direction: column;
  flex: 1;
  box-sizing: border-box;
}

/* --- 左侧内容压缩 --- */
.faq-integrated-entry {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(24, 144, 255, 0.1);
}
.faq-integrated-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(24, 144, 255, 0.15);
  background: linear-gradient(135deg, #e6f3ff 0%, #d9edff 100%);
}
.icon-pulse {
  font-size: 24px;
  color: #1890ff;
  animation: pulse-icon 2s infinite;
}
@keyframes pulse-icon {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.faq-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.faq-text .label {
  font-size: 16px;
  font-weight: 700;
  color: #1890ff;
}

.faq-text .desc {
  font-size: 13px;
  color: #8c8c8c;
}

.divider-line {
  height: 1px;
  background: #f0f0f0;
  margin: 15px 0;
}

.activation-section {
  display: flex;
  flex-direction: column;
}

.section-header-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-header-compact h3 {
  margin: 0;
  font-size: 19px;
  color: #2c3e50;
}

.input-container {
  margin-bottom: 15px;
}

/* 购买按钮 */
.premium-button-wrapper {
  margin-top: 25px;
  text-align: center;
  padding-bottom: 10px;
}

.premium-purchase-btn {
  width: 100%;
  height: 52px !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  border-radius: 12px !important;
  border: none !important;
  background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%) !important;
  box-shadow: 0 6px 18px rgba(255, 75, 43, 0.35) !important;
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% { transform: scale(1); }
  50% { transform: scale(1.015); }
  100% { transform: scale(1); }
}

.guide-tip {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

/* 使用须知（公告栏）压缩 */
.instructions-section {
  padding-top: 5px;
}

.notice-item-compact {
  padding: 6px 10px;
  margin-bottom: 4px;
}

.notice-title { font-size: 14px; font-weight: 700; }
.notice-msg { font-size: 13px; }
.static-instruction p { font-size: 13px; margin: 4px 0; }

/* --- 右侧内容压缩 --- */
.status-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 6px;
  border-bottom: 1px solid #f5f5f5;
}

.status-label-grid { color: #8c8c8c; font-size: 15px; }
.status-value { font-weight: 600; font-size: 15px; color: #333; }

.current-account-info {
  background: linear-gradient(145deg, #ffffff 0%, #f8faff 100%);
  border: 1px solid #edf2f9;
  border-radius: 16px;
  padding: 16px 20px;
  margin-top: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.current-account-info:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.current-account-info h4 { 
  margin: 0 0 12px 0; 
  font-size: 15px; 
  color: #1a202c; 
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #edf2f9;
  padding-bottom: 8px;
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item { 
  font-size: 14px; 
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-label {
  color: #718096;
}

.account-value {
  font-weight: 500;
  color: #2d3748;
}

.account-status-tags {
  margin-top: 4px;
  display: flex;
  gap: 8px;
}

.validity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.validity-item {
  background: #fdfefe;
  border: 1px solid #f0f4f8;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.validity-label {
  font-size: 13px;
  color: #718096;
}

.validity-value { 
  font-size: 20px; 
  font-weight: 700; 
  color: #2b6cb0;
}

.progress-info {
  font-size: 13px;
  color: #718096;
  text-align: right;
  margin-bottom: 6px;
}

/* 续杯按钮 */
.renewal-container {
  margin-top: auto; /* 推到卡片最底部 */
  background: transparent;
  padding-top: 15px;
}

.renewal-button {
  width: 100%;
  height: 52px !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  border-radius: 14px !important;
  box-shadow: 0 6px 18px rgba(103, 194, 58, 0.3) !important;
}

/* 修正 */
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }

:deep(.path-config-btn) {
  padding: 4px 8px;
  height: 26px;
  font-size: 13px;
}

:deep(.el-progress-bar__outer) {
  height: 4px !important;
}

:deep(.status-tag) {
  height: 26px;
  padding: 0 8px;
  font-size: 14px;
}
</style>
