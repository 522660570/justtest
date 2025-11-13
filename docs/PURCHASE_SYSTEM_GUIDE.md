# 🛒 完整购买系统开发指南

## 🎯 系统概述

我已经为你开发了一个完整的 Cursor Pro 授权码购买系统，包含：

1. **后端API服务** - 基于现有的Java Spring Boot项目
2. **购买页面** - 独立的HTML页面，支持现代化UI
3. **数据库设计** - 完整的商品、订单、支付、优惠券表结构
4. **集成功能** - 主应用与购买页面的无缝对接

## 📁 项目结构

```
mycursor/                              # 主项目根目录
├── mycursor_java/                     # 后端Java项目
│   ├── src/main/java/com/mycursor/
│   │   ├── entity/                    # 实体类
│   │   │   ├── Product.java           # 商品实体
│   │   │   ├── Order.java             # 订单实体
│   │   │   ├── Payment.java           # 支付记录实体
│   │   │   └── Coupon.java            # 优惠券实体
│   │   ├── mapper/                    # 数据访问层
│   │   │   ├── ProductMapper.java
│   │   │   ├── OrderMapper.java
│   │   │   ├── PaymentMapper.java
│   │   │   └── CouponMapper.java
│   │   ├── service/                   # 业务逻辑层
│   │   │   ├── ProductService.java
│   │   │   └── OrderService.java
│   │   └── api/                       # API控制器
│   │       └── PurchaseController.java
│   └── src/main/resources/sql/
│       └── purchase_system.sql        # 数据库建表脚本
├── cursor-purchase-page/              # 购买页面前端
│   ├── index.html                     # 主页面
│   ├── server.py                      # Python服务器
│   └── README.md                      # 使用说明
├── src/config/
│   └── purchase.js                    # 购买功能配置
└── PURCHASE_SYSTEM_GUIDE.md          # 本说明文档
```

## 🚀 快速部署指南

### 第一步：数据库初始化

1. **连接到MySQL数据库**
```bash
mysql -u root -p
```

2. **执行建表脚本**
```sql
USE your_database_name;
source mycursor_java/src/main/resources/sql/purchase_system.sql;
```

3. **验证表创建**
```sql
SHOW TABLES;
SELECT * FROM products;  -- 查看示例商品数据
```

### 第二步：启动后端服务

```bash
cd mycursor_java
mvn spring-boot:run
```

服务将在 `http://localhost:8080` 启动

### 第三步：启动购买页面

```bash
cd cursor-purchase-page
python server.py
```

购买页面将在 `http://localhost:3000` 启动

### 第四步：测试完整流程

1. **启动主应用**
```bash
cd mycursor
npm run dev
```

2. **测试购买按钮**
   - 点击主应用中的"🛒 购买授权码"按钮
   - 应该会自动打开购买页面

3. **测试购买流程**
   - 选择商品套餐
   - 填写客户信息
   - 点击购买按钮
   - 查看生成的授权码

## 🔧 API接口文档

### 后端API端点

所有购买相关的API都在 `/api/purchase` 路径下：

#### 1. 获取商品列表
```http
GET /api/purchase/products
```

**响应示例:**
```json
{
  "code": 1,
  "message": "获取成功",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Cursor Pro 30天标准版",
        "description": "适合个人用户，一个月畅享所有功能",
        "durationDays": 30,
        "price": 29.90,
        "originalPrice": 59.90,
        "isHot": true,
        "isPurchasable": true
      }
    ],
    "totalCount": 5
  }
}
```

#### 2. 创建订单
```http
POST /api/purchase/orders
Content-Type: application/json

{
  "productId": 1,
  "customerName": "张三",
  "customerEmail": "user@example.com",
  "customerPhone": "13800138000",
  "deviceId": "28:df:eb:51:01:2b",
  "couponCode": "WELCOME10"
}
```

