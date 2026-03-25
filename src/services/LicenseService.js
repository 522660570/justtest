/**
 * 授权码服务
 * 负责处理授权码验证、有效期查询等功能
 */

import DeviceService from './DeviceService.js'
import VersionService from './VersionService.js'
import { API_CONFIG, getApiUrl, APP_VERSION, MIN_REQUIRED_VERSION, versionHeaders } from '../config/api.js'

class LicenseService {
  constructor() {
    this.apiBaseUrl = API_CONFIG.BASE_URL
    this.deviceService = new DeviceService()
  }

  /**
   * 验证授权码并获取授权信息
   * @param {string} licenseCode - 授权码
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async validateLicense(licenseCode) {
    try {
      console.log('🔧 验证授权码:', licenseCode)
      const vs = new VersionService()
      if (vs.compareVersions(APP_VERSION, MIN_REQUIRED_VERSION) < 0) {
        return {
          success: false,
          data: null,
          error: `客户端版本过低(${APP_VERSION})，请更新到≥${MIN_REQUIRED_VERSION}`
        }
      }

      // 获取真实的设备MAC地址
      const macAddress = await this.deviceService.getMacAddress()
      console.log('🔧 设备MAC地址:', macAddress)

      // 调用后端API
      const response = await fetch(`${this.apiBaseUrl}/getInfoByCode/${licenseCode}/${macAddress}`, {
        method: 'GET',
        headers: versionHeaders({ 'Content-Type': 'application/json' })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // 适配后端返回的数据格式
      if (result.code === 1) {
        // 转换后端数据格式为前端期望的格式
        const licenseData = result.data

        // 优先使用后端返回的status字段，如果没有则根据valid字段判断
        let status = 'invalid'
        if (licenseData.status) {
          status = licenseData.status // 'valid', 'expired', 'unactivated'
        } else if (licenseData.valid === true || licenseData.valid === 'true') {
          status = 'valid'
        } else if (licenseData.remainingDays && licenseData.remainingDays < 0) {
          status = 'expired'
        }

        console.log('🔧 后端返回的授权数据:', licenseData)
        console.log('🔧 解析的状态:', status)
        console.log('🔧 授权码类型:', licenseData.licenseType, licenseData.licenseTypeDesc)

        // 构建返回数据，支持天卡和次卡
        const responseData = {
          status: status,
          licenseType: licenseData.membershipType || 'Pro',
          usagePercentage: licenseData.usagePercentage || 0,
          cardType: licenseData.licenseType || 1, // 授权码类型：1=天卡, 2=次卡
          cardTypeDesc: licenseData.licenseTypeDesc || '天卡',
          message: licenseData.message || '',
          todaySwitchCount: licenseData.todaySwitchCount || 0
        }

        // 天卡：添加天数相关字段（1=天卡）
        if (licenseData.licenseType === 1 || !licenseData.licenseType) {
          responseData.daysRemaining = licenseData.remainingDays || licenseData.daysRemaining || 0
          responseData.expiryDate = licenseData.expiryTime || licenseData.expiryDate || ''
          responseData.totalDays = licenseData.totalDays || 30
        }
        // 次卡：添加次数相关字段（2=次卡）
        else if (licenseData.licenseType === 2) {
          responseData.totalSwitches = licenseData.totalSwitches || 0
          responseData.usedSwitches = licenseData.usedSwitches || 0
          responseData.remainingSwitches = licenseData.remainingSwitches || 0
        }

        return {
          success: true,
          data: responseData
        }
      } else {
        return {
          success: false,
          error: result.message || '授权码验证失败'
        }
      }

    } catch (error) {
      console.error('❌ 验证授权码失败:', error)
      return {
        success: false,
        data: null,
        error: error.message || '验证授权码时发生错误'
      }
    }
  }


  /**
   * 格式化授权码状态显示
   * @param {object} licenseData - 授权码数据
   * @returns {object} 格式化后的显示信息
   */
  formatLicenseStatus(licenseData) {
    if (!licenseData) {
      return {
        statusColor: 'danger',
        statusText: '未输入',
        expiryText: '---',
        remainingText: '---'
      }
    }

    const { status, cardType, daysRemaining, expiryDate, remainingSwitches, totalSwitches } = licenseData

    let statusColor = 'danger'
    let statusText = '无效'
    let expiryText = '---'
    let remainingText = '---'

    // 处理各种状态
    if (status === 'valid') {
      // 次卡：根据剩余次数判断（2=次卡）
      if (cardType === 2) {
        const percentage = (remainingSwitches / totalSwitches) * 100
        if (percentage > 50) {
          statusColor = 'success'
          statusText = '有效次卡'
        } else if (percentage > 0) {
          statusColor = 'warning'
          statusText = '有效次卡'
        }
        expiryText = '无期限（次数限制）'
        remainingText = remainingSwitches > 0 ? `${remainingSwitches}次` : '已用完'
      }
      // 天卡：根据剩余天数判断
      else {
        if (daysRemaining > 7) {
          statusColor = 'success'
          statusText = '有效天卡'
        } else if (daysRemaining > 0) {
          statusColor = 'warning'
          statusText = '有效天卡'
        }
        expiryText = expiryDate
        remainingText = daysRemaining > 0 ? `${daysRemaining}天` : '已过期'
      }
    } else if (status === 'unactivated') {
      // 未激活状态（只有天卡才有，次卡不会有这个状态）
      statusColor = 'info'
      statusText = '待激活天卡'
      expiryText = '待激活'
      remainingText = `${daysRemaining || 0}天`
    } else if (status === 'expired') {
      statusColor = 'danger'

      if (cardType === 2) {
        statusText = '已过期次卡'
        expiryText = '次数已用完'
        remainingText = '0次'
      } else {
        statusText = '已过期天卡'
        expiryText = expiryDate
        remainingText = `已过期${Math.abs(daysRemaining)}天`
      }
    } else {
      statusColor = 'danger'
      statusText = '无效'
    }

    return {
      statusColor,
      statusText,
      expiryText,
      remainingText
    }
  }
}

export default LicenseService

