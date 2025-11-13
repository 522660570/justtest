package com.mycursor.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品实体类
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@TableName("products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("name")
    private String name;
    
    @TableField("description")
    private String description;
    
    @TableField("duration_days")
    private Integer durationDays;
    
    @TableField("price")
    private BigDecimal price;
    
    @TableField("original_price")
    private BigDecimal originalPrice;
    
    @TableField("discount_rate")
    private BigDecimal discountRate;
    
    @TableField("stock_quantity")
    private Integer stockQuantity;
    
    @TableField("is_active")
    private Boolean isActive = true;
    
    @TableField("is_hot")
    private Boolean isHot = false;
    
    @TableField("sort_order")
    private Integer sortOrder = 0;
    
    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;
    
    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;
    
    /**
     * 计算实际售价
     */
    public BigDecimal getActualPrice() {
        if (discountRate != null && discountRate.compareTo(BigDecimal.ZERO) > 0) {
            return price.multiply(BigDecimal.ONE.subtract(discountRate));
        }
        return price;
    }
    
    /**
     * 计算优惠金额
     */
    public BigDecimal getDiscountAmount() {
        if (originalPrice != null && originalPrice.compareTo(price) > 0) {
            return originalPrice.subtract(price);
        }
        return BigDecimal.ZERO;
    }
    
    /**
     * 检查是否有库存
     */
    public boolean hasStock() {
        return stockQuantity == null || stockQuantity == -1 || stockQuantity > 0;
    }
    
    /**
     * 检查是否可购买
     */
    public boolean isPurchasable() {
        return isActive && hasStock();
    }
    
    /**
     * 减少库存
     */
    public void decreaseStock(int quantity) {
        if (stockQuantity != null && stockQuantity != -1) {
            stockQuantity = Math.max(0, stockQuantity - quantity);
        }
    }
    
    /**
     * 获取折扣百分比显示
     */
    public String getDiscountPercentage() {
        if (originalPrice != null && originalPrice.compareTo(price) > 0) {
            BigDecimal discount = originalPrice.subtract(price).divide(originalPrice, 2, BigDecimal.ROUND_HALF_UP);
            return String.format("%.0f%%", discount.multiply(new BigDecimal("100")));
        }
        return null;
    }
}