**响应示例:**
```json
{
  "code": 1,
  "message": "订单创建成功",
  "data": {
    "orderId": 123,
    "orderNo": "CUR169588729712341234",
    "productName": "Cursor Pro 30天标准版",
    "durationDays": 30,
    "originalPrice": 59.90,
    "finalPrice": 29.90,
    "discountAmount": 30.00,
    "status": "pending"
  }
}
```

#### 3. 模拟支付
```http
POST /api/purchase/orders/{orderNo}/pay
Content-Type: application/json

{
  "paymentMethod": "alipay"
}
```

**响应示例:**
```json
{
  "code": 1,
  "message": "支付成功",
  "data": {
    "orderId": 123,
    "orderNo": "CUR169588729712341234",
    "licenseCode": "ABC123DEF456GHI7",
    "durationDays": 30,
    "status": "completed",
    "paymentTime": "2025-09-26 10:45:30"
  }
}
```

## 💾 数据库表结构

### 1. 商品表 (products)
- 存储不同时长的授权码套餐
- 支持价格、库存、折扣等信息
- 默认包含7天、30天、90天、365天套餐

### 2. 订单表 (orders)
- 记录用户购买订单
- 关联商品信息和客户信息
- 跟踪订单状态和支付信息

### 3. 支付记录表 (payments)
- 记录支付流水
- 支持多种支付方式
- 存储支付回调数据

### 4. 优惠券表 (coupons)
- 支持固定金额和百分比优惠
- 可设置使用条件和有效期
- 默认包含示例优惠券

## 🎨 购买页面特性

### 现代化UI设计
- **渐变背景**: 紫蓝色渐变，视觉效果佳
- **卡片布局**: 统一的圆角卡片风格
- **响应式设计**: 支持PC和移动端
- **动画效果**: 悬停和点击动画

### 用户体验优化
- **实时反馈**: 加载状态、错误提示、成功提示
- **表单验证**: 必填字段验证、邮箱格式验证
- **一键复制**: 购买成功后可一键复制授权码
- **自动计算**: 实时显示价格和优惠金额

### 功能完整性
- **商品选择**: 多种套餐供用户选择
- **订单创建**: 完整的订单信息收集
- **支付模拟**: 模拟真实支付流程
- **结果展示**: 清晰显示购买结果

## 🔄 业务流程

### 完整购买流程

1. **用户发起购买**
   - 在主应用中点击"购买授权码"按钮
   - 系统打开购买页面(`http://localhost:3000`)

2. **选择商品套餐**
   - 页面加载商品列表
   - 用户选择适合的时长套餐
   - 系统实时计算价格

3. **填写订单信息**
   - 输入姓名、邮箱等必填信息
   - 可选填写手机号、设备ID
   - 可输入优惠券代码

4. **提交订单**
   - 验证表单信息
   - 调用后端API创建订单
   - 检查商品库存和优惠券

5. **处理支付**
   - 自动模拟支付流程
   - 更新订单状态为已支付
   - 调用授权码生成服务

6. **完成购买**
   - 显示购买成功页面
   - 展示生成的授权码
   - 用户可一键复制授权码

7. **使用授权码**
   - 用户在主应用中输入授权码
   - 系统验证并激活功能

## 🛠️ 开发和定制

### 添加新商品

在数据库中插入新商品：

```sql
INSERT INTO products (name, description, duration_days, price, original_price, is_active, is_hot, sort_order) 
VALUES ('Cursor Pro 180天半年版', '适合中长期项目开发', 180, 129.90, 219.90, 1, 0, 5);
```

### 创建优惠券

```sql
INSERT INTO coupons (code, name, type, value, min_amount, start_time, end_time, is_active) 
VALUES ('SAVE50', '满200减50', 'fixed', 50.00, 200.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1);
```

### 修改页面样式

编辑 `cursor-purchase-page/index.html` 中的CSS样式部分：

```css
/* 修改主色调 */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #e74c3c;
}
```

