-- 添加授权码类型和换号次数相关字段
-- 支持天卡(按天数计算)和次卡(按换号次数计算)两种模式

-- 修改 total_days 字段，允许为 NULL（次卡时为 NULL）
ALTER TABLE license MODIFY COLUMN total_days INT DEFAULT NULL COMMENT '有效天数（天卡专用）';

-- 添加授权码类型字段，默认为天卡（1=天卡, 2=次卡）
ALTER TABLE license ADD COLUMN license_type INT DEFAULT 1 COMMENT '授权码类型：1=天卡, 2=次卡';

-- 添加总换号次数字段（次卡专用）
ALTER TABLE license ADD COLUMN total_switches INT DEFAULT NULL COMMENT '总换号次数（次卡专用）';

-- 添加已使用的换号次数字段（次卡专用）
ALTER TABLE license ADD COLUMN used_switches INT DEFAULT 0 COMMENT '已使用的换号次数（次卡专用）';

-- 为已有记录设置默认值
UPDATE license SET license_type = 1 WHERE license_type IS NULL;
UPDATE license SET used_switches = 0 WHERE used_switches IS NULL;

