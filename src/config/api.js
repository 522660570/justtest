// API 配置文件

/**
 * API 基础配置
 */
export const API_CONFIG = {
  // 后端服务器地址
  BASE_URL: 'http://111.228.33.54/api/',
  // BASE_URL: 'http://localhost:8088',
  
  // API 超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 请求重试次数
  RETRY_COUNT: 3,
  
  // 重试延迟（毫秒）
  RETRY_DELAY: 1000
}

/**
 * 获取完整的 API URL
 * @param {string} endpoint - API 端点路径（例如：'/getSystemNotices'）
 * @returns {string} 完整的 API URL
 */
export function getApiUrl(endpoint) {
  // 确保 endpoint 以 / 开头
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_CONFIG.BASE_URL}${normalizedEndpoint}`
}

/**
 * 验证授权码
 * @param {string} licenseCode - 授权码
 * @returns {string} 验证授权码的完整 URL
 */
export function getValidateLicenseUrl(licenseCode) {
  return getApiUrl(`/validateLicense/${licenseCode}`)
}

/**
 * 获取账号
 * @param {string} licenseCode - 授权码
 * @param {string} macAddress - MAC 地址
 * @param {string} currentEmail - 当前邮箱（可选）
 * @returns {string} 获取账号的完整 URL
 */
export function getAccountByCodeUrl(licenseCode, macAddress, currentEmail = '') {
  const email = currentEmail ? encodeURIComponent(currentEmail) : 'no-current-account'
  return getApiUrl(`/getAccountByCode/${licenseCode}/${macAddress}/${email}`)
}

/**
 * 获取系统公告
 * @returns {string} 获取系统公告的完整 URL
 */
export function getSystemNoticesUrl() {
  return getApiUrl('/getSystemNotices')
}

export default {
  API_CONFIG,
  getApiUrl,
  getValidateLicenseUrl,
  getAccountByCodeUrl,
  getSystemNoticesUrl
}

