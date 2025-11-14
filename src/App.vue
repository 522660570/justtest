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
    
    <div class="app-container">
      <!-- 主内容区域 -->
      <div class="main-content">
        <div class="content-grid">
          <!-- 左侧：授权码输入区域 -->
          <div class="left-panel">
            <el-card class="license-card" shadow="hover">
              <div class="card-header">
                <div class="step-number">1</div>
                <div class="card-title">
                  <h3>输入授权码</h3>
                  <p>点击右上角设置按钮输入授权码，验证通过后即可使用续杯功能。</p>
                </div>
              </div>
              
              <div class="license-input-section">
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
                      :disabled="!licenseCode.trim()"
                    >
                      验证
                    </el-button>
                  </template>
                </el-input>
              </div>
              
              <!-- 购买授权码区域 -->
              <div class="purchase-section">
                <div class="purchase-info">
                  <div class="purchase-text">
                    <p class="purchase-title">🎯 没有授权码？</p>
                    <p class="purchase-desc">点击下方按钮购买授权码</p>
                  </div>
                </div>
                <div class="purchase-actions">
                  <el-button
                    type="warning"
                    size="large"
                    @click="openPurchasePage"
                    :loading="loading.purchase"
                    class="purchase-button"
                  >
                    <span v-if="loading.purchase">正在打开...</span>
                    <span v-else>🛒 购买授权码</span>
                  </el-button>
                </div>
              </div>
            </el-card>

            <el-card class="license-card" shadow="hover">

              <div class="card-header">
                <div class="step-number">2</div>
                <div class="card-title">
                  <h3>刷新CURSSOR</h3>
                  <p>点击一键续杯可切换新账号，恶意点击直接封禁！</p>
                </div>
              </div>
            </el-card>

            <!-- 系统公告 -->
            <el-card 
              v-for="notice in systemNotices" 
              :key="notice.id"
              :class="['notice-card', `notice-${notice.noticeType}`]" 
              shadow="never"
            >
              <div class="notice-content">
                <el-icon class="notice-icon" size="20">
                  <Warning v-if="notice.noticeType === 'warning'" />
                  <InfoFilled v-else-if="notice.noticeType === 'info'" />
                  <SuccessFilled v-else-if="notice.noticeType === 'success'" />
                  <CircleCloseFilled v-else-if="notice.noticeType === 'error'" />
                  <Warning v-else />
                </el-icon>
                <div class="notice-text">
                  <strong>{{ notice.title }}</strong>
                  <p>{{ notice.content }}</p>
                  <div class="notice-date">{{ notice.createdTime }}</div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 右侧：功能区域 -->
          <div class="right-panel">
            <!-- 当前账号情况 -->
            <div class="account-status-section">
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
                    <!-- 调试按钮 -->
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
                  <span class="status-value cursor-version">{{ cursorEditorVersion }}</span>
                </div>

                <div class="status-item-grid">
                  <span class="status-label-grid">会员类型</span>
                  <span class="status-value" :class="membershipClass">{{ membershipType }}</span>
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
                    <span class="account-label">邮箱：</span>
                    <span v-if="currentAccount.loading" class="account-value loading">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      正在获取...
                    </span>
                    <span v-else-if="currentAccount.email" class="account-value email">
                      {{ currentAccount.email }}
                    </span>
                    <span v-else class="account-value no-account">未检测到登录账号</span>
                  </div>
                  <div class="account-status-tags">
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

              </div>
              <!-- 卡密有效期信息 -->
              <div class="current-account-info">
                <h4>卡密有效期</h4>
                <div class="validity-grid">
                  <div class="validity-item">
                    <span class="validity-label">
                      {{ licenseData?.cardType === 2 ? '剩余次数：' : '剩余天数：' }}
                    </span>
                    <span class="validity-value days-remaining">{{ daysRemaining }}</span>
                  </div>
                  <div class="validity-item">
                    <span class="validity-label">
                      {{ licenseData?.cardType === 2 ? '总次数：' : '总有效期：' }}
                    </span>
                    <span class="validity-value">{{ totalDays }}</span>
                  </div>
                </div>
                <div class="progress-section">
                  <div class="progress-info">
                    <span>{{ usagePercentage }}%</span>
                  </div>
                  <el-progress
                      :percentage="usagePercentage"
                      :color="progressColor"
                      :show-text="false"
                  />
                </div>
              </div>
              <br></br>
              <!-- 一键续杯操作区域 -->
              <div class="actions-section">
                <el-button
                          type="success"
                          size="large"
                          :icon="MagicStick"
                          @click="renewPro"
                          :loading="loading.operations"
                          class="renewal-button"
                          :disabled="!isLicenseValid"
                      >
                        <span v-if="loading.operations">正在续杯中...</span>
                        <span v-else>🚀 一键续杯</span>
                      </el-button>
               </div>
             </div>

<!--
             &lt;!&ndash; 调试和诊断区域 &ndash;&gt;
             <div class="debug-section">
               <el-card class="debug-card" shadow="hover">
                 <div class="debug-header">
                   <h4>🔧 系统诊断</h4>
                   <p>如果遇到问题，点击诊断按钮查看详细信息</p>
                 </div>
                 <div class="debug-actions">
                   <el-button 
                     type="info" 
                     size="default"
                     @click="diagnoseCursorPaths"
                     :loading="loading.diagnosis"
                   >
                     {{ loading.diagnosis ? '诊断中...' : '🔍 诊断Cursor路径' }}
                   </el-button>
                 </div>
               </el-card>
             </div>
-->

           </div>
         </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Warning, Loading, MagicStick, InfoFilled, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue'

