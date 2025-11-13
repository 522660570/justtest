-- 系统公告表
CREATE TABLE IF NOT EXISTS `system_notice` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(255) NOT NULL COMMENT '公告标题',
  `content` text NOT NULL COMMENT '公告内容',
  `notice_type` varchar(20) NOT NULL DEFAULT 'warning' COMMENT '公告类型：warning, info, success, error',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `priority` int(11) NOT NULL DEFAULT '0' COMMENT '优先级，数字越大优先级越高',
  `start_time` datetime DEFAULT NULL COMMENT '生效开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '生效结束时间',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_notice_type` (`notice_type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统公告表';

-- 插入默认的频繁换号警告公告
INSERT INTO `system_notice` (`title`, `content`, `notice_type`, `priority`, `is_active`) VALUES 
('频繁换号警告', '不要频繁进行换号，一天之内更换过多会导致无效账号，本店会进行设备封禁，一天10-20个足够使用！！', 'warning', 100, 1);

-- 可以添加更多公告示例
INSERT INTO `system_notice` (`title`, `content`, `notice_type`, `priority`, `is_active`) VALUES 
('使用须知', '请合理使用账号资源，避免恶意操作。如有问题请联系客服。', 'info', 50, 1);

-- 查看插入的公告
SELECT * FROM `system_notice` ORDER BY `priority` DESC, `created_time` DESC;
