/**
 * 账号服务类
 * 负责与后端API交互获取账号信息
 */

import DeviceService from './DeviceService.js'
import { API_CONFIG, getApiUrl } from '../config/api.js'

class AccountService {
  constructor() {
    this.apiBaseUrl = API_CONFIG.BASE_URL
    this.deviceService = new DeviceService()
  }

  /**
   * 根据授权码获取新账号
   * @param {string} licenseCode - 授权码
   * @param {string} currentAccountEmail - 当前账号邮箱
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getAccountByCode(licenseCode, currentAccountEmail = 'no-current-account') {
    try {
      console.log('🔧 获取新账号:', { licenseCode, currentAccountEmail })
      
      // 获取真实的设备MAC地址
      const macAddress = await this.deviceService.getMacAddress()
      console.log('🔧 设备MAC地址:', macAddress)
      
      // 调用后端API
      const apiUrl = `${this.apiBaseUrl}/getAccountByCode/${licenseCode}/${macAddress}/${encodeURIComponent(currentAccountEmail)}`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // 处理后端返回的数据格式
      if (result.code === 1) {
        return {
          success: true,
          data: result.data
        }
      } else {
        return {
          success: false,
          error: result.message || '获取账号失败'
        }
      }
      
    } catch (error) {
      console.error('❌ 获取账号失败:', error)
      return {
        success: false,
        data: null,
        error: error.message || '获取账号时发生错误'
      }
    }
  }

  /**
   * 查询授权码占用的账号
   * @param {string} licenseCode - 授权码
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getAccountsByLicense(licenseCode) {
    try {
      console.log('🔧 查询授权码占用的账号:', licenseCode)
      
      const response = await fetch(`${this.apiBaseUrl}/getAccountsByLicense/${licenseCode}`, {
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
        return {
          success: true,
          data: result.data
        }
      } else {
        return {
          success: false,
          error: result.message || '查询失败'
        }
      }
      
    } catch (error) {
      console.error('❌ 查询授权码占用账号失败:', error)
      return {
        success: false,
        data: null,
        error: error.message || '查询时发生错误'
      }
    }
  }

  /**
   * 获取账号使用统计
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getAccountUsageStats() {
    try {
      console.log('🔧 获取账号使用统计')
      
      const response = await fetch(`${this.apiBaseUrl}/getAccountUsageStats`, {
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
        return {
          success: true,
          data: result.data
        }
      } else {
        return {
          success: false,
          error: result.message || '获取统计失败'
        }
      }
      
    } catch (error) {
      console.error('❌ 获取账号使用统计失败:', error)
      return {
        success: false,
        data: null,
        error: error.message || '获取统计时发生错误'
      }
    }
  }

  /**
   * 释放授权码占用的账号
   * @param {string} licenseCode - 授权码
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async releaseAccountsByLicense(licenseCode) {
    try {
      console.log('🔧 释放授权码占用的账号:', licenseCode)
      
      const response = await fetch(`${this.apiBaseUrl}/releaseAccountsByLicense/${licenseCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.code === 1) {
        return {
          success: true,
          data: result.data
        }
      } else {
        return {
          success: false,
          error: result.message || '释放失败'
        }
      }
      
    } catch (error) {
      console.error('❌ 释放授权码占用账号失败:', error)
      return {
        success: false,
        data: null,
        error: error.message || '释放时发生错误'
      }
    }
  }
}

export default AccountService