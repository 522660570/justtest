# 🔧 简化配置指南

## 📍 配置文件位置

现在只需要修改这几个地方的API地址：

### 1. 主应用API配置
**`src/config/api.js`** (第10行)
```javascript
// API基础地址 - 打包不同环境时手动修改这里
const API_BASE_URL = 'http://localhost:8088'
```

### 2. 购买页面API配置
**`cursor-purchase-page/index.html`** (第553行)
```javascript
// API配置 - 打包不同环境时手动修改这里
const API_BASE_URL = 'http://localhost:8088/api/purchase';
```

### 3. 购买按钮配置
**`src/config/purchase.js`** (第7行)
```javascript
// 购买页面URL - 打包不同环境时手动修改这里
purchaseUrl: 'http://localhost:3000',
```

## 🚀 打包不同环境

### 开发环境（默认）
```javascript
// src/config/api.js
const API_BASE_URL = 'http://localhost:8088'

// cursor-purchase-page/index.html
const API_BASE_URL = 'http://localhost:8088/api/purchase';

// src/config/purchase.js
purchaseUrl: 'http://localhost:3000',
```

### 生产环境
```javascript
// src/config/api.js
const API_BASE_URL = 'https://api.your-domain.com'

// cursor-purchase-page/index.html
const API_BASE_URL = 'https://api.your-domain.com/api/purchase';

// src/config/purchase.js
purchaseUrl: 'https://purchase.your-domain.com',
```

### 内网环境
```javascript
// src/config/api.js
const API_BASE_URL = 'http://192.168.1.100:8088'

// cursor-purchase-page/index.html
const API_BASE_URL = 'http://192.168.1.100:8088/api/purchase';

// src/config/purchase.js
purchaseUrl: 'http://192.168.1.100:3000',
```

## 📋 打包步骤

1. **修改配置** - 修改上面3个文件中的地址
2. **构建应用** - `npm run build`
3. **打包exe** - `npm run build-exe`

## ✅ 优势

- **简单直接** - 只需要修改几个地址
- **一目了然** - 不需要理解复杂的环境检测
- **易于维护** - 打包时手动修改，不会出错
- **灵活性高** - 可以随时修改为任意地址

现在配置变得非常简单了！
