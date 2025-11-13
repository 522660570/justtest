/*
 Navicat Premium Data Transfer

 Source Server         : 本地docker
 Source Server Type    : MySQL
 Source Server Version : 80043
 Source Host           : localhost:3306
 Source Schema         : mycursor

 Target Server Type    : MySQL
 Target Server Version : 80043
 File Encoding         : 65001

 Date: 01/11/2025 01:20:59
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for coupons
-- ----------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons`  (
  `id` bigint(0) NOT NULL AUTO_INCREMENT COMMENT '优惠券ID',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '优惠券代码',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '优惠券名称',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '优惠类型：fixed固定金额,percent百分比',
  `value` decimal(10, 2) NOT NULL COMMENT '优惠值（固定金额或百分比）',
  `min_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '最低使用金额',
  `max_discount` decimal(10, 2) NULL DEFAULT NULL COMMENT '最大优惠金额（百分比优惠时有效）',
  `usage_limit` int(0) NULL DEFAULT 1 COMMENT '使用次数限制',
  `used_count` int(0) NULL DEFAULT 0 COMMENT '已使用次数',
  `start_time` datetime(0) NOT NULL COMMENT '生效时间',
  `end_time` datetime(0) NOT NULL COMMENT '失效时间',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  `applicable_products` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '适用商品ID列表（JSON数组，空表示全部）',
  `created_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code`) USING BTREE,
  INDEX `idx_is_active`(`is_active`) USING BTREE,
  INDEX `idx_start_end_time`(`start_time`, `end_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '优惠券表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of coupons
-- ----------------------------
INSERT INTO `coupons` VALUES (1, 'WELCOME10', '新用户10元优惠券', 'fixed', 10.00, 30.00, NULL, 1, 0, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1, NULL, '2025-09-26 02:52:13', '2025-09-26 02:52:13');
INSERT INTO `coupons` VALUES (2, 'SAVE20', '满100减20', 'fixed', 20.00, 100.00, NULL, 1, 0, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1, NULL, '2025-09-26 02:52:13', '2025-09-26 02:52:13');
INSERT INTO `coupons` VALUES (3, 'PERCENT15', '全场85折优惠券', 'percent', 0.15, 50.00, NULL, 1, 0, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1, NULL, '2025-09-26 02:52:13', '2025-09-26 02:52:13');

-- ----------------------------
-- Table structure for cursor_account
-- ----------------------------
DROP TABLE IF EXISTS `cursor_account`;
CREATE TABLE `cursor_account`  (
  `id` bigint(0) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `membership_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'unknown' COMMENT '订阅状态: free, pro, business, unknown',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮箱地址',
  `days_remaining_on_trial` int(0) NULL DEFAULT NULL COMMENT '剩余试用天数',
  `trial_length_days` int(0) NULL DEFAULT NULL COMMENT '试用天数',
  `access_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '访问令牌',
  `refresh_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '刷新令牌',
  `session_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT 'WorkosCursorSessionToken，用于检测使用情况',
  `sign_up_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'email' COMMENT '注册类型',
  `is_available` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否可用',
  `is_quota_full` tinyint(1) NOT NULL DEFAULT 0 COMMENT '额度是否已满',
  `actual_usage_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '实际使用金额（美元）',
  `last_used_time` datetime(0) NULL DEFAULT NULL COMMENT '最后使用时间',
  `created_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  `quota_check_time` datetime(0) NULL DEFAULT NULL COMMENT '额度检查时间',
  `notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `occupied_by_license_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '占用该账号的授权码',
  `occupied_time` datetime(0) NULL DEFAULT NULL COMMENT '账号被占用的时间',
  `membership_check_time` datetime(0) NULL DEFAULT NULL COMMENT '订阅状态检查时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_email`(`email`) USING BTREE,
  INDEX `idx_is_available_quota_full`(`is_available`, `is_quota_full`) USING BTREE,
  INDEX `idx_last_used_time`(`last_used_time`) USING BTREE,
  INDEX `idx_quota_check_time`(`quota_check_time`) USING BTREE,
  INDEX `idx_occupied_by_license_code`(`occupied_by_license_code`) USING BTREE,
  INDEX `idx_occupied_time`(`occupied_time`) USING BTREE,
  INDEX `idx_membership_type`(`membership_type`) USING BTREE,
  INDEX `idx_membership_check_time`(`membership_check_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 125 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Cursor账号表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cursor_account
-- ----------------------------
INSERT INTO `cursor_account` VALUES (113, 'free_trial', '02-pages-dodgy@icloud.com', 6, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhHSlJOMEg4S1ZNVlFGWlFSUkRaQUM5IiwidGltZSI6IjE3NjE0OTMxOTciLCJyYW5kb21uZXNzIjoiNDE1NjdjMmMtZmJkZS00ZDUwIiwiZXhwIjoxNzY2Njc3MTk3LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.Kbol21e4zgFL8CH3h0mTtsBQr3EFP-TUwpsei6aLwyw', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhHSlJOMEg4S1ZNVlFGWlFSUkRaQUM5IiwidGltZSI6IjE3NjE0OTMxOTciLCJyYW5kb21uZXNzIjoiNDE1NjdjMmMtZmJkZS00ZDUwIiwiZXhwIjoxNzY2Njc3MTk3LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.Kbol21e4zgFL8CH3h0mTtsBQr3EFP-TUwpsei6aLwyw', 'user_01K8GJRN0H8KVMVQFZQRRDZAC9%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhHSlJOMEg4S1ZNVlFGWlFSUkRaQUM5IiwidGltZSI6IjE3NjE0OTMxOTciLCJyYW5kb21uZXNzIjoiNDE1NjdjMmMtZmJkZS00ZDUwIiwiZXhwIjoxNzY2Njc3MTk3LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.Kbol21e4zgFL8CH3h0mTtsBQr3EFP-TUwpsei6aLwyw', 'Auth0', 0, 0, 0.00, '2025-10-27 22:51:04', '2025-10-26 23:40:57', '2025-10-28 22:57:08', NULL, '[2025-10-27 22:01:34] 通过导入创建新账号\n[2025-10-27 22:01:40] 通过导入更新账号信息', NULL, '2025-10-27 22:51:04', '2025-10-28 22:11:10');
INSERT INTO `cursor_account` VALUES (114, 'free_trial', 'spike.21-flocks@icloud.com', 6, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhHSlhIMVJOQTJFMVpIQktIRkQyOTdZIiwidGltZSI6IjE3NjE0OTMzNjkiLCJyYW5kb21uZXNzIjoiNTFkN2EzMTYtZTA5ZS00NjEwIiwiZXhwIjoxNzY2Njc3MzY5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.e1T_vNYzYXY2bH4hAb0fs6hbGKO90mdp1vo9PDbELtc', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhHSlhIMVJOQTJFMVpIQktIRkQyOTdZIiwidGltZSI6IjE3NjE0OTMzNjkiLCJyYW5kb21uZXNzIjoiNTFkN2EzMTYtZTA5ZS00NjEwIiwiZXhwIjoxNzY2Njc3MzY5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.e1T_vNYzYXY2bH4hAb0fs6hbGKO90mdp1vo9PDbELtc', 'user_01K8GJXH1RNA2E1ZHBKHFD297Y%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhHSlhIMVJOQTJFMVpIQktIRkQyOTdZIiwidGltZSI6IjE3NjE0OTMzNjkiLCJyYW5kb21uZXNzIjoiNTFkN2EzMTYtZTA5ZS00NjEwIiwiZXhwIjoxNzY2Njc3MzY5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.e1T_vNYzYXY2bH4hAb0fs6hbGKO90mdp1vo9PDbELtc', 'Auth0', 1, 0, 6.22, '2025-10-28 22:58:16', '2025-10-26 23:45:38', '2025-10-28 23:16:54', '2025-10-28 22:41:21', '[2025-10-27 22:01:34] 通过导入创建新账号\n[2025-10-27 22:01:40] 通过导入更新账号信息', NULL, '2025-10-28 22:58:16', '2025-10-28 22:58:15');
INSERT INTO `cursor_account` VALUES (115, 'free_trial', 'padlock-inward1h@icloud.com', 7, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNODM2UzdBV042U1FLUkZEQUZTNlhOIiwidGltZSI6IjE3NjE2MTYyMzQiLCJyYW5kb21uZXNzIjoiNzczMzkyMDktNWRjNi00ZGY3IiwiZXhwIjoxNzY2ODAwMjM0LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.PYwRezvBO81J4cOT-C4CYNlPFDjEtv9kWu_TURvdR-I', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNODM2UzdBV042U1FLUkZEQUZTNlhOIiwidGltZSI6IjE3NjE2MTYyMzQiLCJyYW5kb21uZXNzIjoiNzczMzkyMDktNWRjNi00ZGY3IiwiZXhwIjoxNzY2ODAwMjM0LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.PYwRezvBO81J4cOT-C4CYNlPFDjEtv9kWu_TURvdR-I', 'user_01K8M836S7AWN6SQKRFDAFS6XN%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNODM2UzdBV042U1FLUkZEQUZTNlhOIiwidGltZSI6IjE3NjE2MTYyMzQiLCJyYW5kb21uZXNzIjoiNzczMzkyMDktNWRjNi00ZGY3IiwiZXhwIjoxNzY2ODAwMjM0LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.PYwRezvBO81J4cOT-C4CYNlPFDjEtv9kWu_TURvdR-I', 'Auth0', 0, 0, 0.00, '2025-10-28 22:41:22', '2025-10-28 09:51:08', '2025-10-28 23:18:03', NULL, '[2025-10-28 22:10:40] 通过导入创建新账号', NULL, '2025-10-28 22:41:22', '2025-10-28 22:41:21');
INSERT INTO `cursor_account` VALUES (116, 'free_trial', 'piety.hires_0y@icloud.com', 7, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNODdHSDVXVEFRVktXNUhLMjlUUU1YIiwidGltZSI6IjE3NjE2MTYzNzIiLCJyYW5kb21uZXNzIjoiNzllN2ViNDQtNGMwZC00NzE2IiwiZXhwIjoxNzY2ODAwMzcyLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.-3QQYizleetQTM3ZfYKJSTge6PEa2gZOGK3xqMMSFjA', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNODdHSDVXVEFRVktXNUhLMjlUUU1YIiwidGltZSI6IjE3NjE2MTYzNzIiLCJyYW5kb21uZXNzIjoiNzllN2ViNDQtNGMwZC00NzE2IiwiZXhwIjoxNzY2ODAwMzcyLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.-3QQYizleetQTM3ZfYKJSTge6PEa2gZOGK3xqMMSFjA', 'user_01K8M87GH5WTAQVKW5HK29TQMX%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNODdHSDVXVEFRVktXNUhLMjlUUU1YIiwidGltZSI6IjE3NjE2MTYzNzIiLCJyYW5kb21uZXNzIjoiNzllN2ViNDQtNGMwZC00NzE2IiwiZXhwIjoxNzY2ODAwMzcyLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.-3QQYizleetQTM3ZfYKJSTge6PEa2gZOGK3xqMMSFjA', 'Auth0', 0, 0, 0.00, NULL, '2025-10-28 09:53:34', '2025-10-28 23:17:59', NULL, '[2025-10-28 22:10:40] 通过导入创建新账号', NULL, '2025-10-28 23:16:59', '2025-10-28 23:16:58');
INSERT INTO `cursor_account` VALUES (117, 'free_trial', 'tricks-74wearer@icloud.com', 7, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNQjE3ODU3MTNUWEhOWTI0OVE1ODFSIiwidGltZSI6IjE3NjE2MTkyNjkiLCJyYW5kb21uZXNzIjoiYTQzMzk1ODAtMGZlNC00OGVmIiwiZXhwIjoxNzY2ODAzMjY5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.QhpHogCR54zgwh2IMNe91nXdcK9iVlc320yBVOyPNF8', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNQjE3ODU3MTNUWEhOWTI0OVE1ODFSIiwidGltZSI6IjE3NjE2MTkyNjkiLCJyYW5kb21uZXNzIjoiYTQzMzk1ODAtMGZlNC00OGVmIiwiZXhwIjoxNzY2ODAzMjY5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.QhpHogCR54zgwh2IMNe91nXdcK9iVlc320yBVOyPNF8', 'user_01K8MB1785713TXHNY249Q581R%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNQjE3ODU3MTNUWEhOWTI0OVE1ODFSIiwidGltZSI6IjE3NjE2MTkyNjkiLCJyYW5kb21uZXNzIjoiYTQzMzk1ODAtMGZlNC00OGVmIiwiZXhwIjoxNzY2ODAzMjY5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.QhpHogCR54zgwh2IMNe91nXdcK9iVlc320yBVOyPNF8', 'Auth0', 0, 0, 0.00, NULL, '2025-10-28 10:42:19', '2025-10-28 23:18:03', NULL, '[2025-10-28 22:10:40] 通过导入创建新账号', NULL, NULL, '2025-10-28 22:11:14');
INSERT INTO `cursor_account` VALUES (119, 'free_trial', 'calyx.lingual_2s@icloud.com', 7, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNU1RSNjQ1U0U2M01USjA0SlM5UEo1IiwidGltZSI6IjE3NjE2MzQ4MjkiLCJyYW5kb21uZXNzIjoiNTZmYjVkZDQtNGU1MC00NTQ2IiwiZXhwIjoxNzY2ODE4ODI5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.zsKmxl5QRO9QJvgdc3mju-jrlQyjqyG4XoTRj-BT5v8', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNU1RSNjQ1U0U2M01USjA0SlM5UEo1IiwidGltZSI6IjE3NjE2MzQ4MjkiLCJyYW5kb21uZXNzIjoiNTZmYjVkZDQtNGU1MC00NTQ2IiwiZXhwIjoxNzY2ODE4ODI5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.zsKmxl5QRO9QJvgdc3mju-jrlQyjqyG4XoTRj-BT5v8', 'user_01K8MSTR645SE63MTJ04JS9PJ5%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNU1RSNjQ1U0U2M01USjA0SlM5UEo1IiwidGltZSI6IjE3NjE2MzQ4MjkiLCJyYW5kb21uZXNzIjoiNTZmYjVkZDQtNGU1MC00NTQ2IiwiZXhwIjoxNzY2ODE4ODI5LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.zsKmxl5QRO9QJvgdc3mju-jrlQyjqyG4XoTRj-BT5v8', 'Auth0', 0, 0, 0.00, NULL, '2025-10-28 15:01:02', '2025-10-28 23:18:03', NULL, '[2025-10-28 22:10:40] 通过导入创建新账号', NULL, NULL, '2025-10-28 22:11:16');
INSERT INTO `cursor_account` VALUES (120, 'free_trial', 'dune.catchup-5o@icloud.com', 7, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNVDBCVzNNWVMyQ1cyU1ZXM0Q3UTE4IiwidGltZSI6IjE3NjE2MzQ5NzIiLCJyYW5kb21uZXNzIjoiMDM0ODZhYmMtNDIwYi00YjcyIiwiZXhwIjoxNzY2ODE4OTcyLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.CmW6HB55JMvgJ_LKT21NKlJ2btXBNsfM8bETGcVFnOk', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNVDBCVzNNWVMyQ1cyU1ZXM0Q3UTE4IiwidGltZSI6IjE3NjE2MzQ5NzIiLCJyYW5kb21uZXNzIjoiMDM0ODZhYmMtNDIwYi00YjcyIiwiZXhwIjoxNzY2ODE4OTcyLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.CmW6HB55JMvgJ_LKT21NKlJ2btXBNsfM8bETGcVFnOk', 'user_01K8MT0BW3MYS2CW2SVW3D7Q18%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNVDBCVzNNWVMyQ1cyU1ZXM0Q3UTE4IiwidGltZSI6IjE3NjE2MzQ5NzIiLCJyYW5kb21uZXNzIjoiMDM0ODZhYmMtNDIwYi00YjcyIiwiZXhwIjoxNzY2ODE4OTcyLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.CmW6HB55JMvgJ_LKT21NKlJ2btXBNsfM8bETGcVFnOk', 'Auth0', 0, 0, 0.00, NULL, '2025-10-28 15:03:34', '2025-10-28 23:18:03', NULL, '[2025-10-28 22:10:40] 通过导入创建新账号', NULL, NULL, '2025-10-28 22:11:17');
INSERT INTO `cursor_account` VALUES (122, 'free_trial', 'chilly.plats.9z@icloud.com', 7, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNVDlFQlMzVEg2TkU1RDNONldENU5DIiwidGltZSI6IjE3NjE2MzUzMTAiLCJyYW5kb21uZXNzIjoiYjgwZmIzYmEtZGZmNy00ZmQwIiwiZXhwIjoxNzY2ODE5MzEwLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.m4ZadxMdDZqBuMv6FTyO1C5fpX8hMUQBIztMotQ3XDo', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNVDlFQlMzVEg2TkU1RDNONldENU5DIiwidGltZSI6IjE3NjE2MzUzMTAiLCJyYW5kb21uZXNzIjoiYjgwZmIzYmEtZGZmNy00ZmQwIiwiZXhwIjoxNzY2ODE5MzEwLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.m4ZadxMdDZqBuMv6FTyO1C5fpX8hMUQBIztMotQ3XDo', 'user_01K8MT9EBS3TH6NE5D3N6WD5NC%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNVDlFQlMzVEg2TkU1RDNONldENU5DIiwidGltZSI6IjE3NjE2MzUzMTAiLCJyYW5kb21uZXNzIjoiYjgwZmIzYmEtZGZmNy00ZmQwIiwiZXhwIjoxNzY2ODE5MzEwLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.m4ZadxMdDZqBuMv6FTyO1C5fpX8hMUQBIztMotQ3XDo', 'Auth0', 0, 0, 0.00, NULL, '2025-10-28 15:11:24', '2025-10-28 23:18:03', NULL, '[2025-10-28 22:10:40] 通过导入创建新账号', NULL, NULL, '2025-10-28 22:11:19');
INSERT INTO `cursor_account` VALUES (123, 'free_trial', 'kayaks-pelt-98@icloud.com', 7, 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNVEpFUDdIQVhCRjBTTTVZMjdINEdYIiwidGltZSI6IjE3NjE2MzU2MDYiLCJyYW5kb21uZXNzIjoiYTBiNTdjNjEtNDc1Ny00NmExIiwiZXhwIjoxNzY2ODE5NjA2LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.PdaWPkebDGPMSKaAp-I1vUlLO041c4nL0GVAceDil-M', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNVEpFUDdIQVhCRjBTTTVZMjdINEdYIiwidGltZSI6IjE3NjE2MzU2MDYiLCJyYW5kb21uZXNzIjoiYTBiNTdjNjEtNDc1Ny00NmExIiwiZXhwIjoxNzY2ODE5NjA2LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.PdaWPkebDGPMSKaAp-I1vUlLO041c4nL0GVAceDil-M', 'user_01K8MTJEP7HAXBF0SM5Y27H4GX%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzhNVEpFUDdIQVhCRjBTTTVZMjdINEdYIiwidGltZSI6IjE3NjE2MzU2MDYiLCJyYW5kb21uZXNzIjoiYTBiNTdjNjEtNDc1Ny00NmExIiwiZXhwIjoxNzY2ODE5NjA2LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.PdaWPkebDGPMSKaAp-I1vUlLO041c4nL0GVAceDil-M', 'Auth0', 0, 0, 0.00, NULL, '2025-10-28 15:14:30', '2025-10-28 23:18:03', NULL, '[2025-10-28 22:10:40] 通过导入创建新账号', NULL, NULL, '2025-10-28 22:11:20');

-- ----------------------------
-- Table structure for device_binding
-- ----------------------------
DROP TABLE IF EXISTS `device_binding`;
CREATE TABLE `device_binding`  (
  `id` bigint(0) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `license_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '授权码',
  `mac_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'MAC地址',
  `device_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备名称',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  `first_bind_time` datetime(0) NOT NULL COMMENT '首次绑定时间',
  `last_active_time` datetime(0) NULL DEFAULT NULL COMMENT '最后活跃时间',
  `switch_count_today` int(0) NOT NULL DEFAULT 0 COMMENT '今日换号次数',
  `last_switch_date` date NULL DEFAULT NULL COMMENT '上次换号日期',
  `total_switch_count` int(0) NOT NULL DEFAULT 0 COMMENT '总换号次数',
  `created_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_license_mac`(`license_code`, `mac_address`) USING BTREE,
  INDEX `idx_license_code`(`license_code`) USING BTREE,
  INDEX `idx_mac_address`(`mac_address`) USING BTREE,
  INDEX `idx_is_active`(`is_active`) USING BTREE,
  INDEX `idx_last_active_time`(`last_active_time`) USING BTREE,
  INDEX `idx_last_switch_date`(`last_switch_date`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '设备绑定表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of device_binding
-- ----------------------------
INSERT INTO `device_binding` VALUES (1, 'VALID_CODE_123', '00:11:22:33:44:55', 'Unknown Device', 1, '2025-09-18 10:16:08', '2025-09-18 17:56:44', 0, NULL, 0, '2025-09-18 10:16:08', '2025-09-18 17:56:44');
INSERT INTO `device_binding` VALUES (2, 'TEST_CODE_456', 'test-mac-address', 'Unknown Device', 1, '2025-09-18 11:19:48', '2025-09-18 11:19:48', 0, NULL, 0, '2025-09-18 11:19:48', '2025-09-18 11:19:48');
INSERT INTO `device_binding` VALUES (3, 'VIP_CODE_2024', 'test-mac-address', 'Unknown Device', 1, '2025-09-18 11:19:59', '2025-09-19 10:15:24', 0, NULL, 0, '2025-09-18 11:19:59', '2025-09-19 10:15:24');
INSERT INTO `device_binding` VALUES (4, 'VIP_CODE_2024', '28:df:eb:51:01:2b', 'Unknown Device', 1, '2025-09-19 10:26:03', '2025-09-21 15:05:15', 0, NULL, 0, '2025-09-19 10:26:03', '2025-09-21 15:05:15');
INSERT INTO `device_binding` VALUES (5, 'UHHUHQBNMCT0W71N', '28:df:eb:51:01:2b', 'Unknown Device', 1, '2025-09-21 15:04:48', '2025-09-21 15:15:33', 0, NULL, 0, '2025-09-21 15:04:48', '2025-09-21 15:15:33');
INSERT INTO `device_binding` VALUES (6, '7MDPKQLXCU6K002C', '28:df:eb:51:01:2b', 'Unknown Device', 1, '2025-09-21 15:08:02', '2025-09-21 15:08:02', 0, NULL, 0, '2025-09-21 15:08:02', '2025-09-21 15:08:02');
INSERT INTO `device_binding` VALUES (7, 'O0ADCXOYZ76V98GM', '28:df:eb:51:01:2b', 'Unknown Device', 1, '2025-09-21 15:15:40', '2025-09-21 15:15:40', 0, NULL, 0, '2025-09-21 15:15:40', '2025-09-21 15:15:40');
INSERT INTO `device_binding` VALUES (8, 'Y2FMK2KGTPQONWOU', 'd8:43:ae:20:18:42', 'Unknown Device', 1, '2025-10-25 12:10:45', '2025-10-28 21:57:06', 0, NULL, 0, '2025-10-25 12:10:45', '2025-10-28 21:57:06');
INSERT INTO `device_binding` VALUES (9, 'H41DF95ODXLIOLZP', 'd8:43:ae:20:18:42', 'Unknown Device', 1, '2025-10-28 22:09:23', '2025-10-28 23:16:29', 0, NULL, 0, '2025-10-28 22:09:23', '2025-10-28 23:16:29');

-- ----------------------------
-- Table structure for license
-- ----------------------------
DROP TABLE IF EXISTS `license`;
CREATE TABLE `license`  (
  `id` bigint(0) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `license_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '授权码',
  `bound_mac_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '绑定的MAC地址',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  `expiry_time` datetime(0) NULL DEFAULT NULL COMMENT '过期时间（首次绑定时设置）',
  `total_days` int(0) NOT NULL COMMENT '总天数',
  `membership_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'free_trial' COMMENT '会员类型',
  `first_bind_time` datetime(0) NULL DEFAULT NULL COMMENT '首次绑定时间',
  `created_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_license_code`(`license_code`) USING BTREE,
  INDEX `idx_bound_mac_address`(`bound_mac_address`) USING BTREE,
  INDEX `idx_is_active_expiry_time`(`is_active`, `expiry_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 54 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '授权码表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of license
-- ----------------------------
INSERT INTO `license` VALUES (1, 'VALID_CODE_123', NULL, 1, '2025-09-26 23:59:59', 7, 'free_trial', NULL, '2025-09-17 08:56:31', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (2, 'TEST_CODE_456', NULL, 1, '2025-09-21 23:59:59', 2, 'free_trial', NULL, '2025-09-17 08:56:31', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (3, 'EXPIRED_CODE_789', NULL, 1, '2024-01-01 00:00:00', 30, 'free_trial', NULL, '2025-09-17 08:56:31', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (4, 'VIP_CODE_2024', '28:df:eb:51:01:2b', 1, '2025-09-26 23:59:59', 30, 'free_trial', '2025-09-17 08:56:31', '2025-09-17 08:56:31', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (5, 'DEMO_CODE_FREE', NULL, 1, '2025-09-30 23:59:59', 7, 'free_trial', NULL, '2025-09-17 08:56:31', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (6, 'WKRDPX52Q2ZX50TW', NULL, 1, '2025-10-21 15:02:53', 30, 'free_trial', NULL, '2025-09-21 15:02:53', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (7, '8UMBTL2SZP0WVGGK', NULL, 1, '2025-10-21 15:02:56', 30, 'free_trial', NULL, '2025-09-21 15:02:56', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (8, '7WXIX8EFUK56IRBF', NULL, 1, '2025-09-28 15:02:59', 7, 'free_trial', NULL, '2025-09-21 15:02:59', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (9, '4CEYW7K9DODHVQ1B', NULL, 1, NULL, 365, 'free_trial', NULL, '2025-09-21 15:03:02', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (10, 'UHHUHQBNMCT0W71N', '28:df:eb:51:01:2b', 1, '2025-09-22 15:03:58', 1, 'free_trial', '2025-09-21 15:03:58', '2025-09-21 15:03:58', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (11, '7MDPKQLXCU6K002C', '28:df:eb:51:01:2b', 1, '2025-09-22 15:07:58', 1, 'free_trial', '2025-09-21 15:07:58', '2025-09-21 15:07:58', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (12, 'O0ADCXOYZ76V98GM', '28:df:eb:51:01:2b', 1, '2025-09-22 15:15:37', 1, 'free_trial', '2025-09-21 15:15:37', '2025-09-21 15:15:37', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (13, 'Y2FMK2KGTPQONWOU', 'd8:43:ae:20:18:42', 1, '2025-11-24 12:10:37', 30, 'free_trial', '2025-10-25 12:10:37', '2025-10-25 12:10:37', '2025-10-28 21:44:10');
INSERT INTO `license` VALUES (14, 'H41DF95ODXLIOLZP', 'd8:43:ae:20:18:42', 1, '2025-10-29 22:09:23', 1, 'free_trial', '2025-10-28 22:09:23', '2025-10-27 23:00:25', '2025-10-28 22:09:23');
INSERT INTO `license` VALUES (15, 'HWYA7196MCH2UFPL', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:22', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (16, '30K92MPECDBPUIMQ', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:23', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (17, 'WZJE4CW7RCKKRV8H', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:23', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (18, 'YZ3FLPGQRJFGD9XG', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:23', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (19, '2IP278QHECLOBUDF', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:24', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (20, 'GNZVT1VR91CNF4SD', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:24', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (21, 'EUDN47NUSUJSPS47', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:24', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (22, 'YPD1ZUTN1MBCI1RX', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:24', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (23, 'JPOUPTCYE49KS3KE', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:24', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (24, 'VV923WJZ4TBL8918', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:24', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (25, 'OLGRQS83504XB2WU', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:25', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (26, 'OJV62KA5BFIIMNCW', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:25', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (27, 'AKV8ZBKIXXXGCGHF', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:25', '2025-10-28 22:09:05');
INSERT INTO `license` VALUES (28, 'OP8IQSNMN4R750N4', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:26', '2025-10-28 21:44:11');
INSERT INTO `license` VALUES (29, 'CS0PFRF223D70B62', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:26', '2025-10-28 21:44:11');
INSERT INTO `license` VALUES (30, 'HPHKFQFE05HOIJJ6', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:26', '2025-10-28 21:44:11');
INSERT INTO `license` VALUES (31, 'YSFPMJCAZ13LSRW4', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:27', '2025-10-28 21:44:11');
INSERT INTO `license` VALUES (32, '02YEYN88CIG4QOY4', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:27', '2025-10-28 21:44:11');
INSERT INTO `license` VALUES (33, '2QPDTRKSYWGBTIT1', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:27', '2025-10-28 21:44:11');
INSERT INTO `license` VALUES (34, 'WISVO651Q2IQXP1X', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:27', '2025-10-28 21:44:11');
INSERT INTO `license` VALUES (35, 'PVB9QWMLE0W14IQ7', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:27', '2025-10-28 21:44:11');
INSERT INTO `license` VALUES (36, 'ZO3G9Q02Z3CAW06Y', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:27', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (37, 'ULW0I4YNN82QAEMN', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:28', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (38, 'KACBTAFWNH7XV4FS', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:28', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (39, 'LH1AKVCY9VZSYC0B', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:28', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (40, '2SBLITBB2XE15SJB', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:28', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (41, 'CZJRCV3IMEKGZMUE', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:28', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (42, '058HNREXDR9ID52V', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:28', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (43, '6MKF9IRXE9K0PGWU', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:29', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (44, 'H247KMA76XM1G1K0', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:29', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (45, '3HLBO98XC7P3UW8Q', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:29', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (46, 'MN4XH2UTX198TG5T', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:29', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (47, 'AFV2OQYAWOM692GM', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:29', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (48, '2QGPG3SKOM0Q0Z55', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:29', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (49, 'AEHVGCCCNRQL0FP0', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:30', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (50, 'MB5DY8XDI8DPAOPY', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:30', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (51, '4SOE74HFO2HEHVKY', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:30', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (52, '0LD878O6HPF6H3M1', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:30', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (53, 'NLBLAD12YV3GH4LP', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:30', '2025-10-28 21:44:37');
INSERT INTO `license` VALUES (54, '6PASZXSOS0VPWIML', NULL, 1, NULL, 1, 'free_trial', NULL, '2025-10-28 21:43:30', '2025-10-28 21:44:37');

-- ----------------------------
-- Table structure for order_coupons
-- ----------------------------
DROP TABLE IF EXISTS `order_coupons`;
CREATE TABLE `order_coupons`  (
  `id` bigint(0) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `order_id` bigint(0) NOT NULL COMMENT '订单ID',
  `coupon_id` bigint(0) NOT NULL COMMENT '优惠券ID',
  `coupon_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '优惠券代码',
  `discount_amount` decimal(10, 2) NOT NULL COMMENT '实际优惠金额',
  `created_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '使用时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id`) USING BTREE,
  INDEX `idx_coupon_id`(`coupon_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单优惠券使用记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_coupons
-- ----------------------------

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` bigint(0) NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号',
  `product_id` bigint(0) NOT NULL COMMENT '商品ID',
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品名称（冗余字段）',
  `duration_days` int(0) NOT NULL COMMENT '授权天数（冗余字段）',
  `price` decimal(10, 2) NOT NULL COMMENT '实际支付价格',
  `original_price` decimal(10, 2) NOT NULL COMMENT '商品原价',
  `discount_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '优惠金额',
  `customer_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户邮箱',
  `customer_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户手机号',
  `customer_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户姓名',
  `device_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备标识（MAC地址等）',
  `license_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '生成的授权码',
  `license_generated_time` datetime(0) NULL DEFAULT NULL COMMENT '授权码生成时间',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '订单状态：pending待支付,paid已支付,completed已完成,cancelled已取消,refunded已退款',
  `payment_method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付方式：alipay,wechat,bank_card',
  `payment_transaction_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付流水号',
  `payment_time` datetime(0) NULL DEFAULT NULL COMMENT '支付时间',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '订单备注',
  `created_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_order_no`(`order_no`) USING BTREE,
  INDEX `idx_product_id`(`product_id`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE,
  INDEX `idx_customer_email`(`customer_email`) USING BTREE,
  INDEX `idx_license_code`(`license_code`) USING BTREE,
  INDEX `idx_payment_time`(`payment_time`) USING BTREE,
  INDEX `idx_created_time`(`created_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (1, 'CUR17615772251190105', 1, 'Cursor Pro 7天体验版', 7, 9.90, 9.90, 0.00, '522660570@qq.com', NULL, NULL, NULL, 'H41DF95ODXLIOLZP', '2025-10-27 23:00:25', 'completed', 'alipay', 'MOCK_1761577225151', '2025-10-27 23:00:25', NULL, '2025-10-27 23:00:25', '2025-10-27 23:00:25');

-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments`  (
  `id` bigint(0) NOT NULL AUTO_INCREMENT COMMENT '支付记录ID',
  `order_id` bigint(0) NOT NULL COMMENT '订单ID',
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号',
  `payment_method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付方式',
  `payment_channel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付渠道（具体的支付接口）',
  `amount` decimal(10, 2) NOT NULL COMMENT '支付金额',
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'CNY' COMMENT '货币类型',
  `transaction_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '第三方支付流水号',
  `platform_order_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '支付平台订单号',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '支付状态：pending待支付,success成功,failed失败,cancelled取消',
  `callback_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '支付回调数据（JSON格式）',
  `callback_time` datetime(0) NULL DEFAULT NULL COMMENT '回调时间',
  `failure_reason` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '失败原因',
  `created_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id`) USING BTREE,
  INDEX `idx_order_no`(`order_no`) USING BTREE,
  INDEX `idx_transaction_id`(`transaction_id`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE,
  INDEX `idx_created_time`(`created_time`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '支付记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of payments
-- ----------------------------

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products`  (
  `id` bigint(0) NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '商品描述',
  `duration_days` int(0) NOT NULL COMMENT '授权天数',
  `price` decimal(10, 2) NOT NULL COMMENT '价格（元）',
  `original_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '原价（用于显示折扣）',
  `discount_rate` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '折扣率（0-1）',
  `stock_quantity` int(0) NULL DEFAULT -1 COMMENT '库存数量（-1表示无限）',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否上架',
  `is_hot` tinyint(1) NULL DEFAULT 0 COMMENT '是否热门商品',
  `sort_order` int(0) NULL DEFAULT 0 COMMENT '排序权重',
  `created_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_is_active`(`is_active`) USING BTREE,
  INDEX `idx_duration_days`(`duration_days`) USING BTREE,
  INDEX `idx_price`(`price`) USING BTREE,
  INDEX `idx_sort_order`(`sort_order`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '商品表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of products
-- ----------------------------
INSERT INTO `products` VALUES (1, 'Cursor Pro 7天体验版', '适合新用户体验，享受7天完整功能', 7, 9.90, 19.90, 0.00, -1, 1, 0, 1, '2025-09-26 02:52:13', '2025-09-26 02:52:13');
INSERT INTO `products` VALUES (2, 'Cursor Pro 30天标准版', '适合个人用户，一个月畅享所有功能', 30, 29.90, 59.90, 0.00, -1, 1, 1, 2, '2025-09-26 02:52:13', '2025-09-26 02:52:13');
INSERT INTO `products` VALUES (3, 'Cursor Pro 90天季度版', '高性价比选择，三个月长期使用', 90, 79.90, 159.90, 0.00, -1, 1, 1, 3, '2025-09-26 02:52:13', '2025-09-26 02:52:13');
INSERT INTO `products` VALUES (4, 'Cursor Pro 365天年度版', '最优惠选择，全年无忧使用', 365, 199.90, 399.90, 0.00, -1, 1, 1, 4, '2025-09-26 02:52:13', '2025-09-26 02:52:13');
INSERT INTO `products` VALUES (5, 'Cursor Pro 180天半年版', '适合中长期项目开发', 180, 129.90, 219.90, 0.00, -1, 1, 0, 5, '2025-09-26 02:52:13', '2025-09-26 02:52:13');

-- ----------------------------
-- Table structure for system_notice
-- ----------------------------
DROP TABLE IF EXISTS `system_notice`;
CREATE TABLE `system_notice`  (
  `id` bigint(0) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '公告标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '公告内容',
  `notice_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'warning' COMMENT '公告类型：warning, info, success, error',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
  `priority` int(0) NOT NULL DEFAULT 0 COMMENT '优先级，数字越大优先级越高',
  `start_time` datetime(0) NULL DEFAULT NULL COMMENT '生效开始时间',
  `end_time` datetime(0) NULL DEFAULT NULL COMMENT '生效结束时间',
  `created_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_is_active`(`is_active`) USING BTREE,
  INDEX `idx_notice_type`(`notice_type`) USING BTREE,
  INDEX `idx_priority`(`priority`) USING BTREE,
  INDEX `idx_start_time`(`start_time`) USING BTREE,
  INDEX `idx_end_time`(`end_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统公告表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_notice
-- ----------------------------
INSERT INTO `system_notice` VALUES (1, '频繁换号警告', '不要频繁进行换号，一天之内更换过多会导致无效账号，本店会进行封禁！！', 'warning', 0, 100, NULL, NULL, '2025-09-25 09:36:35', '2025-10-28 22:14:17');
INSERT INTO `system_notice` VALUES (2, '使用须知', '如有问题请联系客服qq:522660570', 'info', 1, 50, NULL, NULL, '2025-09-25 09:36:35', '2025-10-28 22:14:30');

SET FOREIGN_KEY_CHECKS = 1;
