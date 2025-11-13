-- 添加授权码跟踪字段到cursor_account表
-- 版本: V2
-- 描述: 添加账号被授权码占用的跟踪字段

-- 添加占用授权码字段
ALTER TABLE cursor_account 
ADD COLUMN occupied_by_license_code VARCHAR(255) NULL COMMENT '占用该账号的授权码';

-- 添加占用时间字段
ALTER TABLE cursor_account 
ADD COLUMN occupied_time DATETIME NULL COMMENT '账号被占用的时间';

-- 创建索引提高查询性能
CREATE INDEX idx_occupied_by_license_code ON cursor_account(occupied_by_license_code);
CREATE INDEX idx_occupied_time ON cursor_account(occupied_time);

-- 添加备注
-- 这些字段用于跟踪每个账号被哪个授权码占用，便于管理和统计
