<template>
  <div id="app">
    <!-- 自定义标题栏 -->
    <CustomTitleBar />

    <!-- 用户协议弹窗 - 首次打开时强制显示 -->
    <UserAgreementDialog
      :visible="showAgreementDialog"
      @agree="handleAgreementAgree"
      @disagree="handleAgreementDisagree"
    />
    
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
                    @keyup.enter="() => validateLicense(true)"
                  >
                    <template #append>
                      <el-button
                        type="primary"
                        @click="() => validateLicense(true)"
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
                  <div class="account-item" v-if="quotaFull">
                    <span class="account-label">额度状态</span>
                    <span class="account-value" style="color: #f56c6c;">已用完，请续杯</span>
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

              <!-- 无感换号开关 -->
              <div class="seamless-toggle-container">
                <div class="seamless-toggle-row">
                  <div class="seamless-toggle-label">
                    <span class="label-text">无感换号</span>
                    <span class="label-desc">额度用完后自动续杯</span>
                  </div>
                  <el-switch
                    v-model="seamlessEnabled"
                    :disabled="!isLicenseValid"
                    active-color="#13ce66"
                    inactive-color="#dcdfe6"
                    @change="handleSeamlessToggle"
                  />
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
                  :disabled="!isLicenseValid || seamlessEnabled"
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
import UserAgreementDialog from './components/UserAgreementDialog.vue'
import { getDefaultPurchaseUrl, getPurchaseMessage } from './config/purchase.js'
import { API_CONFIG, getApiUrl, getAccountByCodeUrl, APP_VERSION } from './config/api.js'

