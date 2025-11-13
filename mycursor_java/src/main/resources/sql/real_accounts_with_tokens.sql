-- 真实Cursor账户数据导入脚本（包含SessionToken）
-- 使用数据库
USE `mycursor`;

-- 先执行数据库迁移，添加新字段（安全添加，如果字段已存在则跳过）
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mycursor' AND TABLE_NAME = 'cursor_account' AND COLUMN_NAME = 'session_token') = 0,
    'ALTER TABLE `cursor_account` ADD COLUMN `session_token` TEXT NULL COMMENT ''WorkosCursorSessionToken，用于检测使用情况'' AFTER `refresh_token`',
    'SELECT ''Column session_token already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mycursor' AND TABLE_NAME = 'cursor_account' AND COLUMN_NAME = 'actual_usage_amount') = 0,
    'ALTER TABLE `cursor_account` ADD COLUMN `actual_usage_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT ''实际使用金额（美元）'' AFTER `is_quota_full`',
    'SELECT ''Column actual_usage_amount already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 清空测试数据，插入真实账户数据
DELETE FROM `cursor_account` WHERE email LIKE '%@wdds.xyz';

-- 插入6个真实Cursor账户（包含SessionToken）
INSERT INTO `cursor_account` (`email`, `access_token`, `refresh_token`, `session_token`, `sign_up_type`, `is_available`, `is_quota_full`, `last_used_time`, `notes`) VALUES

-- 账户1: quqnkn5cclkv@wdds.xyz (free, 额度未满 1/100)
(
    'quqnkn5cclkv@wdds.xyz',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzRQUDQ1Vlg0SlJBOFNDQlBOVko3RFRaIiwidGltZSI6IjE3NTc0MDMxNzgiLCJyYW5kb21uZXNzIjoiOGIzNThjODQtMDY4OS00NmNiIiwiZXhwIjoxNzYyNTg3MTc4LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.f98OJAaAQNmb5J5uLRlBS5KU0Kf997btOoHWEepyPZo',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzRQUDQ1Vlg0SlJBOFNDQlBOVko3RFRaIiwidGltZSI6IjE3NTc0MDMxNzgiLCJyYW5kb21uZXNzIjoiOGIzNThjODQtMDY4OS00NmNiIiwiZXhwIjoxNzYyNTg3MTc4LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.f98OJAaAQNmb5J5uLRlBS5KU0Kf997btOoHWEepyPZo',
    'user_01K4PP45VX4JRA8SCBPNVJ7DTZ%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzRQUDQ1Vlg0SlJBOFNDQlBOVko3RFRaIiwidGltZSI6IjE3NTc0MDMxNzQiLCJyYW5kb21uZXNzIjoiYmI5M2ZjMzAtODQ4ZS00OTFhIiwiZXhwIjoxNzYyNTg3MTc0LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.cqM_JrqROY-1xzk2wNT1TN9n07myp0HGp5MatECkNgw',
    'Auth_0',
    1,
    0,
    NULL,
    'free账户, 使用量:1/100, token无效'
),

-- 账户2: gcunft49ipc5@wdds.xyz (free_trial, 额度已满 100/100)
(
    'gcunft49ipc5@wdds.xyz',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzRTQ1k1MFkwTUM2UjQ0SjQ3QzBLNDFFIiwidGltZSI6IjE3NTc0OTQyNDEiLCJyYW5kb21uZXNzIjoiOWU5Yzk0YzUtM2Q0Ni00YjZjIiwiZXhwIjoxNzYyNjc4MjQxLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.TuMVCN1kDhTeD8snt7QbzTqATV2rYQuSfeH9m0pjuSo',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzRTQ1k1MFkwTUM2UjQ0SjQ3QzBLNDFFIiwidGltZSI6IjE3NTc0OTQyNDEiLCJyYW5kb21uZXNzIjoiOWU5Yzk0YzUtM2Q0Ni00YjZjIiwiZXhwIjoxNzYyNjc4MjQxLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.TuMVCN1kDhTeD8snt7QbzTqATV2rYQuSfeH9m0pjuSo',
    'user_01K4SCY50Y0MC6R44J47C0K41E%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzRTQ1k1MFkwTUM2UjQ0SjQ3QzBLNDFFIiwidGltZSI6IjE3NTc0OTQyMzciLCJyYW5kb21uZXNzIjoiNWYwYjYxNzEtNDU3Ny00NThkIiwiZXhwIjoxNzYyNjc4MjM3LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.llvrzLJaFAdpt3iNBQ0WVxgYR03f2st8IM_aruVg1F4',
    'Auth_0',
    1,
    1,
    '2025-09-10 16:50:40',
    'free_trial账户, 使用量:100/100, 剩余8天试用, token有效'
),

