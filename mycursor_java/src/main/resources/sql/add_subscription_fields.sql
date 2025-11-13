-- 添加订阅详情字段
USE `mycursor`;

-- 添加 trial_length_days 字段
ALTER TABLE `cursor_account` 
ADD COLUMN `trial_length_days` INT DEFAULT NULL COMMENT '试用总天数' AFTER `membership_check_time`;

-- 添加 days_remaining_on_trial 字段
ALTER TABLE `cursor_account` 
ADD COLUMN `days_remaining_on_trial` INT DEFAULT NULL COMMENT '剩余试用天数' AFTER `trial_length_days`;

-- 验证字段已添加
DESCRIBE `cursor_account`;

