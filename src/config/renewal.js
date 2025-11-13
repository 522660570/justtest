/**
 * 续杯功能配置
 */
export const RENEWAL_CONFIG = {
  // 每天最大换号次数（-1 表示不限制）
  MAX_DAILY_RENEWALS: 8,
  
  // 换号最小间隔时间（毫秒）
  MIN_RENEWAL_INTERVAL: 2 * 60 * 1000, // 2分钟
  
  // 存储键名
  STORAGE_KEYS: {
    LAST_RENEWAL_TIME: 'last_renewal_time',
    DAILY_RENEWAL_COUNT: 'daily_renewal_count',
    DAILY_RENEWAL_DATE: 'daily_renewal_date'
  }
}

/**
 * 换号频率限制服务
 */
export class RenewalRateLimiter {
  /**
   * 检查是否可以换号
   * @returns {{canRenew: boolean, reason?: string, waitTime?: number}}
   */
  static checkRenewalLimit() {
    const now = Date.now()
    const today = new Date().toDateString()
    
    // 获取存储的数据
    const lastRenewalTime = parseInt(localStorage.getItem(RENEWAL_CONFIG.STORAGE_KEYS.LAST_RENEWAL_TIME) || '0')
    const dailyCount = parseInt(localStorage.getItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_COUNT) || '0')
    const storedDate = localStorage.getItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_DATE) || ''
    
    // 检查是否是新的一天
    if (storedDate !== today) {
      // 新的一天，重置计数
      localStorage.setItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_COUNT, '0')
      localStorage.setItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_DATE, today)
      return { canRenew: true }
    }
    
    // 检查每日次数限制（-1 表示不限制）
    if (RENEWAL_CONFIG.MAX_DAILY_RENEWALS !== -1 && dailyCount >= RENEWAL_CONFIG.MAX_DAILY_RENEWALS) {
      return {
        canRenew: false,
        reason: `你今天换号次数过多（${dailyCount}/${RENEWAL_CONFIG.MAX_DAILY_RENEWALS}），请明日再试`,
        dailyCount,
        maxDaily: RENEWAL_CONFIG.MAX_DAILY_RENEWALS
      }
    }
    
    // 检查时间间隔
    const timeSinceLastRenewal = now - lastRenewalTime
    if (lastRenewalTime > 0 && timeSinceLastRenewal < RENEWAL_CONFIG.MIN_RENEWAL_INTERVAL) {
      const waitTime = RENEWAL_CONFIG.MIN_RENEWAL_INTERVAL - timeSinceLastRenewal
      const waitMinutes = Math.ceil(waitTime / 60000)
      const waitSeconds = Math.ceil(waitTime / 1000)
      
      return {
        canRenew: false,
        reason: `换号过于频繁，请勿恶意点击！请等待 ${waitMinutes > 0 ? waitMinutes + '分钟' : waitSeconds + '秒'}`,
        waitTime,
        waitSeconds,
        waitMinutes
      }
    }
    
    return { canRenew: true }
  }
  
  /**
   * 记录一次换号操作
   */
  static recordRenewal() {
    const now = Date.now()
    const today = new Date().toDateString()
    
    // 更新最后换号时间
    localStorage.setItem(RENEWAL_CONFIG.STORAGE_KEYS.LAST_RENEWAL_TIME, now.toString())
    
    // 更新每日计数
    const storedDate = localStorage.getItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_DATE) || ''
    if (storedDate === today) {
      const currentCount = parseInt(localStorage.getItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_COUNT) || '0')
      localStorage.setItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_COUNT, (currentCount + 1).toString())
    } else {
      // 新的一天
      localStorage.setItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_DATE, today)
      localStorage.setItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_COUNT, '1')
    }
  }
  
  /**
   * 获取今日剩余换号次数
   * @returns {number} -1表示不限制
   */
  static getRemainingRenewals() {
    if (RENEWAL_CONFIG.MAX_DAILY_RENEWALS === -1) {
      return -1
    }
    
    const today = new Date().toDateString()
    const storedDate = localStorage.getItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_DATE) || ''
    
    if (storedDate !== today) {
      return RENEWAL_CONFIG.MAX_DAILY_RENEWALS
    }
    
    const dailyCount = parseInt(localStorage.getItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_COUNT) || '0')
    return Math.max(0, RENEWAL_CONFIG.MAX_DAILY_RENEWALS - dailyCount)
  }
  
  /**
   * 重置限制（用于测试或管理员）
   */
  static resetLimits() {
    localStorage.removeItem(RENEWAL_CONFIG.STORAGE_KEYS.LAST_RENEWAL_TIME)
    localStorage.removeItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_COUNT)
    localStorage.removeItem(RENEWAL_CONFIG.STORAGE_KEYS.DAILY_RENEWAL_DATE)
  }
}

