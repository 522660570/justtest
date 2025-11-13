-- 创建数据库
CREATE DATABASE IF NOT EXISTS `mycursor` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `mycursor`;

-- 创建授权码表
CREATE TABLE IF NOT EXISTS `license` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `license_code` varchar(100) NOT NULL COMMENT '授权码',
  `bound_mac_address` varchar(50) DEFAULT NULL COMMENT '绑定的MAC地址',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `expiry_time` datetime DEFAULT NULL COMMENT '过期时间（首次绑定时设置）',
  `total_days` int(11) NOT NULL COMMENT '总天数',
  `membership_type` varchar(20) NOT NULL DEFAULT 'Pro' COMMENT '会员类型',
  `first_bind_time` datetime DEFAULT NULL COMMENT '首次绑定时间',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_license_code` (`license_code`),
  KEY `idx_bound_mac_address` (`bound_mac_address`),
  KEY `idx_is_active_expiry_time` (`is_active`, `expiry_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='授权码表';

-- 创建Cursor账号表
CREATE TABLE IF NOT EXISTS `cursor_account` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `email` varchar(100) NOT NULL COMMENT '邮箱地址',
  `access_token` text COMMENT '访问令牌',
  `refresh_token` text COMMENT '刷新令牌',
  `sign_up_type` varchar(20) NOT NULL DEFAULT 'email' COMMENT '注册类型',
  `is_available` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否可用',
  `is_quota_full` tinyint(1) NOT NULL DEFAULT '0' COMMENT '额度是否已满',
  `last_used_time` datetime DEFAULT NULL COMMENT '最后使用时间',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `quota_check_time` datetime DEFAULT NULL COMMENT '额度检查时间',
  `notes` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_is_available_quota_full` (`is_available`, `is_quota_full`),
  KEY `idx_last_used_time` (`last_used_time`),
  KEY `idx_quota_check_time` (`quota_check_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cursor账号表';

-- 创建设备绑定表
CREATE TABLE IF NOT EXISTS `device_binding` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `license_code` varchar(100) NOT NULL COMMENT '授权码',
  `mac_address` varchar(50) NOT NULL COMMENT 'MAC地址',
  `device_name` varchar(100) DEFAULT NULL COMMENT '设备名称',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `first_bind_time` datetime NOT NULL COMMENT '首次绑定时间',
  `last_active_time` datetime DEFAULT NULL COMMENT '最后活跃时间',
  `switch_count_today` int(11) NOT NULL DEFAULT '0' COMMENT '今日换号次数',
  `last_switch_date` date DEFAULT NULL COMMENT '上次换号日期',
  `total_switch_count` int(11) NOT NULL DEFAULT '0' COMMENT '总换号次数',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_license_mac` (`license_code`, `mac_address`),
  KEY `idx_license_code` (`license_code`),
  KEY `idx_mac_address` (`mac_address`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_last_active_time` (`last_active_time`),
  KEY `idx_last_switch_date` (`last_switch_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备绑定表';
