package com.mycursor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 版本控制配置类
 * 从 application.yml 中读取版本相关配置
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/01/06
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.version")
public class VersionConfig {
    
    /**
     * 最新版本号
     * 示例：1.1.0
     */
    private String latest;
    
    /**
     * 更新标题
     * 示例：发现新版本
     */
    private String updateTitle;
    
    /**
     * 更新消息
     * 示例：检测到新版本，建议更新...
     */
    private String updateMessage;
    
    /**
     * 下载地址
     * 示例：https://github.com/xxx/releases/latest
     */
    private String downloadUrl;
    
    /**
     * 是否强制更新
     * true=强制更新，用户必须更新才能继续使用
     * false=可选更新，用户可以选择稍后提醒
     */
    private Boolean forceUpdate;
    
    /**
     * 更新内容列表
     * 示例：
     * - 🎉 新功能1
     * - 🚀 新功能2
     */
    private List<String> features;
}

