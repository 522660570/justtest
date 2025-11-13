-- 增加账号订阅状态字段
-- Migration: 添加 membership_type 字段到 cursor_account 表

-- 1. 添加 membership_type 字段
ALTER TABLE cursor_account 
ADD COLUMN membership_type VARCHAR(50) DEFAULT 'unknown' COMMENT '订阅状态: free, pro, business, unknown';

-- 2. 添加 membership_check_time 字段，记录最后一次检查订阅状态的时间
ALTER TABLE cursor_account 
ADD COLUMN membership_check_time DATETIME COMMENT '订阅状态检查时间';

-- 3. 添加索引以优化查询
CREATE INDEX idx_membership_type ON cursor_account(membership_type);
CREATE INDEX idx_membership_check_time ON cursor_account(membership_check_time);

-- 4. 更新已有数据的默认值
UPDATE cursor_account 
SET membership_type = 'unknown', 
    membership_check_time = NULL 
WHERE membership_type IS NULL;

-- 查询验证
SELECT 
    COUNT(*) as total_accounts,
    SUM(CASE WHEN membership_type = 'free' THEN 1 ELSE 0 END) as free_accounts,
    SUM(CASE WHEN membership_type = 'pro' THEN 1 ELSE 0 END) as pro_accounts,
    SUM(CASE WHEN membership_type = 'business' THEN 1 ELSE 0 END) as business_accounts,
    SUM(CASE WHEN membership_type = 'unknown' THEN 1 ELSE 0 END) as unknown_accounts
FROM cursor_account;

