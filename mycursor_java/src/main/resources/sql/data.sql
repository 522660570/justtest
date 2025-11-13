-- 使用数据库
USE `mycursor`;

-- 插入测试授权码数据
INSERT INTO `license` (`license_code`, `is_active`, `expiry_time`, `total_days`, `membership_type`) VALUES
('VALID_CODE_123', 1, '2025-10-17 23:59:59', 30, 'Pro'),
('TEST_CODE_456', 1, '2025-12-31 23:59:59', 90, 'Pro'),
('EXPIRED_CODE_789', 0, '2024-01-01 00:00:00', 30, 'Pro'),
('VIP_CODE_2024', 1, '2025-11-30 23:59:59', 60, 'Pro'),
('DEMO_CODE_FREE', 1, '2025-09-30 23:59:59', 7, 'Pro');

-- 插入测试Cursor账号数据
INSERT INTO `cursor_account` (`email`, `access_token`, `refresh_token`, `sign_up_type`, `is_available`, `is_quota_full`) VALUES
('account1@wdds.xyz', 'token_001_20250917', 'refresh_001_20250917', 'email', 1, 0),
('account2@wdds.xyz', 'token_002_20250917', 'refresh_002_20250917', 'email', 1, 0),
('account3@wdds.xyz', 'token_003_20250917', 'refresh_003_20250917', 'email', 1, 0),
('account4@wdds.xyz', 'token_004_20250917', 'refresh_004_20250917', 'email', 1, 0),
('account5@wdds.xyz', 'token_005_20250917', 'refresh_005_20250917', 'email', 1, 0),
('account6@wdds.xyz', 'token_006_20250917', 'refresh_006_20250917', 'email', 1, 0),
('account7@wdds.xyz', 'token_007_20250917', 'refresh_007_20250917', 'email', 1, 0),
('account8@wdds.xyz', 'token_008_20250917', 'refresh_008_20250917', 'email', 1, 0),
('account9@wdds.xyz', 'token_009_20250917', 'refresh_009_20250917', 'email', 1, 0),
('account10@wdds.xyz', 'token_010_20250917', 'refresh_010_20250917', 'email', 1, 0),
('fullquota@wdds.xyz', 'token_full_20250917', 'refresh_full_20250917', 'email', 1, 1),
('disabled@wdds.xyz', 'token_disabled_20250917', 'refresh_disabled_20250917', 'email', 0, 0);

-- 注意：实际部署时应该删除这些测试数据，使用真实的授权码和账号数据
