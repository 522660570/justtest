package com.mycursor.entity;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 优惠券实体类
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@TableName("coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("code")
    private String code;

    @TableField("name")
    private String name;

    @TableField("type")
    private String type;

    @TableField("value")
    private BigDecimal value;

    @TableField("min_amount")
    private BigDecimal minAmount;

    @TableField("max_discount")
    private BigDecimal maxDiscount;

    @TableField("usage_limit")
    private Integer usageLimit;

    @TableField("used_count")
    private Integer usedCount = 0;

    @TableField("start_time")
    private LocalDateTime startTime;

    @TableField("end_time")
    private LocalDateTime endTime;

    @TableField("is_active")
    private Boolean isActive = true;

    @TableField("applicable_products")
    private String applicableProducts;

    @TableField(value = "created_time", fill = FieldFill.INSERT)
    private LocalDateTime createdTime;

    @TableField(value = "updated_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedTime;

    /**
     * 优惠券类型枚举
     */
    public enum CouponType {
        FIXED("fixed", "固定金额"),
        PERCENT("percent", "百分比折扣");

        private final String value;
        private final String description;

        CouponType(String value, String description) {
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
     * 检查优惠券是否可用
     */
    public boolean isAvailable() {
        LocalDateTime now = LocalDateTime.now();
        return isActive &&
               now.isAfter(startTime) &&
               now.isBefore(endTime) &&
               (usageLimit == null || usedCount < usageLimit);
    }

    /**
     * 检查是否适用于指定商品
     */
    public boolean isApplicableToProduct(Long productId) {
        // 如果没有限制商品，则适用于所有商品
        if (applicableProducts == null || applicableProducts.trim().isEmpty()) {
            return true;
        }

        // 这里应该解析JSON数组，简化处理
        return applicableProducts.contains(productId.toString());
    }

    /**
     * 计算优惠金额
     */
    public BigDecimal calculateDiscount(BigDecimal orderAmount) {
        if (!isAvailable()) {
            return BigDecimal.ZERO;
        }

        // 检查最低使用金额
        if (minAmount != null && orderAmount.compareTo(minAmount) < 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = BigDecimal.ZERO;

        if (CouponType.FIXED.getValue().equals(type)) {
            // 固定金额优惠
            discount = value;
        } else if (CouponType.PERCENT.getValue().equals(type)) {
            // 百分比优惠
            discount = orderAmount.multiply(value);

            // 检查最大优惠限制
            if (maxDiscount != null && discount.compareTo(maxDiscount) > 0) {
                discount = maxDiscount;
            }
        }

        // 优惠金额不能超过订单金额
        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }

        return discount;
    }

    /**
     * 使用优惠券
     */
    public void use() {
        this.usedCount++;
    }

    /**
     * 检查是否已用完
     */
    public boolean isUsedUp() {
        return usageLimit != null && usedCount >= usageLimit;
    }
}

