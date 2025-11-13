package com.mycursor.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单实体类
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@TableName("orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("order_no")
    private String orderNo;
    
    @TableField("product_id")
    private Long productId;
    
    @TableField("product_name")
    private String productName;
    
    @TableField("duration_days")
    private Integer durationDays;
    
    @TableField("price")
    private BigDecimal price;
    
    @TableField("original_price")
    private BigDecimal originalPrice;
    
    @TableField("discount_amount")
    private BigDecimal discountAmount;
    
    @TableField("customer_email")
    private String customerEmail;
    
    @TableField("customer_phone")
    private String customerPhone;
    
    @TableField("customer_name")
    private String customerName;
    
    @TableField("device_id")
    private String deviceId;
    
    @TableField("license_code")
    private String licenseCode;
    
    @TableField("license_generated_time")
    private LocalDateTime licenseGeneratedTime;
    
    @TableField("status")
    private String status = OrderStatus.PENDING.getValue();
    
    @TableField("payment_method")
    private String paymentMethod;
    
    @TableField("payment_transaction_id")
    private String paymentTransactionId;
    
    @TableField("payment_time")
    private LocalDateTime paymentTime;
    
    @TableField("notes")
    private String notes;
    
    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    
    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;
    
    /**
     * 订单状态枚举
     */
    public enum OrderStatus {
        PENDING("pending", "待支付"),
        PAID("paid", "已支付"),
        COMPLETED("completed", "已完成"),
        CANCELLED("cancelled", "已取消"),
        REFUNDED("refunded", "已退款");
        
        private final String value;
        private final String description;
        
        OrderStatus(String value, String description) {
            this.value = value;
            this.description = description;
        }
        
        public String getValue() {
            return value;
        }
        
        public String getDescription() {
            return description;
        }
        
        public static OrderStatus fromValue(String value) {
            for (OrderStatus status : values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Unknown order status: " + value);
        }
    }
    
    /**
     * 支付方式枚举
     */
    public enum PaymentMethod {
        ALIPAY("alipay", "支付宝"),
        WECHAT("wechat", "微信支付"),
        BANK_CARD("bank_card", "银行卡");
        
        private final String value;
        private final String description;
        
        PaymentMethod(String value, String description) {
            this.value = value;
            this.description = description;
        }
        
        public String getValue() {
            return value;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 检查订单是否可以支付
     */
    public boolean canPay() {
        return OrderStatus.PENDING.getValue().equals(status);
    }
    
    /**
     * 检查订单是否已支付
     */
    public boolean isPaid() {
        return OrderStatus.PAID.getValue().equals(status) || 
               OrderStatus.COMPLETED.getValue().equals(status);
    }
    
    /**
     * 检查订单是否已完成
     */
    public boolean isCompleted() {
        return OrderStatus.COMPLETED.getValue().equals(status);
    }
    
    /**
     * 检查订单是否已取消
     */
    public boolean isCancelled() {
        return OrderStatus.CANCELLED.getValue().equals(status);
    }
    
    /**
     * 标记订单为已支付
     */
    public void markAsPaid(String paymentMethod, String transactionId) {
        this.status = OrderStatus.PAID.getValue();
        this.paymentMethod = paymentMethod;
        this.paymentTransactionId = transactionId;
        this.paymentTime = LocalDateTime.now();
    }
    
    /**
     * 标记订单为已完成
     */
    public void markAsCompleted(String licenseCode) {
        this.status = OrderStatus.COMPLETED.getValue();
        this.licenseCode = licenseCode;
        this.licenseGeneratedTime = LocalDateTime.now();
    }
    
    /**
     * 取消订单
     */
    public void cancel() {
        this.status = OrderStatus.CANCELLED.getValue();
    }
    
    /**
     * 计算实际节省金额
     */
    public BigDecimal getSavingAmount() {
        if (originalPrice != null && originalPrice.compareTo(price) > 0) {
            return originalPrice.subtract(price);
        }
        return BigDecimal.ZERO;
    }
    
    /**
     * 生成订单号
     */
    public static String generateOrderNo() {
        return "CUR" + System.currentTimeMillis() + String.format("%04d", (int)(Math.random() * 10000));
    }
}

