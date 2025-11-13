package com.mycursor.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 设备绑定记录实体类
 * 记录授权码与设备MAC地址的绑定关系
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 16:37
 */
@TableName("device_binding")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceBinding {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("license_code")
    private String licenseCode;
    
    @TableField("mac_address")
    private String macAddress;
    
    @TableField("device_name")
    private String deviceName;
    
    @TableField("is_active")
    private Boolean isActive = true;
    
    @TableField("first_bind_time")
    private LocalDateTime firstBindTime;
    
    @TableField("last_active_time")
    private LocalDateTime lastActiveTime;
    
    @TableField("switch_count_today")
    private Integer switchCountToday = 0;
    
    @TableField("last_switch_date")
    private java.time.LocalDate lastSwitchDate;
    
    @TableField("last_switch_time")
    private LocalDateTime lastSwitchTime;
    
    @TableField("total_switch_count")
    private Integer totalSwitchCount = 0;
    
    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    
    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;
    
    /**
     * 更新最后活跃时间
     */
    public void updateLastActiveTime() {
        this.lastActiveTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
    }
    
    /**
     * 激活绑定
     */
    public void activate() {
        this.isActive = true;
        this.lastActiveTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
    }
    
    /**
     * 禁用绑定
     */
    public void deactivate() {
        this.isActive = false;
        this.updatedTime = LocalDateTime.now();
    }
    
    /**
     * 记录一次换号操作
     */
    public void recordSwitch() {
        java.time.LocalDate today = java.time.LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        
        // 如果是新的一天，重置当日计数
        if (this.lastSwitchDate == null || !this.lastSwitchDate.equals(today)) {
            this.switchCountToday = 1;
            this.lastSwitchDate = today;
        } else {
            // 同一天，增加计数
            this.switchCountToday++;
        }
        
        // 记录换号时间（用于时间间隔控制）
        this.lastSwitchTime = now;
        
        // 增加总换号次数
        if (this.totalSwitchCount == null) {
            this.totalSwitchCount = 1;
        } else {
            this.totalSwitchCount++;
        }
        
        this.updatedTime = now;
    }
    
    /**
     * 检查今日是否还可以换号
     * @param maxDailySwitches 每日最大换号次数
     * @return true-可以换号，false-已达上限
     */
    public boolean canSwitchToday(int maxDailySwitches) {
        java.time.LocalDate today = java.time.LocalDate.now();
        
        // 如果没有换号记录，或者不是今天的记录，可以换号
        if (this.lastSwitchDate == null || !this.lastSwitchDate.equals(today)) {
            return true;
        }
        
        // 检查今日换号次数是否已达上限
        return this.switchCountToday < maxDailySwitches;
    }
    
    /**
     * 获取今日剩余换号次数
     * @param maxDailySwitches 每日最大换号次数
     * @return 剩余次数
     */
    public int getRemainingSwitch(int maxDailySwitches) {
        java.time.LocalDate today = java.time.LocalDate.now();
        
        // 如果没有换号记录，或者不是今天的记录，返回最大次数
        if (this.lastSwitchDate == null || !this.lastSwitchDate.equals(today)) {
            return maxDailySwitches;
        }
        
        return Math.max(0, maxDailySwitches - this.switchCountToday);
    }
}