-- 账户3: mpbebiquaecp@wdds.xyz (free_trial, 额度已满 100/100)
(
    'mpbebiquaecp@wdds.xyz',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU1RlFFUjY4VlRWNVc5QktHN1pHQzVRIiwidGltZSI6IjE3NTc4OTk2NTAiLCJyYW5kb21uZXNzIjoiY2FhNDJmZjMtMzMzYy00ZjcyIiwiZXhwIjoxNzYzMDgzNjUwLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.WkjqOwA9iLrwJ576UEolqn8d22KK3nB5sbjAxsvqagE',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU1RlFFUjY4VlRWNVc5QktHN1pHQzVRIiwidGltZSI6IjE3NTc4OTk2NTAiLCJyYW5kb21uZXNzIjoiY2FhNDJmZjMtMzMzYy00ZjcyIiwiZXhwIjoxNzYzMDgzNjUwLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.WkjqOwA9iLrwJ576UEolqn8d22KK3nB5sbjAxsvqagE',
    'user_01K55FQER68VTV5W9BKG7ZGC5Q%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU1RlFFUjY4VlRWNVc5QktHN1pHQzVRIiwidGltZSI6IjE3NTc4OTk2NDgiLCJyYW5kb21uZXNzIjoiZmI0YzBlNGYtYjY0OS00Y2NkIiwiZXhwIjoxNzYzMDgzNjQ4LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.X4dc7voGMrsjyWdXW1lr5ppMHdqyGknwAPnyVl4HoIc',
    'Auth_0',
    1,
    1,
    '2025-09-15 09:27:29',
    'free_trial账户, 使用量:100/100, 剩余12天试用, token有效'
),

-- 账户4: extfieiix663@wdds.xyz (free_trial, 额度已满 100/100)
(
    'extfieiix663@wdds.xyz',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU2MDhXM0VQTkRESDhQUDc0UlM4TlA5IiwidGltZSI6IjE3NTc5MTY5OTQiLCJyYW5kb21uZXNzIjoiMGEwYmQyNGMtNjFhZi00YzJiIiwiZXhwIjoxNzYzMTAwOTk0LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.38Xb0_nvOFYSETNf0HMs90vbrXpxdAYvJKGeVdRKHvA',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU2MDhXM0VQTkRESDhQUDc0UlM4TlA5IiwidGltZSI6IjE3NTc5MTY5OTQiLCJyYW5kb21uZXNzIjoiMGEwYmQyNGMtNjFhZi00YzJiIiwiZXhwIjoxNzYzMTAwOTk0LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.38Xb0_nvOFYSETNf0HMs90vbrXpxdAYvJKGeVdRKHvA',
    'user_01K5608W3EPNDDH8PP74RS8NP9%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU2MDhXM0VQTkRESDhQUDc0UlM4TlA5IiwidGltZSI6IjE3NTc5MTY5OTIiLCJyYW5kb21uZXNzIjoiYTM2M2Y1ZTItMWJhNS00NjcwIiwiZXhwIjoxNzYzMTAwOTkyLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.ERgEM4vOQVmMFL_K9NjMu-08R6l6h95BG4BjX7O3doE',
    'Auth_0',
    1,
    1,
    '2025-09-15 14:16:33',
    'free_trial账户, 使用量:100/100, 剩余12天试用, token有效'
),

