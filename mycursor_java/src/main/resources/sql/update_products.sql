-- 更新商品套餐数据
-- 根据新的价格要求：1天2元，3天5元，7天9.9元，15天18元，30天28元

-- 清空现有商品数据
DELETE FROM products;

-- 插入新的商品套餐
INSERT INTO `products` (`name`, `description`, `duration_days`, `price`, `original_price`, `is_active`, `is_hot`, `sort_order`) VALUES
('Cursor Pro 1天体验版', '快速体验 Cursor Pro 完整功能', 1, 2.00, NULL, 1, 0, 1),
('Cursor Pro 3天入门版', '短期项目或学习使用', 3, 5.00, NULL, 1, 0, 2),
('Cursor Pro 7天标准版', '一周深度体验，适合小型项目', 7, 9.90, NULL, 1, 1, 3),
('Cursor Pro 15天进阶版', '半月畅享，适合中型项目开发', 15, 18.00, NULL, 1, 1, 4),
('Cursor Pro 30天专业版', '月度套餐，性价比之选', 30, 28.00, NULL, 1, 1, 5);

-- 查看更新后的商品列表
SELECT id, name, duration_days, price, is_hot, sort_order FROM products ORDER BY sort_order;

