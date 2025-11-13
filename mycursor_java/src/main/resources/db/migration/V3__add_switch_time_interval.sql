-- V3: 添加换号时间间隔控制字段
-- 用于实现"每次换号间隔必须2分钟以上"的功能

-- 给 device_binding 表添加 last_switch_time 字段
-- 存储最后一次换号的具体时间（包含日期和时间）
ALTER TABLE device_binding ADD COLUMN last_switch_time DATETIME NULL COMMENT '最后一次换号的时间（用于时间间隔控制）';

-- 创建索引以提高查询性能
CREATE INDEX idx_last_switch_time ON device_binding(last_switch_time);

-- 初始化已有数据：如果 last_switch_date 有值，设置为当天的00:00:00
-- 这样避免旧数据受到时间间隔限制的影响
UPDATE device_binding 
SET last_switch_time = TIMESTAMP(last_switch_date, '00:00:00') 
WHERE last_switch_date IS NOT NULL AND last_switch_time IS NULL;




