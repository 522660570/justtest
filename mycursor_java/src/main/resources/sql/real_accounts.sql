-- 真实Cursor账户数据导入脚本
-- 使用数据库
USE `mycursor`;

-- 清空测试数据，插入真实账户数据
DELETE FROM `cursor_account` WHERE email LIKE '%@wdds.xyz';

-- 插入6个真实Cursor账户
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
    'Auth_0',
    1,
    0,
    '2025-09-16 15:44:36',
    'free_trial账户, 使用量:0/100, 剩余13天试用, token有效 ★ 最优先使用'
);

-- 查看插入结果
SELECT 
    email,
    sign_up_type,
    is_available,
    is_quota_full,
    last_used_time,
    notes,
    created_time
FROM cursor_account 
WHERE email LIKE '%@wdds.xyz'
ORDER BY is_quota_full ASC, last_used_time ASC;
