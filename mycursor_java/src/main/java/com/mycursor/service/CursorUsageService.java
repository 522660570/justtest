package com.mycursor.service;

import com.alibaba.fastjson2.JSONObject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.client.ClientHttpResponse;
import com.mycursor.entity.CursorAccount;
import com.mycursor.mapper.CursorAccountMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.GZIPInputStream;
import java.util.zip.InflaterInputStream;

/**
 * Cursor账号使用情况检测服务
 * 通过官方API检测账号实际使用额度
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/18 17:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CursorUsageService {
    
    private final CursorAccountMapper cursorAccountMapper;
    
    private static final String CURSOR_USAGE_API = "https://cursor.com/api/dashboard/get-filtered-usage-events";
    private static final BigDecimal MAX_QUOTA = new BigDecimal("10.00"); // 每个账号最大额度10美元
    private static final String NOT_CHARGED_KIND = "NOT_CHARGED"; // 不计费的类型
    
    @Value("${app.cursor.use-real-api:false}")
    private boolean useRealApi;
    
    @Value("${app.cursor.api-timeout:10000}")
    private int apiTimeout;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // 创建一个配置了完整浏览器行为的RestTemplate
    private RestTemplate createBrowserLikeRestTemplate() {
        // 配置HTTP客户端工厂
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(apiTimeout); // 连接超时
        factory.setReadTimeout(apiTimeout); // 读取超时
        factory.setConnectionRequestTimeout(apiTimeout); // 从连接池获取连接的超时
        
        RestTemplate template = new RestTemplate(factory);
        
        // 添加请求拦截器用于日志记录
        template.getInterceptors().add((request, body, execution) -> {
            log.debug("发送请求到: {}", request.getURI());
            log.debug("请求方法: {}", request.getMethod());
            log.debug("请求体大小: {} bytes", body.length);
            
            long startTime = System.currentTimeMillis();
            try {
                ClientHttpResponse response = execution.execute(request, body);
                long duration = System.currentTimeMillis() - startTime;
                log.debug("请求完成，耗时: {}ms, 状态码: {}", duration, response.getStatusCode());
                return response;
            } catch (Exception e) {
                long duration = System.currentTimeMillis() - startTime;
                log.error("请求失败，耗时: {}ms, 错误: {}", duration, e.getMessage());
                throw e;
            }
        });
        
        return template;
    }
    
    /**
     * 检测账号使用情况
     * @param sessionToken 账号的WorkosCursorSessionToken
     * @return 使用情况信息
     */
    public Map<String, Object> checkAccountUsage(String sessionToken) {
        return checkAccountUsage(sessionToken, null);
    }
    
    /**
     * 检测账号使用情况（带数据库更新）
     * @param sessionToken 账号的WorkosCursorSessionToken
     * @param account 账号实体（可选，如果提供则更新数据库）
     * @return 使用情况信息
     */
    @Transactional
    public Map<String, Object> checkAccountUsage(String sessionToken, CursorAccount account) {
        log.info("开始检测账号使用情况，SessionToken: {}...", 
            sessionToken.substring(0, Math.min(50, sessionToken.length())));
        
        try {
            // 使用浏览器模拟的RestTemplate
            RestTemplate restTemplate = createBrowserLikeRestTemplate();
            
            // 构建完全模拟浏览器的请求头
            HttpHeaders headers = buildBrowserLikeHeaders(sessionToken);
            String requestBody = buildRequestBody();
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
            
            log.info("准备发送请求到Cursor API...");
            log.debug("请求体: {}", requestBody);
            
            // 发送请求

            ResponseEntity<String> response = restTemplate.exchange(
                CURSOR_USAGE_API,
                HttpMethod.POST,
                request,
                String.class
            );
            
            log.info("API请求成功，状态码: {}", response.getStatusCode());
             
             if (response.getStatusCode() == HttpStatus.OK) {
                 String responseBody = response.getBody();
                 log.debug("原始响应体长度: {}", responseBody != null ? responseBody.length() : 0);
                 
                 // 检查响应头中的压缩编码
                 String contentEncoding = response.getHeaders().getFirst("Content-Encoding");
                 log.info("响应Content-Encoding: {}", contentEncoding);
                 
                 // 如果响应被压缩，则解压
                 String decompressedBody = decompressResponseIfNeeded(responseBody, contentEncoding);
                 log.debug("处理后响应体长度: {}", decompressedBody.length());
                 log.debug("响应体前200字符: {}", decompressedBody.substring(0, Math.min(200, decompressedBody.length())));
                 
                 Map<String, Object> usageInfo = parseUsageResponse(decompressedBody);
                 
                 // 如果提供了账号实体，更新数据库
                 if (account != null) {
                     updateAccountUsageInDatabase(account, usageInfo);
                 }
                 
                 return usageInfo;
             } else {
                 throw new RuntimeException("API返回非200状态码: " + response.getStatusCode());
             }
            
        } catch (HttpClientErrorException e) {
            log.error("HTTP客户端错误: 状态码={}, 响应体={}", e.getStatusCode(), e.getResponseBodyAsString());
            
            // 如果提供了账号实体，标记为不可用
            if (account != null) {
                markAccountAsUnavailable(account, "HTTP错误: " + e.getStatusCode());
            }
            
            if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new RuntimeException("403 Forbidden: 可能是SessionToken无效或已过期，请检查token是否正确");
            } else if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new RuntimeException("401 Unauthorized: 认证失败，请检查SessionToken");
            } else {
                throw new RuntimeException("API调用失败: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            }
            
        } catch (Exception e) {
            log.error("检测账号使用情况时发生未知错误", e);
            
            // 如果提供了账号实体，标记为不可用
            if (account != null) {
                markAccountAsUnavailable(account, "检测失败: " + e.getMessage());
            }
            
            throw new RuntimeException("检测账号使用情况失败: " + e.getMessage());
        }
    }
    
    /**
     * 标记账号为不可用
     * @param account 账号实体
     * @param reason 标记原因
     */
    private void markAccountAsUnavailable(CursorAccount account, String reason) {
        try {
            account.setIsAvailable(false);
            account.setIsQuotaFull(true); // 标记为额度已满，避免再次分配
            account.setQuotaCheckTime(LocalDateTime.now());
            account.setUpdatedTime(LocalDateTime.now());
            
            // 更新备注信息
            String currentNotes = account.getNotes();
            String newNote = String.format("[%s] 标记为不可用: %s", 
                LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), 
                reason);
            
            if (currentNotes != null && !currentNotes.isEmpty()) {
                account.setNotes(currentNotes + "\n" + newNote);
            } else {
                account.setNotes(newNote);
            }
            
            cursorAccountMapper.updateById(account);
            
            log.warn("账号 {} 已标记为不可用 - 原因: {}", account.getEmail(), reason);
            
        } catch (Exception e) {
            log.error("标记账号 {} 为不可用时发生错误: {}", account.getEmail(), e.getMessage(), e);
        }
    }
    
    /**
     * 更新账号使用情况到数据库
     * @param account 账号实体
     * @param usageInfo 使用情况信息
     */
    private void updateAccountUsageInDatabase(CursorAccount account, Map<String, Object> usageInfo) {
        try {
            // 获取使用情况数据
            BigDecimal totalUsed = (BigDecimal) usageInfo.get("totalUsed");
            boolean isQuotaFull = (Boolean) usageInfo.get("isQuotaFull");
            LocalDateTime checkTime = LocalDateTime.now();
            
            // 更新账号信息
            account.setActualUsageAmount(totalUsed);
            account.setIsQuotaFull(isQuotaFull);
            account.setIsAvailable(!isQuotaFull); // 如果额度满了，则不可用
            account.setQuotaCheckTime(checkTime);
            account.setUpdatedTime(checkTime);
            
            // 保存到数据库
            cursorAccountMapper.updateById(account);
            
            log.info("账号 {} 使用情况已更新到数据库 - 已使用: ${}, 额度已满: {}, 可用状态: {}", 
                account.getEmail(), totalUsed, isQuotaFull, !isQuotaFull);
                
        } catch (Exception e) {
            log.error("更新账号 {} 使用情况到数据库失败: {}", account.getEmail(), e.getMessage(), e);
            // 数据库更新失败不影响API返回结果
        }
    }
    
    /**
     * 构建空使用情况结果（新账号或未使用过的账号）
     */
    private Map<String, Object> buildEmptyUsageResult() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalUsed", BigDecimal.ZERO);
        result.put("maxQuota", MAX_QUOTA);
        result.put("usagePercentage", BigDecimal.ZERO);
        result.put("isQuotaFull", false);
        result.put("chargedEventsCount", 0);
        result.put("totalEventsCount", 0);
        result.put("checkTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("账号使用情况检测完成 - 已使用: $0.00/$10.00, 使用率: 0.00%, 额度已满: false");
        
        return result;
    }
    
    /**
     * 根据Content-Encoding解压响应体
     */
    private String decompressResponseIfNeeded(String responseBody, String contentEncoding) {
        if (responseBody == null || responseBody.isEmpty()) {
            return responseBody;
        }
        
        if (contentEncoding == null) {
            return responseBody;
        }
        
        log.debug("检测到压缩编码: {}", contentEncoding);
        
        try {
            switch (contentEncoding.toLowerCase()) {
                case "br":
                    log.info("响应使用Brotli压缩，尝试解压...");
                    return decompressBrotli(responseBody);
                    
                case "gzip":
                    log.info("响应使用GZIP压缩，尝试解压...");
                    return decompressGzip(responseBody);
                    
                case "deflate":
                    log.info("响应使用Deflate压缩，尝试解压...");
                    return decompressDeflate(responseBody);
                    
                default:
                    log.warn("未知的压缩编码: {}, 尝试原始解析", contentEncoding);
                    return responseBody;
            }
        } catch (Exception e) {
            log.error("解压响应失败: {}", e.getMessage());
            throw new RuntimeException("无法解压响应数据: " + e.getMessage());
        }
    }
    
    /**
     * 解压Brotli压缩的数据
     * 注意：Java标准库不支持Brotli，这里使用Base64解码后的字节流处理
     */
    private String decompressBrotli(String compressedData) throws IOException {
        log.warn("Java标准库不支持Brotli解压，建议使用专门的Brotli库");
        
        // 暂时的解决方案：如果服务器返回的是Brotli压缩
        // 我们需要告诉客户端不要发送br编码请求
        throw new RuntimeException("Brotli压缩暂不支持，请修改请求头去除'br'编码");
    }
    
    /**
     * 解压GZIP数据
     */
    private String decompressGzip(String compressedData) throws IOException {
        byte[] compressedBytes = compressedData.getBytes("ISO-8859-1");
        
        try (GZIPInputStream gzipIn = new GZIPInputStream(new ByteArrayInputStream(compressedBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            byte[] buffer = new byte[1024];
            int len;
            while ((len = gzipIn.read(buffer)) != -1) {
                out.write(buffer, 0, len);
            }
            
            return out.toString("UTF-8");
        }
    }
    
    /**
     * 解压Deflate数据
     */
    private String decompressDeflate(String compressedData) throws IOException {
        byte[] compressedBytes = compressedData.getBytes("ISO-8859-1");
        
        try (InflaterInputStream inflaterIn = new InflaterInputStream(new ByteArrayInputStream(compressedBytes));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            byte[] buffer = new byte[1024];
            int len;
            while ((len = inflaterIn.read(buffer)) != -1) {
                out.write(buffer, 0, len);
            }
            
            return out.toString("UTF-8");
        }
    }
    
    /**
     * 构建完全模拟真实浏览器的请求头
     */
    private HttpHeaders buildBrowserLikeHeaders(String sessionToken) {
        HttpHeaders headers = new HttpHeaders();
        
        // 设置内容类型
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // 完全模拟Chrome浏览器的请求头（移除br和zstd避免压缩问题）
        headers.set("Accept", "*/*");
        headers.set("Accept-Encoding", "gzip, deflate");
        headers.set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6");
        headers.set("Cache-Control", "no-cache");
        headers.set("Origin", "https://cursor.com");
        headers.set("Pragma", "no-cache");
        headers.set("Referer", "https://cursor.com/cn/dashboard?tab=usage");
        
        // Chrome浏览器的安全头
        headers.set("Sec-Ch-Ua", "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"");
        headers.set("Sec-Ch-Ua-Mobile", "?0");
        headers.set("Sec-Ch-Ua-Platform", "\"Windows\"");
        headers.set("Sec-Fetch-Dest", "empty");
        headers.set("Sec-Fetch-Mode", "cors");
        headers.set("Sec-Fetch-Site", "same-origin");
        headers.set("content-type", "application/json");

        // 使用最新的Chrome用户代理字符串
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
        
        // 构建包含其他必要Cookie的完整Cookie字符串
        String cookieValue = buildCompleteCookieString(sessionToken);
        headers.set("Cookie", cookieValue);
        
        // 添加一些额外的浏览器特征头
        headers.set("Connection", "keep-alive");
        headers.set("DNT", "1");
        headers.set("Upgrade-Insecure-Requests", "1");
        
        log.debug("构建的请求头: {}", headers);
        
        return headers;
    }
    
    /**
     * 构建完整的Cookie字符串，包含SessionToken和其他必要的cookies
     */
    private String buildCompleteCookieString(String sessionToken) {
        StringBuilder cookieBuilder = new StringBuilder();
        
        // 添加基础的匿名用户Cookie
        cookieBuilder.append("IndrX2ZuSmZramJSX0NIYUZoRzRzUGZ0cENIVHpHNXk0VE0ya2ZiUkVzQU14X2Fub255bW91c1VzZXJJZCI%3D=")
                    .append("IjUxYjNjYzk1LTIwZDYtNGVhZC05ZmQxLTc0N2U5ZDlhYTU0NiI%3D; ");
        
        // 添加语言设置
        cookieBuilder.append("NEXT_LOCALE=cn; ");
        
        // 添加主要的SessionToken
        cookieBuilder.append("WorkosCursorSessionToken=").append(sessionToken).append("; ");
        
        // 添加一些浏览器会设置的其他Cookie
        cookieBuilder.append("_ga=GA1.1.123456789.").append(System.currentTimeMillis() / 1000).append("; ");
        cookieBuilder.append("_gcl_au=1.1.123456789.").append(System.currentTimeMillis() / 1000);
        
        String cookies = cookieBuilder.toString();
        log.debug("构建的Cookie字符串: {}", cookies);
        
        return cookies;
    }
    
    /**
     * 构建请求体（查询最近30天的使用记录）
     */
    private String buildRequestBody() {
        long now = System.currentTimeMillis();
        long thirtyDaysAgo = now - (30L * 24 * 60 * 60 * 1000); // 30天前
        
        Map<String, Object> requestData = new HashMap<>();
        requestData.put("teamId", 0);
        requestData.put("startDate", String.valueOf(thirtyDaysAgo));
        requestData.put("endDate", String.valueOf(now));
        requestData.put("page", 1);
        requestData.put("pageSize", 100);
        
        try {
            return objectMapper.writeValueAsString(requestData);
        } catch (Exception e) {
            throw new RuntimeException("构建请求体失败", e);
        }
    }
    
    /**
     * 解析API响应，计算使用情况
     */
    private Map<String, Object> parseUsageResponse(String responseBody) {
        try {
            JsonNode rootNode = objectMapper.readTree(responseBody);
            
            // 处理新账号未使用过的情况 - 返回空JSON {}
            if (rootNode.isEmpty()) {
                log.info("检测到新账号未使用过（空响应），返回零使用量");
                return buildEmptyUsageResult();
            }
            
            JsonNode usageEvents = rootNode.get("usageEventsDisplay");
            
            // 处理usageEventsDisplay为null或空数组的情况
            if (usageEvents == null || !usageEvents.isArray() || usageEvents.size() == 0) {
                log.info("检测到账号无使用记录，返回零使用量");
                return buildEmptyUsageResult();
            }
            
            BigDecimal totalUsed = BigDecimal.ZERO;
            int chargedEventsCount = 0;
            int totalEventsCount = usageEvents.size();
            
            // 遍历所有使用记录
            for (JsonNode event : usageEvents) {
                String kind = event.get("kind").asText();
                
                // 只计算有效计费（kind不包含NOT_CHARGED）
                if (!kind.contains(NOT_CHARGED_KIND)) {
                    JsonNode tokenUsage = event.get("tokenUsage");
                    if (tokenUsage != null && !tokenUsage.isEmpty()) {
                        // 获取 totalCents，如果不存在则跳过
                        JsonNode totalCentsNode = tokenUsage.get("totalCents");
                        if (totalCentsNode != null && !totalCentsNode.isNull()) {
                            double totalCents = totalCentsNode.asDouble();
                            
                            // 四舍五入后除以100，保留两位小数
                            BigDecimal costInDollars = BigDecimal.valueOf(Math.round(totalCents))
                                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                            
                            totalUsed = totalUsed.add(costInDollars);
                            chargedEventsCount++;
                            
                            log.debug("计费事件 - Kind: {}, 原始Cents: {}, 计算费用: ${}", 
                                kind, totalCents, costInDollars);
                        } else {
                            log.debug("计费事件但无totalCents - Kind: {}, tokenUsage: {}", kind, tokenUsage);
                        }
                    } else {
                        log.debug("计费事件但tokenUsage为空 - Kind: {}", kind);
                    }
                } else {
                    log.debug("跳过非计费事件 - Kind: {}", kind);
                }
            }
            
            // 计算使用率
            BigDecimal usagePercentage = totalUsed.divide(MAX_QUOTA, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            
            // 判断是否额度已满
            boolean isQuotaFull = totalUsed.compareTo(MAX_QUOTA) >= 0;
            
            // 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("totalUsed", totalUsed);
            result.put("maxQuota", MAX_QUOTA);
            result.put("usagePercentage", usagePercentage.setScale(2, RoundingMode.HALF_UP));
            result.put("isQuotaFull", isQuotaFull);
            result.put("chargedEventsCount", chargedEventsCount);
            result.put("totalEventsCount", totalEventsCount);
            result.put("checkTime", LocalDateTime.now());
            
            log.info("账号使用情况检测完成 - 已使用: ${}/{}, 使用率: {}%, 额度已满: {}", 
                totalUsed, MAX_QUOTA, usagePercentage.setScale(2, RoundingMode.HALF_UP), isQuotaFull);
            
            return result;
            
        } catch (Exception e) {
            log.error("解析API响应失败", e);
            throw new RuntimeException("解析使用情况数据失败: " + e.getMessage());
        }
    }
    
    /**
     * 简化版检测，只返回是否额度已满
     * @param sessionToken 账号的WorkosCursorSessionToken
     * @return true表示额度已满，false表示还有额度
     */
    public boolean isQuotaFull(String sessionToken) {
        try {
            Map<String, Object> usage = checkAccountUsage(sessionToken);
            return (Boolean) usage.get("isQuotaFull");
        } catch (Exception e) {
            log.error("检测账号额度失败: {}", e.getMessage());
            // 如果是认证问题，说明token可能无效，认为不可用
            if (e.getMessage().contains("403") || e.getMessage().contains("401")) {
                log.warn("认证失败，可能SessionToken无效，标记为额度已满");
                return true;
            }
            // 其他错误重新抛出，让上层处理
            throw new RuntimeException("无法检测账号额度状态: " + e.getMessage());
        }
    }
}