import CursorService from './services/CursorService'
import AccountService from './services/AccountService'
import LicenseService from './services/LicenseService'
import StorageService from './services/StorageService'
import DeviceService from './services/DeviceService'
import VersionService from './services/VersionService'
import CustomTitleBar from './components/CustomTitleBar.vue'
import MachineIdDebug from './components/MachineIdDebug.vue'
import { getDefaultPurchaseUrl, getPurchaseMessage } from './config/purchase.js'
import { API_CONFIG, getApiUrl } from './config/api.js'

export default {
  name: 'App',
  components: {
    Setting,
    Warning,
    Loading,
    MagicStick,
    InfoFilled,
    SuccessFilled,
    CircleCloseFilled,
    CustomTitleBar,
    MachineIdDebug
  },
  setup() {
    // 🔧 响应式数据
    const licenseCode = ref('')
    const licenseData = ref(null)
    const systemNotices = ref([])
    const debugMode = ref(false) // 调试模式开关
    const showDebugPanel = ref(false) // 调试面板显示状态
    
    const loading = reactive({
      license: false,
      refresh: false,
      operations: false,
      purchase: false
    })

    // 当前Cursor账号状态
    const currentAccount = reactive({
      loading: false,
      email: null,
      signUpType: null,
      isAuthenticated: false,
      hasAccessToken: false,
      hasRefreshToken: false
    })

    // 🔧 服务实例
    const cursorService = new CursorService()
    const accountService = new AccountService()
    const licenseService = new LicenseService()
    const storageService = new StorageService()
    const deviceService = new DeviceService()
    const versionService = new VersionService()

    // 🔧 计算属性
    const licenseStatus = computed(() => {
      console.log('🔄 计算licenseStatus, licenseData.value:', licenseData.value)
      return licenseService.formatLicenseStatus(licenseData.value)
    })

    const isLicenseValid = computed(() => {
      if (!licenseData.value) {
        return false
      }
      const result = licenseData.value.status === 'valid'
      console.log('🔄 计算isLicenseValid:', {
        status: licenseData.value.status,
        cardType: licenseData.value.cardType,
        result: result
      })
      return result
    })

    // 获取软件版本号（自动从 package.json 读取）
    const appVersion = ref(typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.2.0')
    
    // 获取 Cursor 版本号
    const cursorEditorVersion = ref('未知')
    
    const cursorVersion = computed(() => {
      return appVersion.value
    })

    const membershipType = computed(() => {
      if (!licenseData.value) return '未授权'
      return licenseData.value.licenseType || 'Pro'
    })

    const membershipClass = computed(() => {
      if (!licenseData.value) return 'text-danger'
      return licenseData.value.status === 'valid' ? 'text-success' : 'text-danger'
    })

    const expiryTime = computed(() => {
      if (!licenseData.value) return '未授权'
      
      // 次卡没有到期时间（2=次卡）
      if (licenseData.value.cardType === 2) {
        return '无期限（次数限制）'
      }
      
      return licenseData.value.expiryDate || '未授权'
    })

    const expiryClass = computed(() => {
      if (!licenseData.value) return 'text-danger'
      
      // 次卡：根据剩余次数判断颜色（2=次卡）
      if (licenseData.value.cardType === 2) {
        const { remainingSwitches = 0, totalSwitches = 1 } = licenseData.value
        const percentage = (remainingSwitches / totalSwitches) * 100
        if (percentage > 50) return 'text-success'
        if (percentage > 0) return 'text-warning'
        return 'text-danger'
      }
      
      // 天卡：根据剩余天数判断颜色
      const { daysRemaining } = licenseData.value
      if (daysRemaining > 7) return 'text-success'
      if (daysRemaining > 0) return 'text-warning'
      return 'text-danger'
    })

    const daysRemaining = computed(() => {
      if (!licenseData.value) return '---'
      
      // 次卡：显示剩余次数（2=次卡）
      if (licenseData.value.cardType === 2) {
        const remaining = licenseData.value.remainingSwitches || 0
        return remaining > 0 ? `${remaining}次` : '已用完'
      }
      
      // 天卡：显示剩余天数
      const days = licenseData.value.daysRemaining || 0
      return days > 0 ? `${days}天` : '已过期'
    })

    const totalDays = computed(() => {
      if (!licenseData.value) return '---'
      
      // 次卡：显示总次数（2=次卡）
      if (licenseData.value.cardType === 2) {
        return `${licenseData.value.totalSwitches || 0}次`
      }
      
      // 天卡：显示总天数
      return `${licenseData.value.totalDays || 30}天`
    })

    const usagePercentage = computed(() => {
      if (!licenseData.value) return 0
      
      // 如果后端已经计算了使用百分比，直接使用
      if (licenseData.value.usagePercentage !== undefined) {
        return licenseData.value.usagePercentage
      }
      
      // 次卡：根据使用次数计算百分比（2=次卡）
      if (licenseData.value.cardType === 2) {
        const { usedSwitches = 0, totalSwitches = 1 } = licenseData.value
        return Math.round((usedSwitches / totalSwitches) * 100)
      }
      
      // 天卡：根据剩余天数计算百分比
      const { daysRemaining = 0, totalDays = 30 } = licenseData.value
      const usedDays = Math.max(0, totalDays - daysRemaining)
      return Math.round((usedDays / totalDays) * 100)
    })

    const progressColor = computed(() => {
      const percentage = usagePercentage.value
      if (percentage < 50) return '#67c23a'
      if (percentage < 80) return '#e6a23c'
      return '#f56c6c'
    })

    // 🔧 验证授权码
    const validateLicense = async () => {
      if (!licenseCode.value.trim()) {
        ElMessage.warning('请输入授权码')
        return
      }

      loading.license = true
      try {
        console.log('🔧 开始验证授权码:', licenseCode.value)
        const result = await licenseService.validateLicense(licenseCode.value)
        
        if (result.success) {
          // 强制更新响应式数据
          licenseData.value = { ...result.data }
          
          // 🔧 保存授权码和状态到缓存
          await storageService.saveLicenseCode(licenseCode.value)
          await storageService.saveLicenseData(result.data)
          console.log('💾 授权码和状态已缓存')
          console.log('🔄 验证后licenseData.value:', licenseData.value)
          
          // 强制触发响应式更新
          await new Promise(resolve => setTimeout(resolve, 50))
          
          if (result.data.status === 'valid') {
            // 根据授权码类型显示不同的成功消息（2=次卡）
            if (result.data.cardType === 2) {
              ElMessage.success(`✅ 次卡验证成功！剩余${result.data.remainingSwitches}次换号机会`)
            } else {
              ElMessage.success(`✅ 天卡验证成功！剩余${result.data.daysRemaining}天`)
            }
          } else if (result.data.status === 'expired') {
            if (result.data.cardType === 2) {
              ElMessage.error(`❌ 次卡已用完！已使用${result.data.usedSwitches}次`)
            } else {
              ElMessage.error(`❌ 天卡已过期！过期时间：${result.data.expiryDate}`)
            }
          } else if (result.data.status === 'unactivated') {
            ElMessage.success(`✅ 授权码有效！${result.data.message}`)
          } else {
            ElMessage.error('❌ 授权码无效！')
          }
        } else {
          ElMessage.error('验证失败: ' + result.error)
          licenseData.value = null
        }
      } catch (error) {
        console.error('❌ 验证授权码出错:', error)
        ElMessage.error('验证授权码出错: ' + error.message)
        licenseData.value = null
      } finally {
        loading.license = false
      }
    }

    // 🔧 刷新Cursor
    const refreshCursor = async () => {
      if (!isLicenseValid.value) {
        ElMessage.warning('请先验证有效的授权码')
        return
      }

      try {
        await ElMessageBox.confirm(
          '刷新Cursor将关闭当前运行的Cursor并重新启动，确定要继续吗？',
          '确认刷新Cursor',
          {
            confirmButtonText: '确定刷新',
            cancelButtonText: '取消',
            type: 'info'
          }
        )

        loading.refresh = true
        ElMessage.info('正在刷新Cursor...')

        // 1. 关闭Cursor
        console.log('🔧 步骤1: 关闭Cursor')
        const killResult = await cursorService.killCursorProcess()
        if (killResult.success) {
          console.log('✅ Cursor进程已关闭')
        } else {
          console.warn('⚠️ Cursor进程关闭可能不完整:', killResult.error)
        }

        // 2. 等待进程完全关闭
        console.log('🔧 步骤2: 等待进程完全关闭...')
        await new Promise(resolve => setTimeout(resolve, 3000))

        // 3. 重新启动Cursor
        console.log('🔧 步骤3: 重新启动Cursor')
        const startResult = await cursorService.startCursor()
        if (startResult.success) {
          console.log('✅ Cursor启动成功')
          ElMessage.success('✅ Cursor刷新成功！')
        } else {
          console.warn('⚠️ Cursor启动可能失败:', startResult.error)
          ElMessage.warning('Cursor启动可能失败，请手动检查')
        }

      } catch (error) {
        if (error !== 'cancel') {
          console.error('❌ 刷新Cursor失败:', error)
          ElMessage.error('刷新Cursor失败: ' + error.message)
        }
      } finally {
        loading.refresh = false
      }
    }

    // 🔧 诊断Cursor路径
    const diagnoseCursorPaths = async () => {
      try {
        loading.diagnosis = true
        console.log('🔧 开始诊断Cursor路径...')
        
        // 1. 检测可执行文件路径
        console.log('🔍 正在查找Cursor可执行文件...')
        const executablePath = await cursorService.findCursorExecutable()
        
        // 2. 检测数据库路径
        console.log('🔍 正在查找Cursor数据库文件...')
        const dbResult = await cursorService.detectActualDbPath()
        
        let diagnosticInfo = '=== Cursor 路径诊断结果 ===\n\n'
        
        // 可执行文件信息
        if (executablePath) {
          diagnosticInfo += `✅ 可执行文件: ${executablePath}\n\n`
        } else {
          diagnosticInfo += `❌ 可执行文件: 未找到\n\n`
        }
        
        // 数据库文件信息
        if (dbResult.foundPaths && dbResult.foundPaths.length > 0) {
          diagnosticInfo += '✅ 数据库文件:\n'
          dbResult.foundPaths.forEach(p => {
            diagnosticInfo += `  路径: ${p.path}\n`
            diagnosticInfo += `  大小: ${(p.size / 1024).toFixed(2)} KB\n`
            diagnosticInfo += `  修改时间: ${new Date(p.modified).toLocaleString()}\n\n`
          })
        } else {
          diagnosticInfo += '❌ 数据库文件: 未找到\n\n'
        }
        
        // 当前使用的路径
        await cursorService.initialize()
        diagnosticInfo += '=== 当前配置路径 ===\n'
        diagnosticInfo += `可执行文件: ${cursorService.cursorPaths.executable}\n`
        diagnosticInfo += `数据库文件: ${cursorService.cursorPaths.sqlite}\n`
        
        if (executablePath || (dbResult.foundPaths && dbResult.foundPaths.length > 0)) {
          ElMessage.success('诊断完成！')
        } else {
          ElMessage.warning('部分路径检测失败')
        }
        
        await ElMessageBox.alert(diagnosticInfo, 'Cursor 路径诊断', {
          confirmButtonText: '确定'
        })
        
      } catch (error) {
        console.error('❌ 诊断失败:', error)
        ElMessage.error('诊断失败: ' + error.message)
      } finally {
        loading.diagnosis = false
      }
    }

    // 🔧 一键续期Pro（保留原有逻辑）
    const renewPro = async () => {
      if (!isLicenseValid.value) {
        ElMessage.warning('请先验证有效的授权码')
        return
      }

      try {
        await ElMessageBox.confirm(
          'Cursor将会重启！\n确定要继续吗？',
          '确认续期Pro',
          {
            confirmButtonText: '开始续期',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        loading.operations = true
        console.log('🔧 开始执行Pro续期流程')

        // 0. 环境检查：不满足条件时直接拦截，避免浪费账号
        console.log('🔍 正在检查环境是否允许换号/续杯...')
        const envCheck = await cursorService.checkEnvironmentForRenewal()
        if (!envCheck.success) {
          const reasons = envCheck.reasons || []
          const reasonText = reasons.length > 0 ? reasons.join('；') : '未知原因'
          ElMessage.error(`当前环境不允许换号：${reasonText}`)
          console.warn('❌ 环境检查未通过，终止续杯流程。详情:', envCheck)
          return
        }
        console.log('✅ 环境检查通过，可以安全执行续杯流程')

        // 1. 获取当前账号信息（用于传递给后端）
        const currentAccountInfo = await cursorService.getCurrentAccountInfo()
        const currentEmail = currentAccountInfo.data?.email || 'no-current-account'
        
        // 2. 从后端API获取新账号
        console.log('🔧 步骤1: 正在从服务器获取新账号...')
        const macAddress = await deviceService.getMacAddress()
        console.log('🔧 设备MAC地址:', macAddress)
        const apiUrl = `${API_CONFIG.BASE_URL}/getAccountByCode/${licenseCode.value}/${macAddress}/${encodeURIComponent(currentEmail)}`
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
        }
        
        const accountResult = await response.json()
        if (accountResult.code !== 1) {
          throw new Error('获取新账号失败: ' + accountResult.message)
        }
        
        const newAccount = accountResult.data
        console.log('✅ 获取新账号成功:', newAccount.email)
        console.log('📊 后端返回的完整账号数据:', JSON.stringify(newAccount, null, 2))
        console.log('🔑 检查关键字段:')
        console.log('  - email:', newAccount.email ? '✅' : '❌')
        console.log('  - sessionToken:', newAccount.sessionToken ? '✅' : '❌')
        console.log('  - signUpType:', newAccount.signUpType ? '✅' : '❌')
        
        // 验证新账号数据完整性
        if (!newAccount.email) {
          throw new Error('获取的新账号缺少email')
        }
        
        // 🔑 关键：必须要有 sessionToken
        if (!newAccount.sessionToken) {
          throw new Error('获取的新账号缺少sessionToken')
        }
        
        // 🔑 改为仅使用 SessionToken 模式：不再通过 reftoken 获取 AccessToken
        // 确保使用 URL 编码的分隔符 %3A%3A
        if (!newAccount.sessionToken.includes('%3A%3A') && newAccount.sessionToken.includes('::')) {
          newAccount.sessionToken = newAccount.sessionToken.replace(/::/g, '%3A%3A')
          console.log('🔧 将 :: 转换为 %3A%3A')
        }

        // 3. 彻底关闭Cursor (增强版)
        console.log('🔧 步骤3: 正在彻底关闭所有Cursor进程...')
        const killResult = await cursorService.killCursorProcess()
        if (killResult.success) {
          console.log('✅ 所有Cursor进程已关闭')
        } else {
          console.warn('⚠️ Cursor进程关闭可能不完整:', killResult.error)
        }
        
        // 4. 重置机器ID（参考开源项目：无需等待，直接重置）
        console.log('🔧 步骤4: 正在重置机器ID...')
        const resetResult = await cursorService.resetMachineId()
        if (!resetResult.success) {
          console.error('❌ 机器ID重置失败:', resetResult.error)
          throw new Error('机器ID重置失败: ' + resetResult.error)
        }
        console.log('✅ 机器ID重置成功')

        // 5. 应用新账号
        console.log('🔧 步骤5: 正在应用新账号:', newAccount.email)
        const updateResult = await cursorService.updateAccountStorage(newAccount)
        if (!updateResult.success) {
          throw new Error('应用新账号失败: ' + updateResult.error)
        }
        console.log('✅ 账号存储更新成功')

        // 6. 启动Cursor（即发即走，不等待）
        console.log('🔧 步骤6: 正在启动Cursor...')
        const startResult = await cursorService.startCursor()
        if (startResult.success) {
          console.log('✅ Cursor启动命令已执行')
        } else {
          console.warn('⚠️ Cursor启动可能失败:', startResult.error)
          ElMessage.warning('⚠️ 启动命令可能失败，请手动检查 Cursor')
        }
        setTimeout(async () => {
          try {
            const ps = await cursorService.checkCursorProcess()
            if (!ps.running) {
              const fb = await cursorService.startCursorFallback()
              if (!fb.success) {
                ElMessage.warning('⚠️ 无法自动启动 Cursor，请手动启动')
              }
            }
          } catch {}
        }, 1500)
        setTimeout(async () => {
          try {
            if (window.electronAPI && window.electronAPI.getCursorVersion) {
              const r = await window.electronAPI.getCursorVersion()
              if (r && r.success && r.version) {
                cursorEditorVersion.value = r.version
              }
            }
          } catch {}
        }, 3000)

        console.log('✅ Pro续期流程执行完成')
        
        // 🔧 刷新授权码状态（次卡需要更新剩余次数）
        console.log('🔄 正在刷新授权码状态...')
        try {
          const licenseResult = await licenseService.validateLicense(licenseCode.value)
          if (licenseResult.success) {
            licenseData.value = { ...licenseResult.data }
            await storageService.saveLicenseData(licenseResult.data)
            console.log('✅ 授权码状态已刷新:', licenseResult.data)
            
            // 显示剩余次数提示
            if (licenseResult.data.cardType === 2) {
              ElMessage.info(`剩余换号次数：${licenseResult.data.remainingSwitches}次`)
            }
          }
        } catch (error) {
          console.warn('⚠️ 刷新授权码状态失败:', error)
        }
        
        // 🔧 刷新当前账号信息
        console.log('🔄 正在刷新当前账号信息...')
        await getCurrentAccount()
        console.log('✅ 账号信息已刷新')

      } catch (error) {
        if (error !== 'cancel') {
          console.error('❌ Pro续期失败:', error)
          ElMessage.error('Pro续期失败: ' + error.message)
        }
      } finally {
        loading.operations = false
      }
    }

    // 🔧 从缓存加载授权码和状态
    const loadCachedLicense = async () => {
      try {
        console.log('📖 正在从缓存加载授权码...')
        
        // 加载授权码
        const codeResult = await storageService.loadLicenseCode()
        if (codeResult.success) {
          licenseCode.value = codeResult.licenseCode
          console.log('📖 从缓存加载授权码成功:', codeResult.licenseCode)
          
          // 自动获取最新状态（从服务器）
          console.log('🔄 正在从服务器获取最新授权状态...')
          const result = await licenseService.validateLicense(codeResult.licenseCode)
          
          if (result.success) {
            // 强制更新响应式数据
            licenseData.value = { ...result.data }
            
            // 更新缓存中的状态信息
            await storageService.saveLicenseData(result.data)
            console.log('✅ 授权状态已更新:', result.data)
            console.log('🔄 当前licenseData.value:', licenseData.value)
            
            // 强制触发响应式更新
            await new Promise(resolve => setTimeout(resolve, 100))
            
            if (result.data.status === 'valid') {
              // 根据授权码类型显示不同的消息（2=次卡）
              if (result.data.cardType === 2) {
                ElMessage.success(`🔄 授权状态已刷新，剩余${result.data.remainingSwitches}次换号机会`)
              } else {
                ElMessage.success(`🔄 授权状态已刷新，剩余${result.data.daysRemaining}天`)
              }
            } else if (result.data.status === 'expired') {
              if (result.data.cardType === 2) {
                ElMessage.warning(`⚠️ 次卡已用完，已使用${result.data.usedSwitches}次`)
              } else {
                ElMessage.warning(`⚠️ 天卡已过期，过期时间：${result.data.expiryDate}`)
              }
            } else if (result.data.status === 'unactivated') {
              ElMessage.success(`✅ 授权码有效，${result.data.message}`)
            } else {
              ElMessage.warning('⚠️ 授权码状态异常，请重新验证')
            }
          } else {
            console.error('❌ 获取授权状态失败:', result.error)
            ElMessage.error('获取授权状态失败，请重新验证授权码')
            
            // 尝试加载缓存的状态信息作为备用
            const dataResult = await storageService.loadLicenseData()
            if (dataResult.success) {
              licenseData.value = dataResult.licenseData
              console.log('📖 使用缓存的状态信息作为备用')
              ElMessage.info('使用缓存的授权信息，建议重新验证')
            }
          }
        } else {
          console.log('📖 缓存中没有授权码，等待用户输入')
        }
      } catch (error) {
        console.error('❌ 加载缓存授权码失败:', error)
        ElMessage.error('加载缓存授权码失败: ' + error.message)
      }
    }

    // 🔧 获取当前Cursor账号信息
    const getCurrentAccount = async () => {
      currentAccount.loading = true
      try {
        console.log('🔍 正在获取当前Cursor账号信息...')
        await cursorService.initialize() // 确保服务已初始化
        const accountResult = await cursorService.getCurrentAccountInfo()
        
        if (accountResult.success) {
          const accountData = accountResult.data
          console.log('✅ 获取账号信息成功:', accountData)
          
          // 更新响应式数据
          Object.assign(currentAccount, {
            email: accountData.email,
            signUpType: accountData.signUpType,
            isAuthenticated: accountData.isAuthenticated,
            hasAccessToken: accountData.hasAccessToken,
            hasRefreshToken: accountData.hasRefreshToken,
            loading: false
          })
        } else {
          console.error('❌ 获取账号信息失败:', accountResult.error)
          Object.assign(currentAccount, {
            email: null,
            signUpType: null,
            isAuthenticated: false,
            hasAccessToken: false,
            hasRefreshToken: false,
            loading: false
          })
        }
      } catch (error) {
        console.error('❌ 获取账号信息出错:', error)
        Object.assign(currentAccount, {
          email: null,
          signUpType: null,
          isAuthenticated: false,
          hasAccessToken: false,
          hasRefreshToken: false,
          loading: false
        })
      }
    }

    // 🔧 获取系统公告
    const getSystemNotices = async () => {
      try {
        console.log('📢 正在获取系统公告...')
        
        const response = await fetch(getApiUrl('/getSystemNotices'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (result.code === 1) {
          systemNotices.value = result.data.notices || []
          console.log('✅ 获取系统公告成功，共', systemNotices.value.length, '条')
        } else {
          console.warn('⚠️ 获取系统公告失败:', result.message)
          // 使用默认公告作为备用
          systemNotices.value = [{
            id: 'default',
            title: '频繁换号警告',
            content: '不要频繁进行换号，一天之内更换过多会导致无效账号，本店会进行设备封禁，一天10-20个足够使用！！',
            noticeType: 'warning',
            createdTime: '2024-07-06 23:30:00'
          }]
        }
        
      } catch (error) {
        console.error('❌ 获取系统公告失败:', error)
        // 使用默认公告作为备用
        systemNotices.value = [{
          id: 'default',
          title: '频繁换号警告',
          content: '不要频繁进行换号，一天之内更换过多会导致无效账号，本店会进行设备封禁，一天10-20个足够使用！！',
          noticeType: 'warning',
          createdTime: '2024-07-06 23:30:00'
        }]
      }
    }

    // 🔧 打开购买页面
    const openPurchasePage = async () => {
      try {
        loading.purchase = true
        console.log('🛒 正在打开购买页面...')
        
        // 从配置文件获取购买页面URL
        const purchaseUrl = getDefaultPurchaseUrl()
        
        if (window.electronAPI && window.electronAPI.openPurchasePage) {
          const result = await window.electronAPI.openPurchasePage(purchaseUrl)
          
          if (result.success) {
            console.log('✅ 成功打开购买页面')
            ElMessage.success(getPurchaseMessage('opening'))
          } else {
            console.error('❌ 打开购买页面失败:', result.error)
            ElMessage.error(getPurchaseMessage('error') + ': ' + result.error)
          }
        } else {
          console.warn('⚠️ Electron API 不可用，尝试使用 window.open')
          // 备用方案：在 Web 版本中使用 window.open
          window.open(purchaseUrl, '_blank')
          ElMessage.success(getPurchaseMessage('success'))
        }
        
      } catch (error) {
        console.error('❌ 打开购买页面时发生错误:', error)
        ElMessage.error('打开购买页面失败: ' + error.message)
      } finally {
        loading.purchase = false
      }
    }

    // 🔧 检查管理员权限
    const checkAdminRights = async () => {
      try {
        if (window.electronAPI && window.electronAPI.checkAdminRights) {
          const hasAdminRights = await window.electronAPI.checkAdminRights()
          if (!hasAdminRights) {
            ElMessage.warning('⚠️ 当前没有管理员权限，某些功能可能无法正常工作。建议以管理员权限运行应用程序。')
          } else {
            console.log('✅ 已获得管理员权限')
          }
          return hasAdminRights
        }
        return true // 浏览器环境假设有权限
      } catch (error) {
        console.warn('⚠️ 无法检查管理员权限:', error.message)
        return false
      }
    }

    // 🔧 检查版本更新
    const checkForUpdates = async () => {
      try {
        console.log('🔍 开始检查版本更新...')
        
        // 获取当前版本号
        const currentVersion = versionService.getCurrentVersion()
        console.log('📌 当前版本:', currentVersion)
        
        // 调用后端API检查版本
        const result = await versionService.checkVersion(currentVersion)
        
        if (result.success && result.data) {
          const { needsUpdate, latestVersion, updateInfo } = result.data
          
          if (needsUpdate && updateInfo) {
            console.log('🆕 发现新版本:', latestVersion)
            
            // 构建更新提示内容
            let messageHtml = `
              <div style="text-align: left;">
                <p style="margin-bottom: 12px; font-size: 14px;">${updateInfo.message}</p>
                <div style="background: #f5f7fa; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #303133;">更新内容：</p>
                  <ul style="margin: 0; padding-left: 20px; color: #606266;">
                    ${updateInfo.features.map(feature => `<li style="margin: 4px 0;">${feature}</li>`).join('')}
                  </ul>
                </div>
                ${updateInfo.downloadUrl ? 
                  `<p style="margin: 0; font-size: 13px; color: #909399;">下载地址：<a href="${updateInfo.downloadUrl}" target="_blank" style="color: #409EFF;">${updateInfo.downloadUrl}</a></p>` 
                  : ''}
              </div>
            `
            
            // 显示更新提示对话框
            await ElMessageBox({
              title: updateInfo.title || '发现新版本',
              dangerouslyUseHTMLString: true,
              message: messageHtml,
              confirmButtonText: updateInfo.downloadUrl ? '立即下载' : '我知道了',
              cancelButtonText: '稍后提醒',
              showCancelButton: !updateInfo.forceUpdate,
              closeOnClickModal: !updateInfo.forceUpdate,
              closeOnPressEscape: !updateInfo.forceUpdate,
              showClose: !updateInfo.forceUpdate,
              type: 'info',
              customClass: 'update-dialog',
              center: false
            }).then(() => {
              // 点击"立即下载"按钮
              if (updateInfo.downloadUrl) {
                if (window.electronAPI && window.electronAPI.openExternal) {
                  window.electronAPI.openExternal(updateInfo.downloadUrl)
                } else {
                  window.open(updateInfo.downloadUrl, '_blank')
                }
              }
            }).catch(() => {
              // 点击"稍后提醒"或关闭
              console.log('用户选择稍后更新')
            })
            
          } else {
            console.log('✅ 当前已是最新版本')
          }
        } else {
          console.warn('⚠️ 版本检查失败:', result.error)
          // 版本检查失败时静默处理，不打扰用户
        }
        
      } catch (error) {
        console.error('❌ 检查版本更新失败:', error)
        // 版本检查失败时静默处理，不打扰用户
      }
    }

    // 🔧 键盘快捷键 - Ctrl+Shift+D 打开调试面板（仅调试模式）
    const handleKeyDown = (event) => {
      if (debugMode.value && event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        showDebugPanel.value = !showDebugPanel.value
      }
    }

    // 🔧 初始化
    onMounted(async () => {
      // 获取调试模式状态
      try {
        if (window.electronAPI && window.electronAPI.getDebugMode) {
          debugMode.value = await window.electronAPI.getDebugMode()
          if (debugMode.value) {
            console.log('🔧 调试模式已启用')
            console.log('💡 快捷键: Ctrl+Shift+D 打开调试工具, F12 打开控制台')
            // 添加键盘事件监听
            window.addEventListener('keydown', handleKeyDown)
          }
        }
      } catch (error) {
        // 静默处理
      }
      
      // 获取软件版本号
      try {
        if (window.electronAPI && window.electronAPI.getAppVersion) {
          const version = await window.electronAPI.getAppVersion()
          appVersion.value = version
        }
      } catch (error) {
        // 静默处理版本号获取失败
      }
      
      // 获取 Cursor 版本号
      try {
        if (window.electronAPI && window.electronAPI.getCursorVersion) {
          const result = await window.electronAPI.getCursorVersion()
          if (result.success) {
            cursorEditorVersion.value = result.version
            console.log('✅ 获取 Cursor 版本成功:', result.version)
          } else {
            cursorEditorVersion.value = '未知'
            console.warn('⚠️ 获取 Cursor 版本失败:', result.error)
          }
        }
      } catch (error) {
        console.error('❌ 获取 Cursor 版本号出错:', error)
        cursorEditorVersion.value = '未知'
      }
      
      // 检查管理员权限
      await checkAdminRights()
      
      // 并行加载缓存授权码、当前账号信息、系统公告和版本检查
      await Promise.all([
        loadCachedLicense(), // 加载缓存的授权码并获取最新状态
        getCurrentAccount(), // 获取当前账号信息
        getSystemNotices(),  // 获取系统公告
        checkForUpdates()    // 检查版本更新
      ])
      
      console.log('🔧 应用初始化完成')
    })

    // 🔧 强制刷新UI状态
    const forceRefreshUI = async () => {
      console.log('🔄 强制刷新UI状态')
      console.log('当前licenseData.value:', licenseData.value)
      
      // 强制触发响应式更新
      if (licenseData.value) {
        const temp = { ...licenseData.value }
        licenseData.value = null
        await new Promise(resolve => setTimeout(resolve, 10))
        licenseData.value = temp
        console.log('✅ UI状态已强制刷新')
        console.log('刷新后的状态:', {
          status: licenseData.value.status,
          isValid: isLicenseValid.value,
          daysRemaining: licenseData.value.daysRemaining
        })
      }
    }

    return {
      // 🔧 响应式数据
      licenseCode,
      licenseData,
      systemNotices,
      loading,
      currentAccount,
      appVersion,
      cursorEditorVersion,
      debugMode,
      showDebugPanel,
      
      // 🔧 计算属性
      licenseStatus,
      isLicenseValid,
      cursorVersion,
      membershipType,
      membershipClass,
      expiryTime,
      expiryClass,
      daysRemaining,
      totalDays,
      usagePercentage,
      progressColor,
      
      // 🔧 方法
      validateLicense,
      refreshCursor,
      openPurchasePage,
      renewPro,
      getCurrentAccount,
      loadCachedLicense,
      diagnoseCursorPaths,
      forceRefreshUI
    }
  }
}
</script>

<style scoped>
/* 🎨 全新的UI样式设计 */

.app-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

/* 主内容区域 */
.main-content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  /* 完全隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.license-card {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
}

.step-number.warning-icon {
  background: #ff4d4f;
  font-size: 20px;
}

.card-title h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #262626;
}

.card-title p {
  margin: 0;
  font-size: 14px;
  color: #8c8c8c;
  line-height: 1.5;
}

.license-input-section {
  margin-top: 16px;
}

.license-input {
  width: 100%;
}

.license-input :deep(.el-input__inner) {
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  font-size: 16px;
}

.license-input :deep(.el-input-group__append) {
  border-radius: 0 8px 8px 0;
}

/* 购买授权码区域 */
.purchase-section {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #fff9f0 0%, #fff7e6 100%);
  border: 1px solid #ffd591;
  border-radius: 12px;
  text-align: center;
}

.purchase-info {
  margin-bottom: 16px;
}

.purchase-title {
  font-size: 16px;
  font-weight: 600;
  color: #d46b08;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.purchase-desc {
  font-size: 14px;
  color: #ad6800;
  margin: 0;
  line-height: 1.5;
}

.purchase-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.purchase-button {
  min-width: 160px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(212, 107, 8, 0.3);
  transition: all 0.3s ease;
}

.purchase-button:hover {
  background: linear-gradient(135deg, #d46b08 0%, #ad6800 100%);
  box-shadow: 0 6px 16px rgba(212, 107, 8, 0.4);
  transform: translateY(-2px);
}

.purchase-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(212, 107, 8, 0.3);
}

.purchase-tips {
  font-size: 12px;
  color: #ad6800;
  margin: 0;
  opacity: 0.8;
  line-height: 1.4;
}

/* 系统公告卡片 */
.notice-card {
  border-radius: 12px;
  margin-bottom: 16px;
}

.notice-card:last-child {
  margin-bottom: 0;
}

.notice-warning {
  background: #fff7e6;
  border: 1px solid #ffd591;
}

.notice-info {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

.notice-success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.notice-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.notice-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.notice-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-warning .notice-icon {
  color: #fa8c16;
}

.notice-info .notice-icon {
  color: #1890ff;
}

.notice-success .notice-icon {
  color: #52c41a;
}

.notice-error .notice-icon {
  color: #ff4d4f;
}

.notice-text strong {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.notice-warning .notice-text strong {
  color: #d46b08;
}

.notice-info .notice-text strong {
  color: #096dd9;
}

.notice-success .notice-text strong {
  color: #389e0d;
}

.notice-error .notice-text strong {
  color: #cf1322;
}

.notice-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.notice-warning .notice-text p {
  color: #ad6800;
}

.notice-info .notice-text p {
  color: #0050b3;
}

.notice-success .notice-text p {
  color: #237804;
}

.notice-error .notice-text p {
  color: #a8071a;
}

.notice-date {
  font-size: 12px;
  opacity: 0.8;
}

.notice-warning .notice-date {
  color: #ad6800;
}

.notice-info .notice-date {
  color: #0050b3;
}

.notice-success .notice-date {
  color: #237804;
}

.notice-error .notice-date {
  color: #a8071a;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 账号状态显示 */
.account-status-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 新的网格布局 */
.status-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-item-grid {
  display: grid;
  grid-template-columns: 110px 1fr;
  align-items: center;
  gap: 16px;
  min-height: 32px;
}

.status-label-grid {
  font-size: 14px;
  color: #8c8c8c;
  text-align: right;
  white-space: nowrap;
  padding-right: 8px;
  position: relative;
}

.status-label-grid::after {
  content: '：';
  position: absolute;
  right: 0;
}

.status-value-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-value {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.status-value.cursor-version {
  color: #1890ff;
  font-family: 'Consolas', 'Monaco', monospace;
}

.status-value.text-success {
  color: #52c41a;
}

.status-value.text-warning {
  color: #faad14;
}

.status-value.text-danger {
  color: #ff4d4f;
}

.status-tag {
  font-weight: 500;
}

/* 旧的样式保持兼容 */
.status-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-row:last-child {
  margin-bottom: 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-size: 14px;
  color: #8c8c8c;
  white-space: nowrap;
}

/* 当前账号信息样式 */
.current-account-info {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.account-info-header h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #262626;
  font-weight: 600;
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-label {
  font-size: 14px;
  color: #8c8c8c;
  min-width: 60px;
}

.account-value {
  font-size: 14px;
  font-weight: 500;
}

.account-value.loading {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8c8c8c;
}

.account-value.email {
  color: #1890ff;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.account-value.no-account {
  color: #ff4d4f;
  font-style: italic;
}

.account-status-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

/* 卡密有效期信息 */
.license-validity-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.license-validity-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #262626;
}

.validity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.validity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.validity-label {
  font-size: 14px;
  color: #8c8c8c;
}

.validity-value {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.validity-value.days-remaining {
  color: #1890ff;
  font-weight: 600;
}

.progress-section {
  margin-top: 16px;
}

.progress-info {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.progress-info span {
  font-size: 12px;
  color: #8c8c8c;
}

/* 操作按钮区域 */
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-row {
  width: 100%;
}

.action-card {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.action-card .card-header {
  margin-bottom: 16px;
}

.action-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  border: none;
}

.refresh-button {
  background: #1890ff;
  color: white;
}

.refresh-button:hover {
  background: #40a9ff;
}

.refresh-button:disabled {
  background: #d9d9d9;
  color: #bfbfbf;
}

/* 续杯卡片特殊样式 */
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

.renewal-card .card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 0;
}

.renewal-card .header-icon {
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

.renewal-card .header-text {
  flex: 1;
}

.renewal-card .main-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.renewal-card .subtitle {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.renewal-card .renewal-content {
  padding: 32px;
}

.renewal-card .action-section {
  text-align: center;
}

.renewal-card .renewal-button {
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

.renewal-card .renewal-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(103, 194, 58, 0.5);
  background: linear-gradient(135deg, #85ce61 0%, #67c23a 100%);
}

.renewal-card .renewal-button:active {
  transform: translateY(0);
}

.renewal-card .renewal-button.is-loading {
  background: linear-gradient(135deg, #a0cfff 0%, #909399 100%);
}

.renewal-card .renewal-button:disabled {
  background: #d9d9d9;
  color: #bfbfbf;
  box-shadow: none;
  transform: none;
}

.renewal-buttons {
  display: flex;
  gap: 12px;
}

.renewal-buttons .action-button {
  flex: 1;
}

.renewal-buttons .el-button--primary {
  background: #1890ff;
}

.renewal-buttons .el-button--danger {
  background: #ff4d4f;
}

.renewal-buttons .el-button--primary:hover {
  background: #40a9ff;
}

.renewal-buttons .el-button--danger:hover {
  background: #ff7875;
}

.renewal-buttons .el-button:disabled {
  background: #d9d9d9;
  color: #bfbfbf;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .main-content {
    padding: 24px 16px;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 12px 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .status-row {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .validity-grid {
    grid-template-columns: 1fr;
  }
  
  .renewal-buttons {
    flex-direction: column;
  }
}

/* 动画效果 */
.license-card,
.action-card,
.license-status-section,
.license-validity-section {
  transition: all 0.3s ease;
}

.license-card:hover,
.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.action-button {
  transition: all 0.3s ease;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 加载状态 */
.action-button.is-loading {
  position: relative;
  pointer-events: none;
}

/* 毛玻璃效果 */
.app-header,
.license-card,
.action-card,
.license-status-section,
.license-validity-section {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 完全隐藏滚动条但保持滚动功能 */
.main-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 确保所有浏览器都隐藏滚动条 */
.main-content {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 更新对话框样式 */
:deep(.update-dialog) {
  max-width: 540px;
  border-radius: 12px;
}

:deep(.update-dialog .el-message-box__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.update-dialog .el-message-box__title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

:deep(.update-dialog .el-message-box__content) {
  padding: 20px 24px;
}

:deep(.update-dialog .el-message-box__message) {
  line-height: 1.6;
}

:deep(.update-dialog .el-message-box__btns) {
  padding: 12px 24px 20px;
}

:deep(.update-dialog .el-button) {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}
</style>

