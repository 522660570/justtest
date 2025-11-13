package com.mycursor.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 授权码实体类
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 16:35
 */
@TableName("license")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class License {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("license_code")
    private String licenseCode;
    
    @TableField("bound_mac_address")
    private String boundMacAddress;
    
    @TableField("is_active")
    private Boolean isActive = true;
    
    @TableField("expiry_time")
    private LocalDateTime expiryTime;
    
    @TableField("total_days")
    private Integer totalDays;
    
    @TableField("membership_type")
    private String membershipType = "Pro";
    
    @TableField("license_type")
    private Integer licenseType = 1; // 1=天卡, 2=次卡
    
    @TableField("total_switches")
    private Integer totalSwitches; // 总换号次数（次卡专用）
    
    @TableField("used_switches")
    private Integer usedSwitches = 0; // 已使用的换号次数（次卡专用）
    
    @TableField("first_bind_time")
    private LocalDateTime firstBindTime;
    
    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    
    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;
    
    /**
     * 授权码类型常量
     */
    public static class LicenseType {
        public static final Integer DAY_CARD = 1;    // 天卡
        public static final Integer COUNT_CARD = 2;  // 次卡
        
        public static String getDescription(Integer type) {
            if (DAY_CARD.equals(type)) {
                return "天卡";
            } else if (COUNT_CARD.equals(type)) {
                return "次卡";
            }
            return "未知";
        }
    }
    
    /**
     * 检查授权码是否有效
     * 天卡：检查是否过期
     * 次卡：检查是否还有剩余次数
     */
    public boolean isValid() {
        if (!isActive) {
            return false;
        }
        
        // 次卡：检查剩余次数
        if (LicenseType.COUNT_CARD.equals(licenseType)) {
            // 如果还没有激活（firstBindTime为null），返回true（可以使用）
            if (firstBindTime == null) {
                return true;
            }
            // 已激活，检查是否还有剩余次数
            return totalSwitches != null && usedSwitches < totalSwitches;
        }
        
        // 天卡：检查过期时间
        // 如果还没有设置过期时间，说明还未激活，返回 true（可以激活）
        if (expiryTime == null) {
            return true;
        }
        // 已激活的授权码，检查是否过期
        return LocalDateTime.now().isBefore(expiryTime);
    }
    
    /**
     * 检查授权码是否已激活（已绑定设备）
     */
    public boolean isActivated() {
        return expiryTime != null && firstBindTime != null;
    }
    
    /**
     * 检查是否可以绑定到指定MAC地址
     */
    public boolean canBindToMac(String macAddress) {
        return boundMacAddress == null || boundMacAddress.equals(macAddress);
    }
    
    /**
     * 绑定到MAC地址
     */
    public void bindToMac(String macAddress) {
        this.boundMacAddress = macAddress;
        this.updatedTime = LocalDateTime.now();
    }
    
    /**
     * 激活授权码（首次绑定时调用）
     * @param bindTime 绑定时间
     */
    public void activate(LocalDateTime bindTime) {
        if (this.firstBindTime == null) {
            this.firstBindTime = bindTime;
            
            // 天卡：设置过期时间
            if (LicenseType.DAY_CARD.equals(licenseType) && totalDays != null) {
                this.expiryTime = bindTime.plusDays(totalDays);
            }
            // 次卡：不设置过期时间（无时间限制）
            
            this.updatedTime = LocalDateTime.now();
        }
    }
    
    /**
     * 计算剩余天数（天卡专用）
     */
    public long getRemainingDays() {
        // 次卡不适用天数概念
        if (LicenseType.COUNT_CARD.equals(licenseType)) {
            return 0;
        }
        
        // 如果授权码未激活，返回总天数
        if (expiryTime == null) {
            return totalDays;
        }
        if (!isValid()) {
            return 0;
        }
        // 使用小时计算，然后转换为天数，确保不到24小时也能显示为1天
        long remainingHours = java.time.temporal.ChronoUnit.HOURS.between(LocalDateTime.now(), expiryTime);
        long days = Math.max(1, (remainingHours + 23) / 24); // 向上取整，最少显示1天
        System.out.println("DEBUG: 当前时间=" + LocalDateTime.now() + ", 过期时间=" + expiryTime + ", 剩余小时=" + remainingHours + ", 计算天数=" + days);
        return days;
    }
    
    /**
     * 计算剩余次数（次卡专用）
     */
    public int getRemainingSwitches() {
        if (!LicenseType.COUNT_CARD.equals(licenseType)) {
            return 0;
        }
        if (totalSwitches == null) {
            return 0;
        }
        return Math.max(0, totalSwitches - usedSwitches);
    }
    
    /**
     * 使用一次换号次数（次卡专用）
     */
    public void useSwitch() {
        if (LicenseType.COUNT_CARD.equals(licenseType)) {
            this.usedSwitches++;
            this.updatedTime = LocalDateTime.now();
        }
    }
    
    /**
     * 计算使用百分比
     * 天卡：基于剩余天数
     * 次卡：基于剩余次数
     */
    public int getUsagePercentage() {
        // 次卡：基于剩余次数计算
        if (LicenseType.COUNT_CARD.equals(licenseType)) {
            if (totalSwitches == null || totalSwitches <= 0) {
                return 100;
            }
            // 如果未激活，使用百分比为 0
            if (firstBindTime == null) {
                return 0;
            }
            return (int) ((usedSwitches * 100) / totalSwitches);
        }
        
        // 天卡：基于剩余天数计算
        if (totalDays <= 0) {
            return 100;
        }
        // 如果未激活，使用百分比为 0
        if (expiryTime == null) {
            return 0;
        }
        long remainingDays = getRemainingDays();
        long usedDays = totalDays - remainingDays;
        return (int) ((usedDays * 100) / totalDays);
    }
}
