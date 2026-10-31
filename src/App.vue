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
            {{ isMac ? '当自动检测不到 Cursor 时，可以在这里手动指定 Cursor.app 应用程序路径。' : '当自动检测不到 Cursor.exe 时，可以在这里手动指定安装路径。' }}
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
              {{ isMac ? '📂 选择 Cursor 应用程序 (.app)' : '📂 选择 Cursor.exe 文件' }}
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

              <!-- ⚡ 激活无感换号（底层环境注入）独立开关 -->
              <div class="seamless-toggle-container main-patch-container">
                <div class="seamless-toggle-row">
                  <div class="seamless-toggle-label">
                    <span class="label-text">⚡ 激活无感换号</span>
                    <span class="label-desc">
                      <el-tag
                        size="small"
                        :type="isMainPatched ? 'success' : 'info'"
                        style="margin-right:4px;font-size:11px;"
                      >{{ isMainPatched ? '已激活' : '未激活' }}</el-tag>
                      必须先激活 · 才能换号
                    </span>
                  </div>
                  <el-button
                    :type="isMainPatched ? 'danger' : 'primary'"
                    size="small"
                    :loading="loadingPatch"
                    @click="toggleMainPatch"
                    class="patch-toggle-btn"
                  >
                    {{ isMainPatched ? '还原' : '激活' }}
                  </el-button>
                </div>
              </div>

              <!-- 无感换号开关 -->
              <div class="seamless-toggle-container">
                <div class="seamless-toggle-row">
                  <div class="seamless-toggle-label">
                    <span class="label-text">自动换号</span>
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
    const isMac = ref(false)
    const cursorEditorVersion = ref('未知')
    const appVersion = ref(APP_VERSION || '1.7.1')
    const encryptionEnabled = ref(false)
    const seamlessEnabled = ref(false)
    // ⚡ 激活无感换号 - 底层环境注入状态
    const isMainPatched = ref(false)
    const loadingPatch = ref(false)
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
      
      try {
        await ElMessageBox.confirm(
          '<span style="color:red;font-weight:bold;">⚠️ 续杯过程中将会强制关闭正在运行的 Cursor，请确保您的代码已经保存！</span><br><br>是否继续？',
          '一键续杯',
          { confirmButtonText: '确定续杯', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
        )
      } catch {
        return // 用户取消
      }

      loading.operations = true
      try {
        // ── Step 0: Ensure Cursor is killed first ──
        if (window.electronAPI?.killCursorProcess) {
          await window.electronAPI.killCursorProcess()
          // 稍等一会儿让进程完全退出
          await new Promise(resolve => setTimeout(resolve, 1500))
        }

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
          let injectSucceeded = false
          if (window.electronAPI?.injectWorkbench) {
            try {
              await window.electronAPI.injectWorkbench()
              injectSucceeded = true
            } catch (injectErr) {
              console.warn('注入无感换号脚本失败，将降级为重启换号模式:', injectErr)
              const injectErrStr = String((injectErr && injectErr.message) ? injectErr.message : (injectErr || ''))
              if (injectErrStr.includes('Read-only file system') || injectErrStr.includes('os error 30') || injectErrStr.includes('只读文件系统') || injectErrStr.includes('Volumes')) {
                ElMessage.warning('⚠️ 检测到 Cursor 位于只读卷（如 DMG 挂载镜像）或无写权限，已自动采用重启模式生效账号（建议将 Cursor 拖入“应用程序”文件夹）')
              } else {
                ElMessage.warning('⚠️ 无感换号注入未生效，已自动切换为重启模式生效账号')
              }
            }
          }

          if (injectSucceeded) {
            if (window.electronAPI?.pushPendingSwitch) {
              await window.electronAPI.pushPendingSwitch(accessToken, refreshToken, email, sessionToken)
            }
            ElMessage.success('✅ 换号成功！首次需要重启 Cursor 以激活无感换号...')
          } else {
            ElMessage.success('✅ 换号成功！正在重启 Cursor 使新账号生效...')
          }
          
          // 首次注入或降级模式：检查 Cursor 是否在运行并重启/启动
          if (window.electronAPI?.checkCursorProcess) {
            const status = await window.electronAPI.checkCursorProcess()
            if (status.running) {
              // Cursor 正在运行 → 重启以加载新账号
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
        const errStr = (e && e.message) ? e.message : String(e || '')
        if (errStr.includes('Cursor executable not found') || errStr.includes('workbench.desktop.main.js not found') || errStr.includes('No cursor executable found')) {
          ElMessage.error(`❌ 未找到 Cursor 路径，请点击顶部"路径配置"手动选择 ${isMac.value ? 'Cursor.app' : 'Cursor.exe'} 路径`)
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
        const dialogTitle = isMac.value ? '选择 Cursor 应用程序 (Cursor.app)' : '选择 Cursor.exe'
        const result = await window.electronAPI.openFileDialog({ title: dialogTitle })
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

    // ⚡ 激活无感换号 - 底层环境注入 & Pro权限解锁
    // 复用项目统一的 window.electronAPI 桥接（TauriBridge.js 已注入）
    const checkPatchStatus = async () => {
      try {
        if (window.electronAPI?.getSeamlessPatchStatus) {
          const status = await window.electronAPI.getSeamlessPatchStatus()
          isMainPatched.value = !!status?.is_patched
        }
      } catch (e) {
        console.warn('[MainPatch] 查询补丁状态失败:', e)
      }
    }

    const toggleMainPatch = async () => {
      if (loadingPatch.value) return
      loadingPatch.value = true
      try {
        if (!window.electronAPI) {
          ElMessage.warning('当前运行在浏览器模式，无法注入，请使用打包版 exe')
          return
        }
        if (isMainPatched.value) {
          // 还原
          await window.electronAPI.disableSeamlessPatch()
          isMainPatched.value = false
          ElMessage.success('✅ 已还原底层补丁，请重启 Cursor 生效')
        } else {
          // 激活：传入当前 licenseCode 作为 token
          await window.electronAPI.enableSeamlessPatch(licenseCode.value || '')
          isMainPatched.value = true
          ElMessage.success('激活成功')
        }
      } catch (e) {
        const msg = typeof e === 'string' ? e : (e.message || String(e))
        if (msg.includes('not found') || msg.includes('未找到')) {
          ElMessage.error('❌ 未找到 Cursor 安装路径，请先点击顶部"路径配置"手动指定')
        } else {
          ElMessage.error('❌ 操作失败: ' + msg)
        }
      } finally {
        loadingPatch.value = false
      }
    }

    const handleSeamlessToggle = async (val) => {
      console.log('🔍 handleSeamlessToggle:', val)

      if (val) {
        // 检查是否已激活底层注入
        if (!isMainPatched.value) {
          ElMessage.warning('请先点击"激活"按钮完成底层环境注入，再开启自动换号')
          seamlessEnabled.value = false
          return
        }

        await ElMessageBox.alert(
          '开启自动换号后会自动在账号额度用完后进行换号，无需手动续杯。<br><br>' +
          '<span style="color:red;font-weight:bold;">⚠️ 开启过程中将会强制关闭正在运行的 Cursor，请确保代码已保存！</span>',
          '自动换号',
          { confirmButtonText: '知道了', type: 'warning', dangerouslyUseHTMLString: true }
        )

        try {
          // ── Step 0: Ensure Cursor is killed first ──
          if (window.electronAPI?.killCursorProcess) {
            await window.electronAPI.killCursorProcess()
            // 稍等一会儿让进程完全退出
            await new Promise(resolve => setTimeout(resolve, 1500))
          }

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

          // ── Step 4: 写入 active_token（参考程序机制：注入脚本每500ms读取此文件获取 Bearer token）
          // enableSeamlessPatch 同步写入 active_token + force_reconnect + 刷新 auto_switch_on 心跳
          if (window.electronAPI?.enableSeamlessPatch) {
            await window.electronAPI.enableSeamlessPatch(accessToken)
            isMainPatched.value = true
          }

          // ── 启动 Rust 后台换号监控器（监听 quota_exhausted -> 自动换号） ──
          if (window.electronAPI?.startAutoSwitchMonitor) {
            await window.electronAPI.startAutoSwitchMonitor({
              licenseCode: licenseCode.value,
              oldEmail: email || currentAccount.email || 'no-current-account',
              apiBaseUrl: API_CONFIG.BASE_URL,
              sqlitePath: cursorService.cursorPaths?.sqlite || '',
              storagePath: cursorService.cursorPaths?.storage || '',
            })
          }

          // ── Step 5: 重启 Cursor 使新账号 + 新 active_token 生效 ──
          if (window.electronAPI?.checkCursorProcess) {
            const status = await window.electronAPI.checkCursorProcess()
            if (status.running) {
              if (window.electronAPI?.reloadCursorWindow) {
                await window.electronAPI.reloadCursorWindow()
              }
            } else {
              if (window.electronAPI?.startCursor) {
                await window.electronAPI.startCursor()
                ElMessage.info('正在启动 Cursor...')
              }
            }
          }

          ElMessage.success('✅ 自动换号已开启，额度用完后将自动续杯')
          await getCurrentAccount()
        } catch (e) {
          console.warn('自动换号初始化失败:', e)
          const errorMsg = typeof e === 'string' ? e : (e.message || String(e))
          if (errorMsg.includes('Cursor executable not found') || errorMsg.includes('workbench.desktop.main.js not found') || errorMsg.includes('No cursor executable found')) {
            ElMessage.error(`❌ 未找到 Cursor 路径，请点击顶部“路径配置”手动选择 ${isMac.value ? 'Cursor.app' : 'Cursor.exe'} 路径`)
          } else {
            ElMessage.error('自动换号初始化失败: ' + errorMsg)
          }
          seamlessEnabled.value = false
        }
      } else {
        // 关闭自动换号
        if (window.electronAPI?.stopAutoSwitchMonitor) {
          await window.electronAPI.stopAutoSwitchMonitor()
        }
        ElMessage.info('已关闭自动换号')
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
      // 检查操作系统平台
      try {
        if (window.electronAPI?.getPlatform) {
          const plat = await window.electronAPI.getPlatform()
          isMac.value = plat === 'darwin'
        } else if (typeof navigator !== 'undefined' && navigator.platform) {
          isMac.value = navigator.platform.toLowerCase().includes('mac')
        }
      } catch (_) {}

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

        // --- 核心修复：根据 debugMode 拦截 F12, Ctrl+Shift+I 和右键菜单 ---
        if (!debugMode.value) {
            // 屏蔽右键菜单，防止通过“检查”打开
            document.addEventListener('contextmenu', e => e.preventDefault());
            // 屏蔽键盘快捷键，前端层阻挡
            window.addEventListener('keydown', (e) => {
                const isF12 = e.key === 'F12' || e.keyCode === 123;
                const isCtrlShiftI = e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.keyCode === 73);
                if (isF12 || isCtrlShiftI) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);
        }

        if (window.electronAPI.onToggleDebugPanel) {
          window.electronAPI.onToggleDebugPanel(() => {
            showDebugPanel.value = !showDebugPanel.value
          })
        }
      }
      // 原前端 15s 轮询已替换为 Rust 后端毫秒级监听 ~/.cursor-tk/quota_exhausted 信号

      // Seamless always starts OFF — no persistence
      seamlessEnabled.value = false

      // ⚡ 检查底层环境注入状态（TauriBridge 初始化后再查）
      // 用 nextTick + 短延迟确保 window.electronAPI 已就绪
      setTimeout(() => checkPatchStatus(), 300)
    })

    return {
      licenseCode, licenseData, systemNotices, debugMode, showDebugPanel, showPathDialog,
      showAgreementDialog, faqUrl, cursorExecutablePath, isMac, cursorEditorVersion, loading, currentAccount, quotaFull, encryptionEnabled,
      seamlessEnabled,
      isMainPatched, loadingPatch,
      cursorVersion, licenseStatus, isLicenseValid,
      expiryTime, expiryClass, daysRemaining, totalDays, usagePercentage, progressColor,
      todaySwitchCount, validateLicense, openPurchasePage, renewPro, openFaqUrl,
      forceRefreshUI, selectCursorPath, clearCursorPath, getCurrentAccount,
      handleAgreementAgree, handleAgreementDisagree, handleSeamlessToggle,
      toggleMainPatch
    }
  }
}
</script>

<style scoped>
#app {
  height: 100vh;
  overflow: hidden;
  color: #233247;
  background: #e9eef5;
  font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.app-container {
  height: calc(100vh - 32px);
  overflow-x: hidden;
  overflow-y: auto;
  background: radial-gradient(ellipse at 50% -20%, #f8fafc 0%, #edf2f7 54%, #e6ecf4 100%);
}
.main-content {
  min-height: 100%;
  height: auto;
  padding: 18px 22px 22px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.content-grid {
  width: 100%;
  max-width: 1120px;
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
  gap: 16px;
  align-items: start;
}
.left-panel, .right-panel { min-width: 0; }
.left-main-card, .right-main-card {
  height: auto;
  border: 1px solid #dfe6ee;
  border-radius: 12px;
  background: rgba(252, 253, 255, .96);
  box-shadow: 0 4px 14px rgba(35, 50, 71, .055);
  backdrop-filter: none;
  overflow: hidden;
}
:deep(.left-main-card .el-card__body),
:deep(.right-main-card .el-card__body) {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 16px !important;
}
.faq-integrated-entry {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  border: 1px solid #dce7f4;
  border-radius: 9px;
  background: #f1f6fc;
  cursor: pointer;
  transition: background .16s ease, border-color .16s ease;
}
.faq-integrated-entry:hover { background: #eaf2fb; border-color: #cbdced; }
.icon-pulse { color: #4778b8; font-size: 19px; animation: none; }
.faq-text { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.faq-text .label { color: #2f4d70; font-size: 13px; font-weight: 650; }
.faq-text .desc { color: #77879b; font-size: 11px; line-height: 1.45; }
.faq-integrated-entry .arrow { color: #8294aa; font-size: 14px; }
.divider-line { height: 1px; margin: 13px 0; background: #e9edf2; }
.section-header-compact { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
.section-header-compact h3 { margin: 0; color: #26374d; font-size: 14px; font-weight: 650; }
.step-dot {
  width: 20px; height: 20px; flex: 0 0 20px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; background: #e8f0fa; color: #4778b8;
  font-size: 11px; font-weight: 700;
}
.activation-section { display: flex; flex-direction: column; }
.input-container { margin-bottom: 10px; }
:deep(.input-container .el-input__wrapper) {
  min-height: 38px;
  border-radius: 7px 0 0 7px;
  box-shadow: 0 0 0 1px #dce4ed inset;
}
:deep(.input-container .el-input-group__append) { border-radius: 0 7px 7px 0; }
.premium-button-wrapper { margin-top: 7px; padding: 0; text-align: left; }
.premium-purchase-btn {
  width: 100%; height: 38px !important;
  border: 1px solid #d7e2ef !important;
  border-radius: 7px !important;
  background: #edf3fa !important;
  box-shadow: none !important;
  color: #365d87 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  animation: none;
}
.premium-purchase-btn:hover { background: #e4edf7 !important; border-color: #c7d8ea !important; }
.guide-tip { margin: 6px 0 0; color: #8290a1; font-size: 11px; line-height: 1.45; }
.instructions-section { padding-top: 0; }
.notice-item-compact {
  margin: 0 0 6px;
  padding: 7px 9px;
  border: 1px solid #e8edf3;
  border-radius: 7px;
  background: #f7f9fc;
}
.notice-title { color: #46566c; font-size: 11px; font-weight: 650; }
.notice-msg, .static-instruction p { margin: 3px 0 0; color: #748297; font-size: 11px; line-height: 1.5; }
.status-grid { display: flex; flex-direction: column; gap: 0; }
.status-item-grid {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; min-height: 36px; padding: 5px 2px;
  border-bottom: 1px solid #edf0f4;
}
.status-item-grid:last-child { border-bottom: 0; }
.status-label-grid { color: #758397; font-size: 12px; }
.status-value { color: #2a3a50; font-size: 12px; font-weight: 600; }
.status-value-wrapper { display: flex; align-items: center; gap: 7px; min-width: 0; }
.status-value.cursor-version { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.status-tag) { height: 23px; padding: 0 8px; border-radius: 5px; font-size: 11px; }
:deep(.path-config-btn) { height: 25px; padding: 0 8px; border-radius: 5px; font-size: 11px; }
.current-account-info {
  margin-top: 10px;
  padding: 11px 12px;
  border: 1px solid #e5eaf0;
  border-radius: 9px;
  background: #f7f9fc;
  box-shadow: none;
  transition: none;
}
.current-account-info:hover { transform: none; box-shadow: none; }
.current-account-info h4 {
  display: flex; align-items: center; gap: 7px;
  margin: 0 0 8px; padding-bottom: 7px;
  border-bottom: 1px solid #e7ecf2;
  color: #34465d; font-size: 12px; font-weight: 650;
}
.account-details { display: flex; flex-direction: column; gap: 6px; }
.account-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 11px; }
.account-label, .validity-label { color: #7d8999; }
.account-value { color: #3b4b60; font-weight: 550; text-align: right; overflow-wrap: anywhere; }
.account-status-tags { display: flex; gap: 6px; margin-top: 4px; }
.validity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
.validity-item {
  display: flex; flex-direction: column; align-items: flex-start; gap: 3px;
  padding: 8px 10px; border: 1px solid #e7ecf2; border-radius: 7px;
  background: #fbfcfe;
}
.validity-label { font-size: 10px; }
.validity-value { color: #365f8d; font-size: 17px; font-weight: 650; line-height: 1.2; }
.progress-info { margin-bottom: 4px; color: #78879a; font-size: 10px; text-align: right; }
.seamless-toggle-container {
  margin-top: 8px; padding: 9px 11px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  background: #f6f8fb; transition: none;
}
.seamless-toggle-container:hover { box-shadow: none; }
.main-patch-container { border-color: #dce6f1; background: #f1f5fa !important; }
.main-patch-container .label-text, .seamless-toggle-label .label-text { color: #3b4c62 !important; }
.main-patch-container .label-desc, .seamless-toggle-label .label-desc { color: #8290a1 !important; }
.seamless-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.seamless-toggle-label { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.seamless-toggle-label .label-text { font-size: 12px; font-weight: 650; }
.seamless-toggle-label .label-desc { font-size: 10px; line-height: 1.4; }
.patch-toggle-btn { min-width: 56px; }
.renewal-container { margin-top: 10px; padding-top: 0; }
.renewal-button {
  width: 100%; height: 42px !important;
  border: 0 !important; border-radius: 8px !important;
  box-shadow: 0 2px 5px rgba(70, 143, 94, .14) !important;
  font-size: 14px !important; font-weight: 650 !important;
}
:deep(.el-progress-bar__outer) { height: 5px !important; background: #e7ecf2; }
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }
@media (max-width: 760px) {
  .main-content { padding: 12px; }
  .content-grid { grid-template-columns: 1fr; gap: 12px; }
}
</style>
