/**
 * 本地存储服务
 * 用于缓存授权码和相关配置信息
 * 使用Electron的IPC通信访问文件系统
 */
class StorageService {
  constructor() {
    // 检查是否在Electron环境中
    this.isElectron = typeof window !== 'undefined' && window.electronAPI
    
    if (this.isElectron) {
      console.log('🔧 StorageService已初始化 (Electron环境)')
    } else {
      console.log('🔧 StorageService已初始化 (浏览器环境，使用localStorage)')
    }
  }

  /**
   * 获取配置数据（统一接口）
   */
  async getConfig() {
    if (this.isElectron) {
      try {
        const configData = await window.electronAPI.readConfigFile()
        return configData ? JSON.parse(configData) : {}
      } catch (error) {
        console.log('📖 配置文件不存在或格式错误，使用空配置:', error.message)
        return {}
      }
    } else {
      // 浏览器环境使用localStorage
      try {
        const configData = localStorage.getItem('cursor-renewal-config')
        return configData ? JSON.parse(configData) : {}
      } catch (error) {
        console.log('📖 localStorage数据格式错误，使用空配置:', error.message)
        return {}
      }
    }
  }

  /**
   * 保存配置数据（统一接口）
   */
  async saveConfig(config) {
    if (this.isElectron) {
      try {
        await window.electronAPI.writeConfigFile(JSON.stringify(config, null, 2))
        return { success: true }
      } catch (error) {
        console.error('❌ 保存配置失败:', error)
        return { success: false, error: error.message }
      }
    } else {
      // 浏览器环境使用localStorage
      try {
        localStorage.setItem('cursor-renewal-config', JSON.stringify(config))
        return { success: true }
      } catch (error) {
        console.error('❌ 保存配置失败:', error)
        return { success: false, error: error.message }
      }
    }
  }

  /**
   * 专门保存 Cursor 路径配置（兼容各种拼写）
   */
  async saveCursorPath(path) {
    try {
      const config = await this.getConfig()
      config.cursorExecutablePath = path
      config.cursor_path = path // 兼容其他可能读取该字段的模块
      const result = await this.saveConfig(config)
      if (result.success) {
        console.log('💾 Cursor路径已缓存:', path)
      }
      return result
    } catch (error) {
      console.error('❌ 保存Cursor路径失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 保存授权码到本地
   */
  async saveLicenseCode(licenseCode) {
    try {
      const config = await this.getConfig()
      
      config.licenseCode = licenseCode
      config.lastUpdated = new Date().toISOString()

      const result = await this.saveConfig(config)
      if (result.success) {
        console.log('💾 授权码已缓存:', licenseCode)
      }
      
      return result
    } catch (error) {
      console.error('❌ 保存授权码失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 从本地读取授权码
   */
  async loadLicenseCode() {
    try {
      const config = await this.getConfig()
      
      if (config.licenseCode) {
        console.log('📖 从缓存加载授权码:', config.licenseCode)
        return { 
          success: true, 
          licenseCode: config.licenseCode,
          lastUpdated: config.lastUpdated
        }
      } else {
        console.log('📖 缓存中没有授权码')
        return { success: false, error: 'No cached license code' }
      }
    } catch (error) {
      console.log('📖 无法读取缓存的授权码:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * 保存授权码状态信息
   */
  async saveLicenseData(licenseData) {
    try {
      const config = await this.getConfig()
      
      config.licenseData = licenseData
      config.dataLastUpdated = new Date().toISOString()

      const result = await this.saveConfig(config)
      if (result.success) {
        console.log('💾 授权码状态信息已缓存')
      }
      
      return result
    } catch (error) {
      console.error('❌ 保存授权码状态失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 从本地读取授权码状态信息
   */
  async loadLicenseData() {
    try {
      const config = await this.getConfig()
      
      if (config.licenseData) {
        console.log('📖 从缓存加载授权码状态信息')
        return { 
          success: true, 
          licenseData: config.licenseData,
          dataLastUpdated: config.dataLastUpdated
        }
      } else {
        console.log('📖 缓存中没有授权码状态信息')
        return { success: false, error: 'No cached license data' }
      }
    } catch (error) {
      console.log('📖 无法读取缓存的授权码状态:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * 清除所有缓存数据
   */
  async clearCache() {
    try {
      if (this.isElectron) {
        await window.electronAPI.deleteConfigFile()
      } else {
        localStorage.removeItem('cursor-renewal-config')
      }
      console.log('🗑️ 缓存已清除')
      return { success: true }
    } catch (error) {
      console.log('🗑️ 清除缓存失败或缓存不存在:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取配置文件信息
   */
  async getConfigInfo() {
    try {
      if (this.isElectron) {
        const info = await window.electronAPI.getConfigFileInfo()
        return { success: true, info }
      } else {
        const configData = localStorage.getItem('cursor-renewal-config')
        const config = configData ? JSON.parse(configData) : {}
        
        return {
          success: true,
          info: {
            storage: 'localStorage',
            hasLicenseCode: !!config.licenseCode,
            hasLicenseData: !!config.licenseData,
            lastUpdated: config.lastUpdated,
            dataLastUpdated: config.dataLastUpdated
          }
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

export default StorageService
