-- 购买系统数据库表设计

-- 1. 商品表 (products)
CREATE TABLE IF NOT EXISTS `products` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `name` varchar(100) NOT NULL COMMENT '商品名称',
  `description` text COMMENT '商品描述',
  `duration_days` int(11) NOT NULL COMMENT '授权天数',
  `price` decimal(10,2) NOT NULL COMMENT '价格（元）',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原价（用于显示折扣）',
  `discount_rate` decimal(5,2) DEFAULT 0.00 COMMENT '折扣率（0-1）',
  `stock_quantity` int(11) DEFAULT -1 COMMENT '库存数量（-1表示无限）',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否上架',
  `is_hot` tinyint(1) DEFAULT '0' COMMENT '是否热门商品',
  `sort_order` int(11) DEFAULT '0' COMMENT '排序权重',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_duration_days` (`duration_days`),
  KEY `idx_price` (`price`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- 2. 订单表 (orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `product_id` bigint(20) NOT NULL COMMENT '商品ID',
  `product_name` varchar(100) NOT NULL COMMENT '商品名称（冗余字段）',
  `duration_days` int(11) NOT NULL COMMENT '授权天数（冗余字段）',
  `price` decimal(10,2) NOT NULL COMMENT '实际支付价格',
  `original_price` decimal(10,2) NOT NULL COMMENT '商品原价',
  `discount_amount` decimal(10,2) DEFAULT 0.00 COMMENT '优惠金额',
  `customer_email` varchar(100) COMMENT '客户邮箱',
  `customer_phone` varchar(20) COMMENT '客户手机号',
  `customer_name` varchar(50) COMMENT '客户姓名',
  `device_id` varchar(100) COMMENT '设备标识（MAC地址等）',
  `license_code` varchar(50) COMMENT '生成的授权码',
  `license_generated_time` datetime COMMENT '授权码生成时间',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '订单状态：pending待支付,paid已支付,completed已完成,cancelled已取消,refunded已退款',
  `payment_method` varchar(20) COMMENT '支付方式：alipay,wechat,bank_card',
  `payment_transaction_id` varchar(100) COMMENT '支付流水号',
  `payment_time` datetime COMMENT '支付时间',
  `notes` text COMMENT '订单备注',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`),
  KEY `idx_customer_email` (`customer_email`),
  KEY `idx_license_code` (`license_code`),
  KEY `idx_payment_time` (`payment_time`),
  KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 3. 支付记录表 (payments)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '支付记录ID',
  `order_id` bigint(20) NOT NULL COMMENT '订单ID',
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `payment_method` varchar(20) NOT NULL COMMENT '支付方式',
  `payment_channel` varchar(50) COMMENT '支付渠道（具体的支付接口）',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `currency` varchar(10) DEFAULT 'CNY' COMMENT '货币类型',
  `transaction_id` varchar(100) COMMENT '第三方支付流水号',
  `platform_order_no` varchar(100) COMMENT '支付平台订单号',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '支付状态：pending待支付,success成功,failed失败,cancelled取消',
  `callback_data` text COMMENT '支付回调数据（JSON格式）',
  `callback_time` datetime COMMENT '回调时间',
  `failure_reason` varchar(200) COMMENT '失败原因',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_order_no` (`order_no`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- 4. 优惠券表 (coupons)
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '优惠券ID',
  `code` varchar(50) NOT NULL COMMENT '优惠券代码',
  `name` varchar(100) NOT NULL COMMENT '优惠券名称',
  `type` varchar(20) NOT NULL COMMENT '优惠类型：fixed固定金额,percent百分比',
  `value` decimal(10,2) NOT NULL COMMENT '优惠值（固定金额或百分比）',
  `min_amount` decimal(10,2) DEFAULT 0.00 COMMENT '最低使用金额',
  `max_discount` decimal(10,2) COMMENT '最大优惠金额（百分比优惠时有效）',
  `usage_limit` int(11) DEFAULT 1 COMMENT '使用次数限制',
  `used_count` int(11) DEFAULT 0 COMMENT '已使用次数',
  `start_time` datetime NOT NULL COMMENT '生效时间',
  `end_time` datetime NOT NULL COMMENT '失效时间',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `applicable_products` varchar(500) COMMENT '适用商品ID列表（JSON数组，空表示全部）',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_start_end_time` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠券表';

-- 5. 订单优惠券使用记录表 (order_coupons)
CREATE TABLE IF NOT EXISTS `order_coupons` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `order_id` bigint(20) NOT NULL COMMENT '订单ID',
  `coupon_id` bigint(20) NOT NULL COMMENT '优惠券ID',
  `coupon_code` varchar(50) NOT NULL COMMENT '优惠券代码',
  `discount_amount` decimal(10,2) NOT NULL COMMENT '实际优惠金额',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '使用时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_coupon_id` (`coupon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单优惠券使用记录表';

-- 插入默认商品数据
INSERT INTO `products` (`name`, `description`, `duration_days`, `price`, `original_price`, `is_active`, `is_hot`, `sort_order`) VALUES
('Cursor Pro 7天体验版', '适合新用户体验，享受7天完整功能', 7, 9.90, 19.90, 1, 0, 1),
('Cursor Pro 30天标准版', '适合个人用户，一个月畅享所有功能', 30, 29.90, 59.90, 1, 1, 2),
('Cursor Pro 90天季度版', '高性价比选择，三个月长期使用', 90, 79.90, 159.90, 1, 1, 3),
('Cursor Pro 365天年度版', '最优惠选择，全年无忧使用', 365, 199.90, 399.90, 1, 1, 4),
('Cursor Pro 180天半年版', '适合中长期项目开发', 180, 129.90, 219.90, 1, 0, 5);

-- 插入示例优惠券
INSERT INTO `coupons` (`code`, `name`, `type`, `value`, `min_amount`, `start_time`, `end_time`, `is_active`) VALUES
('WELCOME10', '新用户10元优惠券', 'fixed', 10.00, 30.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1),
('SAVE20', '满100减20', 'fixed', 20.00, 100.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1),
('PERCENT15', '全场85折优惠券', 'percent', 0.15, 50.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1);

-- 查看插入的数据
SELECT '=== 商品列表 ===' as info;
SELECT id, name, duration_days, price, original_price, is_hot FROM products ORDER BY sort_order;

SELECT '=== 优惠券列表 ===' as info;
SELECT id, code, name, type, value, min_amount FROM coupons WHERE is_active = 1;

