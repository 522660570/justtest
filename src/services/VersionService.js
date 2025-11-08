import { API_CONFIG, getApiUrl } from '../config/api.js'

/**
 * 版本检查服务
 */
class VersionService {
  /**
   * 检查版本更新
   * @param {string} currentVersion 当前版本号
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async checkVersion(currentVersion) {
    try {
      console.log('🔍 正在检查版本更新...', '当前版本:', currentVersion)
      
      const apiUrl = getApiUrl(`/checkVersion/${currentVersion}`)
      
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
      
      if (result.code === 1) {
        console.log('✅ 版本检查成功:', result.data)
        return {
          success: true,
          data: result.data
        }
      } else {
        console.error('❌ 版本检查失败:', result.message)
        return {
          success: false,
          error: result.message || '版本检查失败'
        }
      }
      
    } catch (error) {
      console.error('❌ 版本检查请求失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * 比较版本号
   * @param {string} version1 版本1
   * @param {string} version2 版本2
   * @returns {number} 负数表示version1 < version2，0表示相等，正数表示version1 > version2
   */
  compareVersions(version1, version2) {
    try {
      // 移除可能的 'v' 前缀
      version1 = version1.replace(/^v/, '')
      version2 = version2.replace(/^v/, '')
      
      const parts1 = version1.split('.')
      const parts2 = version2.split('.')
      
      const maxLength = Math.max(parts1.length, parts2.length)
      
      for (let i = 0; i < maxLength; i++) {
        const v1 = i < parts1.length ? parseInt(parts1[i]) : 0
        const v2 = i < parts2.length ? parseInt(parts2[i]) : 0
        
        if (v1 !== v2) {
          return v1 - v2
        }
      }
      
      return 0
    } catch (error) {
      console.error('版本号解析失败:', error)
      return 0
    }
  }
  
  /**
   * 获取当前应用版本号
   * @returns {string}
   */
  getCurrentVersion() {
    // 当前前端版本号
    // 每次发布新版本时，手动修改这里的版本号
    return '1.1'  // 👈 在这里修改前端版本号
  }
}

export default VersionService