export default {
  name: 'App',
  components: {
    CustomTitleBar,
    MachineIdDebug,
    UserAgreementDialog
  },
  setup() {
    // 🔧 响应式数据
    const licenseCode = ref('')
    const licenseData = ref(null)
    const systemNotices = ref([])
    const debugMode = ref(false)
    const showDebugPanel = ref(false)
    const showPathDialog = ref(false)
    const showAgreementDialog = ref(false)
    const faqUrl = ref('https://www.yuque.com/u65041907/qqq1xv/esbwnffw2qt4sfof?singleDoc# 《常见问题》')
    const cursorExecutablePath = ref('')
    const cursorEditorVersion = ref('未知')
    const appVersion = ref(APP_VERSION || '1.7.1')
    const encryptionEnabled = ref(false)
    const seamlessEnabled = ref(false)
    let autoSwitchInProgress = false
    
    const SEAMLESS_STORAGE_KEY = 'seamless_mode_enabled'
    
    const loading = reactive({
      license: false,
      refresh: false,
      operations: false,
      purchase: false,
      pathSelection: false,
      diagnosis: false
    })

    const quotaFull = ref(false)

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

    const validateLicense = async (fromUserClick = false) => {
      if (!licenseCode.value.trim()) return ElMessage.warning('请输入授权码')
      const prevCode = licenseData.value?.code || ''
      loading.license = true
      try {
        const result = await licenseService.validateLicense(licenseCode.value)
        if (result.success) {
          licenseData.value = result.data
          await storageService.saveLicenseCode(licenseCode.value)
          // 只有用户手动点击"验证"按钮时才关闭无感换号
          if (fromUserClick && seamlessEnabled.value) {
            seamlessEnabled.value = false
            try { localStorage.setItem(SEAMLESS_STORAGE_KEY, 'false') } catch (_) {}
            ElMessage.info('检测到授权码验证，已自动关闭无感换号')
          }
          if (fromUserClick) {
            ElMessage.success('✅ 授权码验证成功')
          }
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
        const macAddress = await deviceService.getMacAddress()
        const oldEmail = currentAccount.email || 'no-current-account'
        const apiUrl = getAccountByCodeUrl(licenseCode.value, macAddress, oldEmail)

        let accessToken, refreshToken, email, sessionToken

        if (encryptionEnabled.value) {
          const accountRes = await window.electronAPI.fetchAccountEncrypted(apiUrl)
          if (!accountRes || !accountRes.success || !accountRes.accessToken) {
            ElMessage.error('❌ 获取新账号失败')
            loading.operations = false
            return
          }
          accessToken = accountRes.accessToken
          refreshToken = accountRes.refreshToken
          email = accountRes.email
          sessionToken = ''
        } else {
          const accountRes = await accountService.getAccountByCode(licenseCode.value, oldEmail)
          if (!accountRes || !accountRes.success || !accountRes.data) {
            ElMessage.error('❌ 获取新账号失败: ' + (accountRes?.error || '未知错误'))
            loading.operations = false
            return
          }
          const newAccount = accountRes.data
          email = newAccount.email
          accessToken = newAccount.accessToken || ''
          refreshToken = newAccount.refreshToken || accessToken || ''
          sessionToken = newAccount.sessionToken || newAccount.token || newAccount.WorkosCursorSessionToken
        }

        // ── Step 1: Write auth to SQLite (state.vscdb) ──
        if (!cursorService.cursorPaths) await cursorService.initialize()
        const sqlitePath = cursorService.cursorPaths?.sqlite
        if (sqlitePath) {
          const queries = [
            { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/cachedEmail', email] },
            { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/cachedSignUpType', 'Auth_0'] },
            { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/isAuthenticated', 'true'] },
            { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursor.email', email] },
            { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursor.accessToken', accessToken] },
          ]
          if (accessToken) {
            queries.push({ sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/accessToken', accessToken] })
            queries.push({ sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/refreshToken', refreshToken] })
          }
          if (window.electronAPI?.sqliteBatchRun) {
            await window.electronAPI.sqliteBatchRun(sqlitePath, queries)
          }
        }

        // ── Step 2: Write auth to storage.json ──
        const storagePath = cursorService.cursorPaths?.storage
        if (storagePath && window.electronAPI?.fsReadFile && window.electronAPI?.fsWriteFile) {
          try {
            const raw = await window.electronAPI.fsReadFile(storagePath)
            const config = JSON.parse(raw)
            Object.assign(config, {
              'cursorAuth/cachedEmail': email,
              'cursorAuth/accessToken': accessToken,
              'cursorAuth/refreshToken': refreshToken,
              'cursorAuth/cachedSignUpType': 'Auth_0',
              'cursor.email': email,
              'cursor.accessToken': accessToken,
            })
            await window.electronAPI.fsWriteFile(storagePath, JSON.stringify(config, null, 4))
          } catch (e) {
            console.warn('storage.json 写入失败（可跳过）:', e)
          }
        }

        // ── Step 3: Reset machine IDs ──
        const resetRes = await cursorService.resetMachineId()
        if (!resetRes.success) {
          console.warn('机器码重置警告:', resetRes.error)
        }

        // ── Step 4: Seamless switch ──
        // Start HTTP server (always needed for injection script to poll)
        if (window.electronAPI?.startHttpServer) {
          await window.electronAPI.startHttpServer(36529)
        }

        // Check if workbench injection is already loaded in Cursor
        const seamlessStatus = window.electronAPI?.getSeamlessStatus
          ? await window.electronAPI.getSeamlessStatus()
          : { injected: false }

        if (!seamlessStatus.injected) {
          // First time: inject workbench + restart Cursor to load the injection script
          if (window.electronAPI?.injectWorkbench) {
            await window.electronAPI.injectWorkbench()
          }
          if (window.electronAPI?.pushPendingSwitch) {
            await window.electronAPI.pushPendingSwitch(accessToken, refreshToken, email, sessionToken)
          }
          ElMessage.success('✅ 换号成功！首次需要重启 Cursor 以激活无感换号...')
          
          // 首次注入：检查 Cursor 是否在运行
          if (window.electronAPI?.checkCursorProcess) {
            const status = await window.electronAPI.checkCursorProcess()
            if (status.running) {
              // Cursor 正在运行 → 重启以加载注入脚本
              if (window.electronAPI?.reloadCursorWindow) {
                await window.electronAPI.reloadCursorWindow()
              }
            } else {
              // Cursor 未运行 → 直接启动
              if (window.electronAPI?.startCursor) {
                await window.electronAPI.startCursor()
                ElMessage.info('Cursor 未运行，正在启动...')
              }
            }
          }
        } else {
          // Subsequent times: just push tokens, injection script picks up in 1 second
          if (window.electronAPI?.pushPendingSwitch) {
            await window.electronAPI.pushPendingSwitch(accessToken, refreshToken, email, sessionToken)
          }
          ElMessage.success('✅ 换号成功！已推送新账号，1秒后自动生效，无需重启...')
          
          // 已经注入，只需确保 Cursor 在运行（不重启）
          if (window.electronAPI?.checkCursorProcess) {
            const status = await window.electronAPI.checkCursorProcess()
            if (!status.running && window.electronAPI?.startCursor) {
              // 只有未运行时才启动，不调用 reload
              await window.electronAPI.startCursor()
              ElMessage.info('Cursor 未运行，正在启动...')
            }
          }
        }

        await getCurrentAccount()
        await validateLicense()
      } catch (e) {
        console.error('续杯失败:', e)
        // 检查是否是 Cursor 路径未找到的错误
        if (e && e.message && (e.message.includes('Cursor executable not found') || e.message.includes('workbench.desktop.main.js not found') || e.message.includes('No cursor executable found'))) {
          ElMessage.error('❌ 未找到 Cursor 路径，请点击顶部"路径配置"手动设置 Cursor.exe 路径')
          // 如果是因为未找到路径导致的续杯失败，由于并没有真正续杯，最好把开关置回 false
          seamlessEnabled.value = false
        } else if (typeof e === 'string' && (e.includes('Cursor executable not found') || e.includes('workbench.desktop.main.js not found') || e.includes('No cursor executable found'))) {
          ElMessage.error('❌ 未找到 Cursor 路径，请点击顶部"路径配置"手动设置 Cursor.exe 路径')
          seamlessEnabled.value = false
        } else {
          const errMsg = typeof e === 'string' ? e : (e.message || String(e))
          ElMessage.error('续杯失败: ' + errMsg)
        }
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
        if (result.success) {
          encryptionEnabled.value = result.data?.encryptionEnabled === true
          if (result.data?.needsUpdate) {
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
          await storageService.saveCursorPath(result.filePath)
          if (cursorService) {
            cursorService.userCursorExecutablePath = result.filePath
            if (cursorService.cursorPaths) cursorService.cursorPaths.executable = result.filePath
          }
          ElMessage.success('路径设置成功')
          showPathDialog.value = false
        }
      } finally { loading.pathSelection = false }
    }

    const clearCursorPath = async () => {
      cursorExecutablePath.value = ''
      await storageService.saveCursorPath('')
      if (cursorService) {
        cursorService.userCursorExecutablePath = null
      }
      ElMessage.info('已清除自定义路径，将使用默认路径')
    }

    const loadSeamlessMode = () => {
      // Always start with seamless OFF — no persistence
      seamlessEnabled.value = false
    }

    const handleSeamlessToggle = async (val) => {
      console.log('🔍 handleSeamlessToggle:', val)

      if (val) {
        await ElMessageBox.alert(
          '开启无感换号后会自动在账号额度用完后进行换号，无需手动续杯。' +
          '<br><br>' +
          '<span style="color:red;font-weight:bold;">⚠️ 首次开启会重启 Cursor 一次，之后无需重启，额度用完自动切换账号。</span>',
          '无感换号',
          { confirmButtonText: '知道了', type: 'info', dangerouslyUseHTMLString: true }
        )

        try {
          // ── Step 1: Fetch a new account ──
          if (!isLicenseValid.value) {
            ElMessage.warning('授权码无效，请先激活')
            return
          }
          if (!cursorService.cursorPaths) await cursorService.initialize()
          const macAddress = await deviceService.getMacAddress()
          const apiUrl = getAccountByCodeUrl(licenseCode.value, macAddress, currentAccount.email || 'no-current-account')

          let accessToken, refreshToken, email, sessionToken
          if (encryptionEnabled.value) {
            const accountRes = await window.electronAPI.fetchAccountEncrypted(apiUrl)
            if (!accountRes || !accountRes.success || !accountRes.accessToken) {
              ElMessage.error('❌ 获取新账号失败')
              return
            }
            accessToken = accountRes.accessToken
            refreshToken = accountRes.refreshToken
            email = accountRes.email
            sessionToken = ''
          } else {
            const accountRes = await accountService.getAccountByCode(licenseCode.value, currentAccount.email || 'no-current-account')
            if (!accountRes || !accountRes.success || !accountRes.data) {
              ElMessage.error('❌ 获取新账号失败: ' + (accountRes?.error || '未知错误'))
              return
            }
            const newAccount = accountRes.data
            email = newAccount.email
            accessToken = newAccount.accessToken || ''
            refreshToken = newAccount.refreshToken || accessToken || ''
            sessionToken = newAccount.sessionToken || newAccount.token || newAccount.WorkosCursorSessionToken
          }

          // ── Step 2: Write auth to SQLite ──
          const sqlitePath = cursorService.cursorPaths?.sqlite
          if (sqlitePath) {
            const queries = [
              { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/cachedEmail', email] },
              { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/cachedSignUpType', 'Auth_0'] },
              { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/isAuthenticated', 'true'] },
              { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursor.email', email] },
              { sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursor.accessToken', accessToken] },
            ]
            if (accessToken) {
              queries.push({ sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/accessToken', accessToken] })
              queries.push({ sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", params: ['cursorAuth/refreshToken', refreshToken] })
            }
            if (window.electronAPI?.sqliteBatchRun) {
              await window.electronAPI.sqliteBatchRun(sqlitePath, queries)
            }
          }

          // ── Step 3: Write auth to storage.json ──
          const storagePath = cursorService.cursorPaths?.storage
          if (storagePath && window.electronAPI?.fsReadFile && window.electronAPI?.fsWriteFile) {
            try {
              const raw = await window.electronAPI.fsReadFile(storagePath)
              const config = JSON.parse(raw)
              Object.assign(config, {
                'cursorAuth/cachedEmail': email,
                'cursorAuth/accessToken': accessToken,
                'cursorAuth/refreshToken': refreshToken,
                'cursorAuth/cachedSignUpType': 'Auth_0',
                'cursor.email': email,
                'cursor.accessToken': accessToken,
              })
              await window.electronAPI.fsWriteFile(storagePath, JSON.stringify(config, null, 4))
            } catch (e) {
              console.warn('storage.json 写入失败（可跳过）:', e)
            }
          }

          // ── Step 4: Start HTTP server & push tokens ──
          if (window.electronAPI?.startHttpServer) {
            await window.electronAPI.startHttpServer(36529)
          }
          if (window.electronAPI?.pushPendingSwitch) {
            await window.electronAPI.pushPendingSwitch(accessToken, refreshToken, email, sessionToken)
          }

          // ── Step 5: Inject workbench if needed, then ensure Cursor running ──
          const seamlessStatus = window.electronAPI?.getSeamlessStatus
            ? await window.electronAPI.getSeamlessStatus()
            : { injected: false }

          if (!seamlessStatus.injected) {
            // 首次开启无感换号：注入脚本 + 启动/重启 Cursor
            if (window.electronAPI?.injectWorkbench) {
              await window.electronAPI.injectWorkbench()
            }
            ElMessage.info('首次开启无感换号，正在注入脚本...')
            
            // 检查 Cursor 是否在运行
            if (window.electronAPI?.checkCursorProcess) {
              const status = await window.electronAPI.checkCursorProcess()
              if (status.running) {
                // Cursor 正在运行 → 重启以加载注入脚本
                if (window.electronAPI?.reloadCursorWindow) {
                  await window.electronAPI.reloadCursorWindow()
                  ElMessage.info('正在重启 Cursor 以加载注入脚本...')
                }
              } else {
                // Cursor 未运行 → 直接启动
                if (window.electronAPI?.startCursor) {
                  await window.electronAPI.startCursor()
                  ElMessage.info('Cursor 未运行，正在启动...')
                }
              }
            }
          } else {
            // 已经注入，只需确保 Cursor 在运行（不重启）
            if (window.electronAPI?.checkCursorProcess) {
              const status = await window.electronAPI.checkCursorProcess()
              if (!status.running && window.electronAPI?.startCursor) {
                await window.electronAPI.startCursor()
                ElMessage.info('Cursor 未运行，正在启动...')
              } else if (status.running) {
                ElMessage.success('✅ 无感换号已开启，Cursor 无需重启')
              }
            }
          }

          await getCurrentAccount()
        } catch (e) {
          console.warn('无感换号初始化失败:', e)
          // 修复：Tauri 返回的错误可能是字符串，也可能是包含 message 的 Error 对象
          const errorMsg = typeof e === 'string' ? e : (e.message || String(e))
          
          // 检查是否是 Cursor 路径未找到的错误
          if (errorMsg.includes('Cursor executable not found') || errorMsg.includes('workbench.desktop.main.js not found') || errorMsg.includes('No cursor executable found')) {
            ElMessage.error('❌ 未找到 Cursor 路径，请点击顶部"路径配置"手动设置 Cursor.exe 路径')
            seamlessEnabled.value = false
          } else {
            ElMessage.error('无感换号初始化失败: ' + errorMsg)
            seamlessEnabled.value = false
          }
        }
      }
    }

    const ensureCursorRunning = async () => {
      if (window.electronAPI?.checkCursorProcess) {
        const status = await window.electronAPI.checkCursorProcess()
        if (status.running) {
          if (window.electronAPI?.reloadCursorWindow) {
            await window.electronAPI.reloadCursorWindow()
          }
        } else {
          if (window.electronAPI?.startCursor) {
            await window.electronAPI.startCursor()
          }
        }
      }
    }

    // 用户协议相关逻辑
    const AGREEMENT_STORAGE_KEY = 'user_agreement_accepted'

    const checkAgreementStatus = () => {
      try {
        const accepted = localStorage.getItem(AGREEMENT_STORAGE_KEY)
        if (!accepted) {
          showAgreementDialog.value = true
        }
      } catch (e) {
        // localStorage 不可用时，每次都显示
        showAgreementDialog.value = true
      }
    }

    const handleAgreementAgree = () => {
      try {
        localStorage.setItem(AGREEMENT_STORAGE_KEY, Date.now().toString())
      } catch (e) {
        console.warn('无法保存协议同意状态:', e)
      }
      showAgreementDialog.value = false
    }

    const handleAgreementDisagree = () => {
      // 不同意则关闭应用
      if (window.electronAPI && window.electronAPI.closeWindow) {
        window.electronAPI.closeWindow()
      } else {
        window.close()
      }
    }

    onMounted(async () => {
      // 首次打开时检查用户协议
      checkAgreementStatus()

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

      // 初始化调试模式
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

      // 轮询查询额度状态（每次实际调用额度 API）
      setInterval(async () => {
        if (!seamlessEnabled.value) {
          console.log('[quota] 无感换号未开启，跳过轮询检查')
          return
        }
        console.log('[quota] 开始轮询检查额度...')
        try {
          if (window.electronAPI && window.electronAPI.getQuotaStatus) {
            const d = await window.electronAPI.getQuotaStatus()
            // 支持多种数据格式
            // 格式1: { response: { parsed: { quotaFull: true } } } (debug_quota_check)
            // 格式2: { parsed: { quotaFull: true } }
            // 格式3: { quotaFull: true }
            const full = d.response?.parsed?.quotaFull ?? d.parsed?.quotaFull ?? d.quotaFull ?? false
            quotaFull.value = full
            console.log('[quota] 检查结果:', d)
            console.log('[quota] 解析的 full 值:', full, '类型:', typeof full)
            // Auto-switch when seamless mode is on and quota is exhausted
            if (full && !autoSwitchInProgress) {
              autoSwitchInProgress = true
              console.log('[quota] 额度已满，触发自动续杯...')
              ElMessage.info('🔄 检测到额度已用完，自动续杯中...')
              await renewPro()
              autoSwitchInProgress = false
              console.log('[quota] 自动续杯完成')
            } else if (full && autoSwitchInProgress) {
              console.log('[quota] 额度已满但续杯正在进行中，跳过')
            } else {
              console.log('[quota] 额度未满（full='+full+'），继续监控')
            }
          }
        } catch (e) {
          console.error('[quota] 轮询检查出错:', e)
        }
      }, 15000)

      // Seamless always starts OFF — no persistence
      seamlessEnabled.value = false
    })

    return {
      licenseCode, licenseData, systemNotices, debugMode, showDebugPanel, showPathDialog,
      showAgreementDialog, faqUrl, cursorExecutablePath, cursorEditorVersion, loading, currentAccount, quotaFull, encryptionEnabled,
      seamlessEnabled,
      cursorVersion, licenseStatus, isLicenseValid,
      expiryTime, expiryClass, daysRemaining, totalDays, usagePercentage, progressColor,
      todaySwitchCount, validateLicense, openPurchasePage, renewPro, openFaqUrl,
      forceRefreshUI, selectCursorPath, clearCursorPath, getCurrentAccount,
      handleAgreementAgree, handleAgreementDisagree, handleSeamlessToggle
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

/* 无感换号开关 */
.seamless-toggle-container {
  margin-top: 16px;
  padding: 12px 20px;
  background: linear-gradient(145deg, #f0fff4 0%, #e6ffed 100%);
  border: 1px solid #c6f6d5;
  border-radius: 14px;
  transition: all 0.3s ease;
}
.seamless-toggle-container:hover {
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.12);
}
.seamless-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.seamless-toggle-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.seamless-toggle-label .label-text {
  font-size: 15px;
  font-weight: 700;
  color: #276749;
}
.seamless-toggle-label .label-desc {
  font-size: 12px;
  color: #68d391;
}
</style>
