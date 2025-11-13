-- 修复字段定义
-- 1. total_days 字段允许为 NULL（次卡时为 NULL）
-- 2. license_type 改为 INT 类型（1=天卡, 2=次卡）

ALTER TABLE license MODIFY COLUMN total_days INT DEFAULT NULL COMMENT '有效天数（天卡专用）';

-- 如果 license_type 已经是 VARCHAR 类型，需要先转换
ALTER TABLE license MODIFY COLUMN license_type INT DEFAULT 1 COMMENT '授权码类型：1=天卡, 2=次卡';

