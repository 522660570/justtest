package com.mycursor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Token 刷新服务
 * 参考 cursor-free-vip-main 项目的 get_user_token.py 实现
 * 
 * 作用：通过调用 refresh API 从 WorkosCursorSessionToken 获取真正的 accessToken
 * 
 * 注意：使用 RestTemplate 以兼容 Java 8
 */
@Slf4j
@Service
public class TokenRefreshService {
    
    @Value("${cursor.token.refresh-server:https://token.cursorpro.com.cn}")
    private String refreshServer;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public TokenRefreshService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * 从 WorkosCursorSessionToken 刷新获取真正的 accessToken
     * 
     * @param sessionToken 完整的 WorkosCursorSessionToken（格式: user_01XXX::jwt 或 user_01XXX%3A%3Ajwt）
     * @return 包含 accessToken 和其他信息的 Map
     */
    public Map<String, Object> refreshAccessToken(String sessionToken) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        
        if (sessionToken == null || sessionToken.trim().isEmpty()) {
            log.warn("SessionToken 为空，无法刷新");
            return result;
        }
        
        try {
            // 确保 token 使用 URL 编码的分隔符 %3A%3A
            String encodedToken = sessionToken;
            if (!sessionToken.contains("%3A%3A") && sessionToken.contains("::")) {
                encodedToken = sessionToken.replace("::", "%3A%3A");
                log.debug("将 :: 转换为 %3A%3A");
            }
            
            // 构建 API URL
            String apiUrl = String.format("%s/reftoken?token=%s", refreshServer, encodedToken);
            log.info("🔄 调用 Token Refresh API: {}...", refreshServer);
            log.debug("完整 URL: {}", apiUrl.substring(0, Math.min(80, apiUrl.length())) + "...");
            
            // 创建 HTTP 请求头
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // 发送 GET 请求
            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            
            log.debug("API 响应状态码: {}", response.getStatusCodeValue());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // 解析响应
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                
                int code = jsonResponse.path("code").asInt(-1);
                String msg = jsonResponse.path("msg").asText("");
                
                log.debug("API 响应: code={}, msg={}", code, msg);
                
                if (code == 0 && "获取成功".equals(msg)) {
                    JsonNode dataNode = jsonResponse.path("data");
                    String accessToken = dataNode.path("accessToken").asText(null);
                    int daysLeft = dataNode.path("days_left").asInt(0);
                    String expireTime = dataNode.path("expire_time").asText("Unknown");
                    
                    if (accessToken != null && !accessToken.isEmpty()) {
                        result.put("success", true);
                        result.put("accessToken", accessToken);
                        result.put("refreshToken", accessToken); // refreshToken 使用相同的值
                        result.put("daysLeft", daysLeft);
                        result.put("expireTime", expireTime);
                        
                        log.info("✅ Token 刷新成功! accessToken 长度: {}, 剩余天数: {}, 过期时间: {}", 
                            accessToken.length(), daysLeft, expireTime);
                        
                        return result;
                    } else {
                        log.warn("⚠️ API 响应中没有 accessToken");
                    }
                } else {
                    log.warn("⚠️ Token 刷新失败: code={}, msg={}", code, msg);
                    result.put("errorMsg", msg);
                }
            } else {
                log.warn("⚠️ Refresh API 返回错误状态码: {}", response.getStatusCodeValue());
                result.put("errorMsg", "HTTP " + response.getStatusCodeValue());
            }
            
        } catch (Exception e) {
            log.error("❌ 调用 Refresh API 失败: {}", e.getMessage());
            result.put("errorMsg", "错误: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 获取 AccessToken（仅通过 refresh API 获取）
     * 
     * @param sessionToken 完整的 WorkosCursorSessionToken
     * @return 包含 accessToken 和 refreshToken 的 Map，如果失败返回空 Map
     */
    public Map<String, String> getAccessToken(String sessionToken) {
        Map<String, String> tokens = new HashMap<>();
        
        if (sessionToken == null || sessionToken.trim().isEmpty()) {
            log.warn("SessionToken 为空");
            return tokens;
        }
        
        // 只使用 refresh API 获取 accessToken
        log.info("🔑 通过 Refresh API 获取 accessToken...");
        Map<String, Object> refreshResult = refreshAccessToken(sessionToken);
        
        if (Boolean.TRUE.equals(refreshResult.get("success"))) {
            String accessToken = (String) refreshResult.get("accessToken");
            String refreshToken = (String) refreshResult.get("refreshToken");
            
            tokens.put("accessToken", accessToken);
            tokens.put("refreshToken", refreshToken);
            tokens.put("daysLeft", String.valueOf(refreshResult.get("daysLeft")));
            tokens.put("expireTime", (String) refreshResult.get("expireTime"));
            
            log.info("✅ 通过 Refresh API 成功获取 accessToken");
            return tokens;
        }
        
        // Refresh API 失败，直接返回空 Map
        log.error("❌ Refresh API 失败，无法获取 accessToken");
        return tokens;
    }
}

