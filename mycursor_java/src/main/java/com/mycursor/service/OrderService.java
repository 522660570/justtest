package com.mycursor.service;

import com.mycursor.entity.Order;
import com.mycursor.entity.Product;
import com.mycursor.entity.Coupon;
import com.mycursor.mapper.OrderMapper;
import com.mycursor.mapper.ProductMapper;
import com.mycursor.mapper.CouponMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 订单服务
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderMapper orderMapper;
    private final ProductMapper productMapper;
    private final CouponMapper couponMapper;
    private final LicenseService licenseService;
    
    /**
     * 创建订单
     */
    @Transactional
    public Map<String, Object> createOrder(Long productId, String customerEmail, 
                                           String customerPhone, String customerName, 
                                           String deviceId, String couponCode) {
        log.info("创建订单 - 商品ID: {}, 客户邮箱: {}", productId, customerEmail);
        
        // 1. 检查商品
        Product product = productMapper.selectById(productId);
        if (product == null) {
            throw new RuntimeException("商品不存在");
        }
        
        if (!product.isPurchasable()) {
            throw new RuntimeException("商品暂时无法购买");
        }
        
        // 2. 检查库存
        if (!product.hasStock()) {
            throw new RuntimeException("商品库存不足");
        }
        
        // 3. 计算价格
        BigDecimal originalPrice = product.getPrice();
        BigDecimal finalPrice = originalPrice;
        BigDecimal discountAmount = BigDecimal.ZERO;
        
        // 4. 处理优惠券
        Coupon coupon = null;
        if (couponCode != null && !couponCode.trim().isEmpty()) {
            coupon = couponMapper.findByCode(couponCode.trim());
            if (coupon != null) {
                if (!coupon.isAvailable()) {
                    throw new RuntimeException("优惠券不可用或已过期");
                }
                
                if (!coupon.isApplicableToProduct(productId)) {
                    throw new RuntimeException("优惠券不适用于该商品");
                }
                
                BigDecimal couponDiscount = coupon.calculateDiscount(originalPrice);
                if (couponDiscount.compareTo(BigDecimal.ZERO) > 0) {
                    discountAmount = discountAmount.add(couponDiscount);
                    finalPrice = finalPrice.subtract(couponDiscount);
                }
            } else {
                throw new RuntimeException("优惠券不存在");
            }
        }
        
        // 确保最终价格不为负数
        if (finalPrice.compareTo(BigDecimal.ZERO) < 0) {
            finalPrice = BigDecimal.ZERO;
        }
        
        // 5. 创建订单
        Order order = new Order();
        order.setOrderNo(Order.generateOrderNo());
        order.setProductId(productId);
        order.setProductName(product.getName());
        order.setDurationDays(product.getDurationDays());
        order.setPrice(finalPrice);
        order.setOriginalPrice(originalPrice);
        order.setDiscountAmount(discountAmount);
        order.setCustomerEmail(customerEmail);
        order.setCustomerPhone(customerPhone);
        order.setCustomerName(customerName);
        order.setDeviceId(deviceId);
        order.setStatus(Order.OrderStatus.PENDING.getValue());
        order.setCreatedTime(LocalDateTime.now());
        order.setUpdatedTime(LocalDateTime.now());
        
        orderMapper.insert(order);
        
        // 6. 使用优惠券
        if (coupon != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            couponMapper.increaseUsedCount(coupon.getId());
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", order.getId());
        result.put("orderNo", order.getOrderNo());
        result.put("productName", order.getProductName());
        result.put("durationDays", order.getDurationDays());
        result.put("originalPrice", order.getOriginalPrice());
        result.put("finalPrice", order.getPrice());
        result.put("discountAmount", order.getDiscountAmount());
        result.put("status", order.getStatus());
        result.put("createdTime", order.getCreatedTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("订单创建成功 - 订单号: {}, 金额: {}", order.getOrderNo(), finalPrice);
        return result;
    }
    
    /**
     * 根据订单号获取订单详情
     */
    public Map<String, Object> getOrderByNo(String orderNo) {
        log.info("获取订单详情 - 订单号: {}", orderNo);
        
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        
        return convertOrderToMap(order);
    }
    
    /**
     * 支付成功处理
     */
    @Transactional
    public Map<String, Object> paymentSuccess(String orderNo, String paymentMethod, String transactionId) {
        log.info("处理支付成功 - 订单号: {}, 支付方式: {}", orderNo, paymentMethod);
        
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        
        if (!order.canPay()) {
            throw new RuntimeException("订单状态不允许支付");
        }
        
        // 1. 更新订单状态为已支付
        order.markAsPaid(paymentMethod, transactionId);
        orderMapper.updateById(order);
        
        // 2. 生成授权码
        String licenseCode = licenseService.generateLicense(order.getDurationDays()).get("licenseCode").toString();
        
        // 3. 更新订单状态为已完成
        order.markAsCompleted(licenseCode);
        orderMapper.updateById(order);
        
        // 4. 减少商品库存
        Product product = productMapper.selectById(order.getProductId());
        if (product != null && product.getStockQuantity() != null && product.getStockQuantity() != -1) {
            productMapper.decreaseStock(order.getProductId(), 1);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", order.getId());
        result.put("orderNo", order.getOrderNo());
        result.put("licenseCode", licenseCode);
        result.put("durationDays", order.getDurationDays());
        result.put("status", order.getStatus());
        result.put("paymentTime", order.getPaymentTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("支付处理完成 - 订单号: {}, 授权码: {}", orderNo, licenseCode);
        return result;
    }
    
    /**
     * 取消订单
     */
    @Transactional
    public Map<String, Object> cancelOrder(String orderNo) {
        log.info("取消订单 - 订单号: {}", orderNo);
        
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        
        if (!order.canPay()) {
            throw new RuntimeException("订单已支付，无法取消");
        }
        
        order.cancel();
        orderMapper.updateById(order);
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderNo", orderNo);
        result.put("status", order.getStatus());
        result.put("cancelTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("订单取消成功 - 订单号: {}", orderNo);
        return result;
    }
    
    /**
     * 检查订单状态
     */
    public Map<String, Object> checkOrderStatus(String orderNo) {
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderNo", orderNo);
        result.put("status", order.getStatus());
        result.put("isPaid", order.isPaid());
        result.put("isCompleted", order.isCompleted());
        result.put("licenseCode", order.getLicenseCode());
        
        return result;
    }
    
    /**
     * 获取购买历史
     */
    public Map<String, Object> getPurchaseHistory(String email) {
        log.info("查询购买历史 - 邮箱: {}", email);
        
        List<Order> orders = orderMapper.findByCustomerEmail(email);
        
        List<Map<String, Object>> orderList = new ArrayList<>();
        for (Order order : orders) {
            Map<String, Object> orderInfo = new HashMap<>();
            orderInfo.put("orderNo", order.getOrderNo());
            orderInfo.put("productName", order.getProductName());
            orderInfo.put("durationDays", order.getDurationDays());
            orderInfo.put("price", order.getPrice());
            orderInfo.put("status", order.getStatus());
            orderInfo.put("licenseCode", order.getLicenseCode());
            orderInfo.put("createdTime", order.getCreatedTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            
            if (order.getPaymentTime() != null) {
                orderInfo.put("paymentTime", order.getPaymentTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            }
            
            // 计算授权码剩余有效期
            if (order.isCompleted() && order.getLicenseGeneratedTime() != null) {
                LocalDateTime expiryTime = order.getLicenseGeneratedTime().plusDays(order.getDurationDays());
                LocalDateTime now = LocalDateTime.now();
                if (now.isBefore(expiryTime)) {
                    long remainingDays = java.time.temporal.ChronoUnit.DAYS.between(now, expiryTime);
                    orderInfo.put("remainingDays", Math.max(1, remainingDays));
                    orderInfo.put("isExpired", false);
                } else {
                    orderInfo.put("remainingDays", 0);
                    orderInfo.put("isExpired", true);
                }
                orderInfo.put("expiryTime", expiryTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            }
            
            orderList.add(orderInfo);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("email", email);
        result.put("orders", orderList);
        result.put("totalCount", orderList.size());
        result.put("fetchTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("查询到 {} 条购买记录", orderList.size());
        return result;
    }
    
    /**
     * 将Order实体转换为Map
     */
    private Map<String, Object> convertOrderToMap(Order order) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", order.getId());
        map.put("orderNo", order.getOrderNo());
        map.put("productName", order.getProductName());
        map.put("durationDays", order.getDurationDays());
        map.put("price", order.getPrice());
        map.put("originalPrice", order.getOriginalPrice());
        map.put("discountAmount", order.getDiscountAmount());
        map.put("customerEmail", order.getCustomerEmail());
        map.put("customerPhone", order.getCustomerPhone());
        map.put("customerName", order.getCustomerName());
        map.put("status", order.getStatus());
        map.put("paymentMethod", order.getPaymentMethod());
        map.put("licenseCode", order.getLicenseCode());
        map.put("createdTime", order.getCreatedTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        if (order.getPaymentTime() != null) {
            map.put("paymentTime", order.getPaymentTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        
        return map;
    }
}
