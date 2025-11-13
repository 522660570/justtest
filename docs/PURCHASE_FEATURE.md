# 🛒 授权码购买功能

## 🎯 功能概述

在应用中添加了授权码购买功能，用户可以直接从应用内跳转到购买页面进行授权码购买。

## ✨ 功能特性

### 1. **购买按钮**
- 位于授权码输入区域下方
- 醒目的橙色渐变按钮设计
- 支持加载状态显示
- 点击后直接打开购买页面

### 2. **智能跳转**
- **Electron环境**: 使用`shell.openExternal`打开默认浏览器
- **Web环境**: 使用`window.open`作为备用方案
- 自动检测运行环境并选择合适的打开方式

### 3. **用户体验**
- 清晰的提示信息和操作反馈
- 支持多种时长选择的提示
- 加载状态显示，避免重复点击
- 友好的错误处理和提示

## 🔧 技术实现

### 1. **后端支持**
```javascript
// electron/main.js
ipcMain.handle('open-purchase-page', async (event, url) => {
  await shell.openExternal(url)
  return { success: true }
})
```

### 2. **前端接口**
```javascript
// electron/preload.js
openPurchasePage: (url) => ipcRenderer.invoke('open-purchase-page', url)
```

### 3. **Vue组件**
```vue
<div class="purchase-section">
  <el-button 
    type="warning" 
    @click="openPurchasePage"
    :loading="loading.purchase"
  >
    🛒 购买授权码
  </el-button>
</div>
```

## 📁 文件结构

```
src/
├── App.vue                    # 主要UI和购买逻辑
├── config/
│   └── purchase.js           # 购买配置文件
electron/
├── main.js                   # 添加了shell.openExternal支持
└── preload.js               # 暴露购买页面API
```

## ⚙️ 配置说明

### 修改购买页面URL

编辑 `src/config/purchase.js`:

```javascript
export const PURCHASE_CONFIG = {
  // 主要购买页面URL
  purchaseUrl: 'https://your-website.com/buy-license',
  
  // 不同时长的购买链接
  purchaseUrls: {
    '7days': 'https://your-website.com/buy?plan=7days',
    '30days': 'https://your-website.com/buy?plan=30days',
    '90days': 'https://your-website.com/buy?plan=90days',
    '365days': 'https://your-website.com/buy?plan=365days'
  }
}
```

### 自定义提示信息

```javascript
messages: {
  opening: '已打开购买页面，请在浏览器中完成购买',
  success: '成功打开购买页面',
  error: '打开购买页面失败',
  unavailable: '购买功能暂时不可用'
}
```

## 🎨 UI设计

### 购买区域样式
- **背景**: 橙色渐变背景 (`#fff9f0` → `#fff7e6`)
- **边框**: 橙色边框 (`#ffd591`)
- **按钮**: 橙色渐变按钮，支持悬停效果
- **布局**: 居中对齐，清晰的层次结构

### 响应式设计
- 按钮尺寸: 最小宽度160px，高度44px
- 字体大小: 16px，字重600
- 间距: 合理的内边距和外边距
- 动画: 平滑的悬停和点击动画

## 🚀 使用指南

### 1. **用户操作流程**
1. 打开应用
2. 在授权码输入区域看到购买提示
3. 点击"🛒 购买授权码"按钮
4. 系统自动打开默认浏览器
5. 在浏览器中完成购买流程

### 2. **开发者配置**
1. 修改 `src/config/purchase.js` 中的URL
2. 根据需要调整提示信息
3. 可选择性修改按钮样式

### 3. **测试功能**
```bash
# 启动应用
npm run dev

# 点击购买按钮测试
# 检查浏览器是否正确打开
# 验证URL是否正确
```

## 🔍 调试和日志

### 前端日志
```javascript
console.log('🛒 正在打开购买页面...')
console.log('✅ 成功打开购买页面')
console.error('❌ 打开购买页面失败:', error)
```

### Electron日志
```javascript
writeLog('INFO', `打开购买页面: ${url}`)
writeLog('INFO', '成功打开购买页面')
writeLog('ERROR', `打开购买页面失败: ${error.message}`)
```

## 🛡️ 安全考虑

### URL验证
- 建议在配置文件中只使用HTTPS URL
- 可以添加URL白名单验证机制

### 错误处理
- 完善的try-catch错误捕获
- 用户友好的错误提示
- 备用方案确保功能可用性

## 🔄 未来扩展

### 可能的增强功能
1. **多种购买方式**: 支持不同时长的快速购买按钮
2. **购买记录**: 本地保存购买历史
3. **优惠券**: 支持优惠券代码输入
4. **价格显示**: 显示不同时长的价格信息
5. **内嵌页面**: 在应用内嵌入购买页面

### 集成建议
1. **支付回调**: 购买完成后自动刷新授权状态
2. **用户系统**: 与用户账号系统集成
3. **订单管理**: 添加订单查询和管理功能

## 📝 使用示例

### 基本使用
```javascript
// 打开默认购买页面
await openPurchasePage()
```

### 指定时长
```javascript
// 打开30天授权码购买页面
const url = getPurchaseUrlByDuration('30days')
await window.electronAPI.openPurchasePage(url)
```

### 自定义URL
```javascript
// 使用自定义购买链接
const customUrl = 'https://your-store.com/special-offer'
await window.electronAPI.openPurchasePage(customUrl)
```

现在用户可以通过一个简单的按钮轻松购买授权码，提升了用户体验和转化率！
