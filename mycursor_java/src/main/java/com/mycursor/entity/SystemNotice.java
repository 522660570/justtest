package com.mycursor.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 系统公告实体类
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/21 15:20
 */
@TableName("system_notice")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemNotice {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("title")
    private String title;
    
    @TableField("content")
    private String content;
    
    @TableField("notice_type")
    private String noticeType = "warning"; // warning, info, success, error
    
    @TableField("is_active")
    private Boolean isActive = true;
    
    @TableField("priority")
    private Integer priority = 0; // 优先级，数字越大优先级越高
    
    @TableField("start_time")
    private LocalDateTime startTime;
    
    @TableField("end_time")
    private LocalDateTime endTime;
    
    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    
    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;
    
    /**
     * 检查公告是否在有效期内
     */
    public boolean isCurrentlyActive() {
        if (!isActive) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        // 检查开始时间
        if (startTime != null && now.isBefore(startTime)) {
            return false;
        }
        
        // 检查结束时间
        if (endTime != null && now.isAfter(endTime)) {
            return false;
        }
        
        return true;
    }
}
