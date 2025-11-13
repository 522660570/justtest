package com.mycursor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 账号相关配置类
 * 从 application.yml 中读取账号相关配置
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/11/09
 */
@Data
@Component
@ConfigurationProperties(prefix = "mycursor.account")
public class AccountConfig {
    
    /**
     * 额度检查间隔时间（秒）
     * 默认：3600秒（1小时）
     */
    private Integer quotaCheckInterval = 3600;
    
    /**
     * 是否接受 free 类型的账号
     * true=接受 free 账号，false=不接受 free 账号（只接受 pro 和 free_trial）
     * 默认：false
     */
    private Boolean acceptFreeAccounts = false;
    
    /**
     * 换号时是否检查账号额度
     * true=检查额度，false=不检查额度
     * 默认：false
     */
    private Boolean checkQuotaOnSwitch = false;
    
    /**
     * free 类型的账号是否可以用于一键换号
     * true=可以用于换号，false=不可以用于换号
     * 默认：false
     */
    private Boolean useFreeAccountsForSwitch = false;
    
    /**
     * 🆕 getAccountByCode 接口：是否启用订阅状态检查
     * true=检查订阅状态（步骤3），false=跳过订阅检查
     * 默认：true
     */
    private Boolean enableSubscriptionCheck = true;
    
    /**
     * 🆕 getAccountByCode 接口：是否启用额度检查
     * true=检查账号额度（步骤4），false=跳过额度检查
     * 默认：true
     */
    private Boolean enableQuotaCheck = true;
}