-- 账户5: jnpkrdy4iz4i@wdds.xyz (free_trial, 额度未满 43/100) ★ 推荐优先使用
(
    'jnpkrdy4iz4i@wdds.xyz',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU4UUpTOFhRRjMzQjJWSlo4RlhKR0haIiwidGltZSI6IjE3NTgwMDg1NDUiLCJyYW5kb21uZXNzIjoiNmJlYzI4ZDItZTM1ZC00NWM1IiwiZXhwIjoxNzYzMTkyNTQ1LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.V9dlt2nGkmKlYKhapcoogPV7FhvRFTujCBB1Jn7eEHY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU4UUpTOFhRRjMzQjJWSlo4RlhKR0haIiwidGltZSI6IjE3NTgwMDg1NDUiLCJyYW5kb21uZXNzIjoiNmJlYzI4ZDItZTM1ZC00NWM1IiwiZXhwIjoxNzYzMTkyNTQ1LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.V9dlt2nGkmKlYKhapcoogPV7FhvRFTujCBB1Jn7eEHY',
    'user_01K58QJS8XQF33B2VJZ8FXJGHZ%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU4UUpTOFhRRjMzQjJWSlo4RlhKR0haIiwidGltZSI6IjE3NTgwMDg1NDMiLCJyYW5kb21uZXNzIjoiYTI3ZDVmNTMtZTY3My00MDA2IiwiZXhwIjoxNzYzMTkyNTQzLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.Y-wN5e6H3If2n80HcecNR7WWXsBnptbADXFpSTSuKGI',
    'Auth_0',
    1,
    0,
    '2025-09-16 15:42:25',
    'free_trial账户, 使用量:43/100, 剩余13天试用, token有效 ★ 优先使用'
),

-- 账户6: eukmwd4g0too@wdds.xyz (free_trial, 全新账户 0/100) ★ 推荐优先使用
(
    'eukmwd4g0too@wdds.xyz',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU4UVBSNUpFVllNNVZGUTZNTlBSQVMwIiwidGltZSI6IjE3NTgwMDg2NzYiLCJyYW5kb21uZXNzIjoiZjA1ZWIzYTctZmI3MS00MTZlIiwiZXhwIjoxNzYzMTkyNjc2LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.uivac0uJTLGwiyifwBEGAjvSVmbWvWMfJuaCsPFfpxo',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU4UVBSNUpFVllNNVZGUTZNTlBSQVMwIiwidGltZSI6IjE3NTgwMDg2NzYiLCJyYW5kb21uZXNzIjoiZjA1ZWIzYTctZmI3MS00MTZlIiwiZXhwIjoxNzYzMTkyNjc2LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoic2Vzc2lvbiJ9.uivac0uJTLGwiyifwBEGAjvSVmbWvWMfJuaCsPFfpxo',
    'user_01K58QPR5JEVYM5VFQ6MNPRAS0%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxSzU4UVBSNUpFVllNNVZGUTZNTlBSQVMwIiwidGltZSI6IjE3NTgwMDg2NzMiLCJyYW5kb21uZXNzIjoiNzI5YTg1MjItYjY4OC00MzhlIiwiZXhwIjoxNzYzMTkyNjczLCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIn0.3H2eddmvljcp45Y1yfhRKRzXTZEWLYYFbfn8cKBmtlk',
    'Auth_0',
    1,
    0,
    '2025-09-16 15:44:36',
    'free_trial账户, 使用量:0/100, 剩余13天试用, token有效 ★ 最优先使用'
);

-- 查看插入结果
SELECT 
    email,
    SUBSTRING(session_token, 1, 50) as 'session_token_preview',
    sign_up_type,
    is_available,
    is_quota_full,
    actual_usage_amount,
    last_used_time,
    notes,
    created_time
FROM cursor_account 
WHERE email LIKE '%@wdds.xyz'
ORDER BY is_quota_full ASC, last_used_time ASC;
