/**
 * 设备信息服务
 * 负责获取设备的真实信息，如MAC地址等
 */

class DeviceService {
  constructor() {
    this.cachedMacAddress = null
    this.api = this.getApi()
  }

  /**
   * 获取统一的API对象
   */
  getApi() {
    // 检查是否在Electron环境中
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI
    }
    
    // 浏览器环境的模拟API
    return {
      getMacAddress: async () => {
        console.warn('浏览器环境无法获取真实MAC地址，使用浏览器指纹')
        return this.generateBrowserFingerprint()
      }
    }
  }

  /**
   * 获取设备MAC地址
   * @returns {Promise<string>} MAC地址
   */
  async getMacAddress() {
    if (this.cachedMacAddress) {
      return this.cachedMacAddress
    }

    try {
      console.log('🔍 正在获取设备MAC地址...')
      
      if (this.api.getMacAddress) {
        // Electron环境：获取真实MAC地址
        const macAddress = await this.api.getMacAddress()
        if (macAddress && macAddress !== 'unknown') {
          this.cachedMacAddress = macAddress
          console.log('✅ 获取真实MAC地址成功:', macAddress)
          return macAddress
        }
      }

      // 备用方案：生成浏览器指纹
      const fingerprint = await this.generateBrowserFingerprint()
      this.cachedMacAddress = fingerprint
      console.log('⚠️ 使用浏览器指纹作为设备标识:', fingerprint)
      return fingerprint

    } catch (error) {
      console.error('❌ 获取MAC地址失败:', error)
      
      // 最终备用方案：生成随机标识
      const fallback = this.generateFallbackId()
      this.cachedMacAddress = fallback
      console.log('🔄 使用备用设备标识:', fallback)
      return fallback
    }
  }

  /**
   * 生成浏览器指纹作为设备标识
   * @returns {Promise<string>} 浏览器指纹
   */
  async generateBrowserFingerprint() {
    try {
      const components = []
      
      // 用户代理
      components.push(navigator.userAgent || '')
      
      // 屏幕信息
      components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`)
      
      // 时区
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '')
      
      // 语言
      components.push(navigator.language || '')
      
      // 平台
      components.push(navigator.platform || '')
      
      // 硬件并发数
      components.push(navigator.hardwareConcurrency || 0)
      
      // Canvas指纹
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Device fingerprint', 2, 2)
        components.push(canvas.toDataURL())
      } catch (e) {
        components.push('canvas-error')
      }

      // WebGL指纹
      try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (gl) {
          const renderer = gl.getParameter(gl.RENDERER)
          const vendor = gl.getParameter(gl.VENDOR)
          components.push(renderer + '|' + vendor)
        }
      } catch (e) {
        components.push('webgl-error')
      }

      // 生成哈希
      const fingerprint = await this.simpleHash(components.join('|'))
      
      // 格式化为MAC地址样式
      return this.formatAsMAC(fingerprint)

    } catch (error) {
      console.error('生成浏览器指纹失败:', error)
      return this.generateFallbackId()
    }
  }

  /**
   * 简单哈希函数
   * @param {string} str 输入字符串
   * @returns {Promise<string>} 哈希值
   */
  async simpleHash(str) {
    if (crypto && crypto.subtle) {
      try {
        const encoder = new TextEncoder()
        const data = encoder.encode(str)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      } catch (e) {
        // Fallback to simple hash
      }
    }

    // 简单哈希算法
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * 格式化为MAC地址样式
   * @param {string} hash 哈希值
   * @returns {string} MAC地址格式的字符串
   */
  formatAsMAC(hash) {
    // 取前12位
    const hex = hash.substring(0, 12).padEnd(12, '0')
    
    // 格式化为MAC地址样式 XX:XX:XX:XX:XX:XX
    return hex.match(/.{2}/g).join(':').toUpperCase()
  }

  /**
   * 生成备用设备标识
   * @returns {string} 备用标识
   */
  generateFallbackId() {
    const timestamp = Date.now().toString(16)
    const random = Math.random().toString(16).substring(2, 8)
    const combined = (timestamp + random).substring(0, 12)
    return this.formatAsMAC(combined)
  }

  /**
   * 清除缓存的MAC地址
   */
  clearCache() {
    this.cachedMacAddress = null
  }

  /**
   * 获取设备信息摘要
   * @returns {Promise<Object>} 设备信息
   */
  async getDeviceInfo() {
    const macAddress = await this.getMacAddress()
    
    return {
      macAddress,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    }
  }
}

export default DeviceService
