-- 数据库迁移脚本：添加session_token和actual_usage_amount字段
USE `mycursor`;

-- 为cursor_account表添加session_token字段
ALTER TABLE `cursor_account` 
ADD COLUMN `session_token` TEXT NULL COMMENT 'WorkosCursorSessionToken，用于检测使用情况' AFTER `refresh_token`;

-- 为cursor_account表添加actual_usage_amount字段
ALTER TABLE `cursor_account` 
ADD COLUMN `actual_usage_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '实际使用金额（美元）' AFTER `is_quota_full`;

-- 查看表结构确认字段已添加
DESCRIBE `cursor_account`;
