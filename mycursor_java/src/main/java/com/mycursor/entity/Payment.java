package com.mycursor.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付记录实体类
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@TableName("payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("order_id")
    private Long orderId;
    
    @TableField("order_no")
    private String orderNo;
    
    @TableField("payment_method")
    private String paymentMethod;
    
    @TableField("payment_channel")
    private String paymentChannel;
    
    @TableField("amount")
    private BigDecimal amount;
    
    @TableField("currency")
    private String currency = "CNY";
    
    @TableField("transaction_id")
    private String transactionId;
    
    @TableField("platform_order_no")
    private String platformOrderNo;
    
    @TableField("status")
    private String status = PaymentStatus.PENDING.getValue();
    
    @TableField("callback_data")
    private String callbackData;
    
    @TableField("callback_time")
    private LocalDateTime callbackTime;
    
    @TableField("failure_reason")
    private String failureReason;
    
    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    
    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;
    
    /**
     * 支付状态枚举
     */
    public enum PaymentStatus {
        PENDING("pending", "待支付"),
        SUCCESS("success", "支付成功"),
        FAILED("failed", "支付失败"),
        CANCELLED("cancelled", "已取消");
        
        private final String value;
        private final String description;
        
        PaymentStatus(String value, String description) {
            this.value = value;
            this.description = description;
        }
        
        public String getValue() {
            return value;
        }
        
        public String getDescription() {
            return description;
        }
        
        public static PaymentStatus fromValue(String value) {
            for (PaymentStatus status : values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Unknown payment status: " + value);
        }
    }
    
    /**
     * 检查支付是否成功
     */
    public boolean isSuccess() {
        return PaymentStatus.SUCCESS.getValue().equals(status);
    }
    
    /**
     * 检查支付是否失败
     */
    public boolean isFailed() {
        return PaymentStatus.FAILED.getValue().equals(status);
    }
    
    /**
     * 检查支付是否待处理
     */
    public boolean isPending() {
        return PaymentStatus.PENDING.getValue().equals(status);
    }
    
    /**
     * 标记支付成功
     */
    public void markAsSuccess(String transactionId, String callbackData) {
        this.status = PaymentStatus.SUCCESS.getValue();
        this.transactionId = transactionId;
        this.callbackData = callbackData;
        this.callbackTime = LocalDateTime.now();
    }
    
    /**
     * 标记支付失败
     */
    public void markAsFailed(String failureReason) {
        this.status = PaymentStatus.FAILED.getValue();
        this.failureReason = failureReason;
    }
    
    /**
     * 取消支付
     */
    public void cancel() {
        this.status = PaymentStatus.CANCELLED.getValue();
    }
}