### 集成真实支付

替换 `simulatePayment` 函数，集成支付宝、微信等真实支付接口：

```javascript
// 替换为真实支付逻辑
async function processRealPayment(orderNo, paymentMethod) {
    // 调用支付宝/微信支付API
    // 处理支付回调
    // 更新订单状态
}
```

## 🔍 测试和调试

### 测试用例

1. **商品加载测试**
   - 访问购买页面，检查商品是否正确显示
   - 验证价格、折扣、库存信息

2. **订单创建测试**
   - 填写完整信息创建订单
   - 测试必填字段验证
   - 测试邮箱格式验证

3. **支付流程测试**
   - 模拟支付成功场景
   - 验证授权码生成
   - 检查订单状态更新

4. **异常场景测试**
   - 网络断开时的处理
   - 后端服务不可用时的提示
   - 无效优惠券的处理

### 调试技巧

1. **浏览器开发者工具**
   - Network标签查看API请求
   - Console标签查看错误信息

2. **后端日志**
   ```bash
   tail -f mycursor_java/logs/application.log
   ```

3. **数据库查询**
   ```sql
   SELECT * FROM orders ORDER BY created_time DESC LIMIT 10;
   SELECT * FROM products WHERE is_active = 1;
   ```

## 🚀 生产环境部署

### 后端部署

1. **构建项目**
```bash
cd mycursor_java
mvn clean package
```

2. **运行JAR包**
```bash
java -jar target/mycursor-0.0.1-SNAPSHOT.jar
```

### 前端部署

1. **使用Nginx**
```nginx
server {
    listen 80;
    server_name purchase.yourdomain.com;
    root /path/to/cursor-purchase-page;
    index index.html;
}
```

2. **配置域名**
修改 `src/config/purchase.js`:
```javascript
purchaseUrl: 'https://purchase.yourdomain.com'
```

### 安全配置

1. **启用HTTPS**
2. **配置CORS策略**
3. **添加API限流**
4. **设置数据库连接池**

## 📈 扩展功能建议

### 短期扩展
1. **优惠券系统完善** - 支持优惠券验证和使用
2. **邮件通知** - 购买成功后发送邮件
3. **订单查询** - 支持订单号查询功能
4. **库存预警** - 库存不足时的提醒

### 长期扩展
1. **用户系统** - 注册登录、订单历史
2. **真实支付** - 集成支付宝、微信支付
3. **管理后台** - 商品管理、订单管理、统计分析
4. **移动端应用** - 开发专门的移动端购买应用

## 💡 最佳实践

### 安全建议
1. **输入验证** - 前后端都要进行参数验证
2. **SQL注入防护** - 使用参数化查询
3. **XSS防护** - 对用户输入进行转义
4. **HTTPS传输** - 生产环境必须使用HTTPS

### 性能优化
1. **数据库索引** - 为常用查询字段添加索引
2. **缓存策略** - Redis缓存热点数据
3. **CDN加速** - 静态资源使用CDN
4. **负载均衡** - 多实例部署时使用负载均衡

### 监控运维
1. **日志监控** - 使用ELK等日志分析工具
2. **性能监控** - APM工具监控应用性能
3. **错误告警** - 异常情况及时告警
4. **备份策略** - 定期备份数据库

## 🎉 总结

现在你拥有了一个完整的授权码购买系统！

✅ **后端API** - 完整的商品、订单、支付功能
✅ **数据库设计** - 规范的表结构和示例数据  
✅ **购买页面** - 现代化的用户界面
✅ **系统集成** - 主应用与购买页面无缝对接
✅ **文档完整** - 详细的部署和使用说明

用户现在可以：
1. 在主应用中点击购买按钮
2. 选择合适的授权码套餐
3. 填写信息并完成购买
4. 立即获得可用的授权码
5. 在主应用中输入授权码使用

这个系统具有良好的扩展性，你可以根据业务需要继续完善和优化！

