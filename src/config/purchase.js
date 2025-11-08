/**
 * 购买页面配置
 */

export const PURCHASE_CONFIG = {
  // 购买页面URL - 打包不同环境时手动修改这里
  purchaseUrl: 'https://pay.ldxp.cn/shop/UN9XZ6ZU',
  
  // 可选：不同时长的购买链接
  purchaseUrls: {
    '7days': 'https://your-purchase-website.com/buy-license?plan=7days',
    '30days': 'https://your-purchase-website.com/buy-license?plan=30days',
    '90days': 'https://your-purchase-website.com/buy-license?plan=90days',
    '365days': 'https://your-purchase-website.com/buy-license?plan=365days'
  },
  
  // 购买页面打开方式配置
  openInBrowser: true, // true: 使用默认浏览器打开, false: 在应用内打开
  
  // 购买提示信息
  messages: {
    opening: '已打开购买页面，请在浏览器中完成购买',
    success: '成功打开购买页面',
    error: '打开购买页面失败',
    unavailable: '购买功能暂时不可用'
  },
  
  // 购买页面特性
  features: [
    '支持微信、支付宝、银行卡等多种支付方式',
    '购买成功后立即发送授权码',
    '24小时在线客服支持'
  ]
}

// 获取默认购买URL
export const getDefaultPurchaseUrl = () => {
  return PURCHASE_CONFIG.purchaseUrl
}

// 获取指定时长的购买URL
export const getPurchaseUrlByDuration = (duration) => {
  return PURCHASE_CONFIG.purchaseUrls[duration] || PURCHASE_CONFIG.purchaseUrl
}

// 获取购买提示信息
export const getPurchaseMessage = (type) => {
  return PURCHASE_CONFIG.messages[type] || ''
}
