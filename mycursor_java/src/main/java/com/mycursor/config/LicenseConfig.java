package com.mycursor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 授权码配置类
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/10/28
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "mycursor.license")
public class LicenseConfig {
    
    /**
     * 默认授权天数
     */
    private Integer defaultDays = 30;
    
    /**
     * 每个授权码最多绑定设备数
     */
    private Integer maxDevices = 1;
    
    /**
     * 设备换号配置
     */
    private DeviceSwitchConfig deviceSwitch = new DeviceSwitchConfig();
    
    /**
     * 设备换号配置类
     */
    @Data
    public static class DeviceSwitchConfig {
        
        /**
         * 是否启用换号次数限制
         */
        private Boolean enabled = true;
        
        /**
         * 每天最多允许换号次数
         */
        private Integer maxDailySwitches = 8;
        
        /**
         * 每天重置时间（24小时制，格式：HH:mm:ss）
         */
        private String resetTime = "00:00:00";
        
        /**
         * 每次换号最小间隔时间（分钟）
         */
        private Integer minSwitchIntervalMinutes = 2;
    }
}




