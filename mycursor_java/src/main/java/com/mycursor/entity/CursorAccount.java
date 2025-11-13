package com.mycursor.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * Cursor账号实体类
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 16:36
 */
@TableName("cursor_account")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CursorAccount {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("email")
    private String email;
    
    @TableField("access_token")
    private String accessToken;
    
    @TableField("refresh_token")
    private String refreshToken;
    
    @TableField("session_token")
    private String sessionToken;
    
    @TableField("sign_up_type")
    private String signUpType = "email";
    
    @TableField("is_available")
    private Boolean isAvailable = true;
    
    @TableField("is_quota_full")
    private Boolean isQuotaFull = false;
    
    @TableField("actual_usage_amount")
    private java.math.BigDecimal actualUsageAmount = java.math.BigDecimal.ZERO;
    
    @TableField("last_used_time")
    private LocalDateTime lastUsedTime;
    
    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    
    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;
    
    @TableField("quota_check_time")
    private LocalDateTime quotaCheckTime;
    
    @TableField("notes")
    private String notes;
    
    @TableField("occupied_by_license_code")
    private String occupiedByLicenseCode;
    
    @TableField("occupied_time")
    private LocalDateTime occupiedTime;
    
    @TableField("membership_type")
    private String membershipType = "unknown";
    
    @TableField("membership_check_time")
    private LocalDateTime membershipCheckTime;
    
    @TableField("trial_length_days")
    private Integer trialLengthDays;
    
    @TableField("days_remaining_on_trial")
    private Integer daysRemainingOnTrial;
    
    /**
     * 检查账号是否可用
     */
    public boolean isUsable() {
        return isAvailable && !isQuotaFull;
    }
    
    /**
     * 标记为已使用
     */
    public void markAsUsed() {
        this.lastUsedTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
        this.isAvailable = false; // 标记为不可用，避免重复分配
    }
    
    /**
     * 标记账号被指定授权码占用
     */
    public void markAsOccupied(String licenseCode) {
        this.occupiedByLicenseCode = licenseCode;
        this.occupiedTime = LocalDateTime.now();
        this.lastUsedTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
        this.isAvailable = false; // 标记为不可用，避免重复分配
    }
    
    /**
     * 释放账号占用状态
     */
    public void releaseOccupation() {
        this.occupiedByLicenseCode = null;
        this.occupiedTime = null;
        this.isAvailable = true;
        this.updatedTime = LocalDateTime.now();
    }
    
    /**
     * 更新额度状态
     */
    public void updateQuotaStatus(boolean isQuotaFull) {
        this.isQuotaFull = isQuotaFull;
        this.quotaCheckTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
    }
    
    /**
     * 检查是否需要重新验证额度（超过1小时未检查）
     */
    public boolean needsQuotaRecheck() {
        if (quotaCheckTime == null) {
            return true;
        }
        return LocalDateTime.now().minusHours(1).isAfter(quotaCheckTime);
    }
}
