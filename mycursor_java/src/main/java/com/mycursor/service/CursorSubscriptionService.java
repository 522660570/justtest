package com.mycursor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

/**
 * Cursor 订阅状态服务
 * 通过 Cursor Stripe API 获取账号的订阅状态
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/10/26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CursorSubscriptionService {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    // Cursor Stripe API 端点
    private static final String CURSOR_STRIPE_API = "https://cursor.com/api/auth/stripe";
    
    /**
     * 通过 SessionToken 获取账号的订阅状态
     * 
     * @param sessionToken WorkosCursorSessionToken
     * @return 订阅状态信息
     * @throws RuntimeException 如果请求失败
     */
    public Map<String, Object> getSubscriptionStatus(String sessionToken) {
        log.info("开始获取账号订阅状态...");
        
        if (sessionToken == null || sessionToken.trim().isEmpty()) {
            throw new RuntimeException("SessionToken 不能为空");
        }
        
        try {
            // 构建请求头
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8");
            headers.set("Origin", "https://cursor.com");
            headers.set("Referer", "https://cursor.com/settings");
            
            // 设置 Cookie，包含 SessionToken
            headers.set("Cookie", "WorkosCursorSessionToken=" + sessionToken);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            log.debug("请求 Cursor Stripe API: {}", CURSOR_STRIPE_API);
            log.debug("Cookie: WorkosCursorSessionToken={}...", sessionToken.substring(0, Math.min(50, sessionToken.length())));
            
            // 发送 GET 请求
            ResponseEntity<String> response = restTemplate.exchange(
                CURSOR_STRIPE_API,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Cursor API 返回错误状态码: " + response.getStatusCode());
            }
            
            String responseBody = response.getBody();
            if (responseBody == null || responseBody.trim().isEmpty()) {
                throw new RuntimeException("Cursor API 返回空响应");
            }
            
            log.debug("API 响应: {}", responseBody);
            
            // 解析响应
            JsonNode jsonNode = objectMapper.readTree(responseBody);
            
            // 提取订阅信息
            Map<String, Object> subscriptionInfo = new HashMap<>();
            subscriptionInfo.put("membershipType", jsonNode.path("membershipType").asText("unknown"));
            subscriptionInfo.put("individualMembershipType", jsonNode.path("individualMembershipType").asText("unknown"));
            subscriptionInfo.put("teamMembershipType", jsonNode.path("teamMembershipType").asText(null));
            subscriptionInfo.put("verifiedStudent", jsonNode.path("verifiedStudent").asBoolean(false));
            subscriptionInfo.put("trialEligible", jsonNode.path("trialEligible").asBoolean(false));
            subscriptionInfo.put("trialLengthDays", jsonNode.path("trialLengthDays").asInt(0));
            subscriptionInfo.put("isOnStudentPlan", jsonNode.path("isOnStudentPlan").asBoolean(false));
            subscriptionInfo.put("isOnBillableAuto", jsonNode.path("isOnBillableAuto").asBoolean(false));
            subscriptionInfo.put("trialWasCancelled", jsonNode.path("trialWasCancelled").asBoolean(false));
            subscriptionInfo.put("isTeamMember", jsonNode.path("isTeamMember").asBoolean(false));
            
            // daysRemainingOnTrial 字段可能不存在，需要先检查
            if (jsonNode.has("daysRemainingOnTrial") && !jsonNode.path("daysRemainingOnTrial").isNull()) {
                subscriptionInfo.put("daysRemainingOnTrial", jsonNode.path("daysRemainingOnTrial").asInt());
            } else {
                subscriptionInfo.put("daysRemainingOnTrial", null);
            }
            
            String membershipType = (String) subscriptionInfo.get("membershipType");
            log.info("✅ 成功获取订阅状态: {}", membershipType);
            
            return subscriptionInfo;
            
        } catch (Exception e) {
            log.error("❌ 获取订阅状态失败: {}", e.getMessage());
            
            // 检查是否是认证相关错误
            if (e.getMessage().contains("403") || e.getMessage().contains("401") || e.getMessage().contains("Forbidden")) {
                throw new RuntimeException("SessionToken 无效或已过期");
            }
            
            throw new RuntimeException("获取订阅状态失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 批量检查订阅状态（带重试机制）
     * 
     * @param sessionToken SessionToken
     * @param maxRetries 最大重试次数
     * @return 订阅状态信息
     */
    public Map<String, Object> getSubscriptionStatusWithRetry(String sessionToken, int maxRetries) {
        int attempts = 0;
        Exception lastException = null;
        
        while (attempts < maxRetries) {
            attempts++;
            try {
                log.info("第 {} 次尝试获取订阅状态", attempts);
                return getSubscriptionStatus(sessionToken);
            } catch (Exception e) {
                lastException = e;
                log.warn("第 {} 次尝试失败: {}", attempts, e.getMessage());
                
                if (attempts < maxRetries) {
                    // 等待一段时间后重试（指数退避）
                    long waitTime = (long) Math.pow(2, attempts) * 1000; // 2s, 4s, 8s...
                    try {
                        log.info("等待 {}ms 后重试...", waitTime);
                        Thread.sleep(waitTime);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("重试被中断", ie);
                    }
                }
            }
        }
        
        throw new RuntimeException("获取订阅状态失败，已重试 " + maxRetries + " 次: " + 
            (lastException != null ? lastException.getMessage() : "未知错误"), lastException);
    }
}

