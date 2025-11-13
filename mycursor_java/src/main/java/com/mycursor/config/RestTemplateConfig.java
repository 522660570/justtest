package com.mycursor.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate 配置类
 * 提供 HTTP 客户端 Bean
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/10/26
 */
@Configuration
public class RestTemplateConfig {
    
    /**
     * 创建 RestTemplate Bean
     * 配置连接超时和读取超时
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        
        // 设置连接超时时间（毫秒）
        factory.setConnectTimeout(10000); // 10秒
        
        // 设置读取超时时间（毫秒）
        factory.setReadTimeout(10000); // 10秒
        
        return new RestTemplate(factory);
    }
}

