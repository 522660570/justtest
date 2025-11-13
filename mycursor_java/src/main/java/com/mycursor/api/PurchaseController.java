package com.mycursor.api;

import com.mycursor.res.ResponseModel;
import com.mycursor.service.ProductService;
import com.mycursor.service.OrderService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 购买系统API控制器
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@Slf4j
@RestController
@RequestMapping("/api/purchase")
@CrossOrigin(origins = "*")
@Api(tags = "购买系统", description = "提供商品购买相关API")
@RequiredArgsConstructor
public class PurchaseController {
    
    private final ProductService productService;
    private final OrderService orderService;
    
    @ApiOperation(value = "获取所有商品", notes = "获取所有上架的商品列表")
    @GetMapping("/products")
    public ResponseModel getProducts() {
        log.info("收到获取商品列表请求");
        
        try {
            Map<String, Object> products = productService.getAllProducts();
            log.info("成功获取商品列表");
            return ResponseModel.success("获取成功", products);
        } catch (Exception e) {
            log.error("获取商品列表失败: {}", e.getMessage());
            return ResponseModel.fail("获取失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "获取热门商品", notes = "获取热门推荐商品")
    @GetMapping("/products/hot")
    public ResponseModel getHotProducts() {
        log.info("收到获取热门商品请求");
        
        try {
            Map<String, Object> products = productService.getHotProducts();
            log.info("成功获取热门商品");
            return ResponseModel.success("获取成功", products);
        } catch (Exception e) {
            log.error("获取热门商品失败: {}", e.getMessage());
            return ResponseModel.fail("获取失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "获取商品详情", notes = "根据商品ID获取详细信息")
    @GetMapping("/products/{productId}")
    public ResponseModel getProductDetail(
            @ApiParam(value = "商品ID", required = true)
            @PathVariable Long productId) {
        log.info("收到获取商品详情请求 - 商品ID: {}", productId);
        
        try {
            Map<String, Object> product = productService.getProductById(productId);
            log.info("成功获取商品详情");
            return ResponseModel.success("获取成功", product);
        } catch (Exception e) {
            log.error("获取商品详情失败: {}", e.getMessage());
            return ResponseModel.fail("获取失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "创建订单", notes = "创建新的购买订单")
    @PostMapping("/orders")
    public ResponseModel createOrder(@RequestBody CreateOrderRequest request) {
        log.info("收到创建订单请求 - 商品ID: {}, 客户邮箱: {}", request.getProductId(), request.getCustomerEmail());
        
        try {
            // 验证必填字段
            if (request.getProductId() == null) {
                return ResponseModel.fail("商品ID不能为空");
            }
            if (request.getCustomerEmail() == null || request.getCustomerEmail().trim().isEmpty()) {
                return ResponseModel.fail("客户邮箱不能为空");
            }
            
            Map<String, Object> order = orderService.createOrder(
                request.getProductId(),
                request.getCustomerEmail(),
                request.getCustomerPhone(),
                request.getCustomerName(),
                request.getDeviceId(),
                request.getCouponCode()
            );
            
            log.info("订单创建成功 - 订单号: {}", order.get("orderNo"));
            return ResponseModel.success("订单创建成功", order);
        } catch (Exception e) {
            log.error("创建订单失败: {}", e.getMessage());
            return ResponseModel.fail("创建失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "获取订单详情", notes = "根据订单号获取订单详情")
    @GetMapping("/orders/{orderNo}")
    public ResponseModel getOrderDetail(
            @ApiParam(value = "订单号", required = true)
            @PathVariable String orderNo) {
        log.info("收到获取订单详情请求 - 订单号: {}", orderNo);
        
        try {
            Map<String, Object> order = orderService.getOrderByNo(orderNo);
            log.info("成功获取订单详情");
            return ResponseModel.success("获取成功", order);
        } catch (Exception e) {
            log.error("获取订单详情失败: {}", e.getMessage());
            return ResponseModel.fail("获取失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "检查订单状态", notes = "检查订单的支付和完成状态")
    @GetMapping("/orders/{orderNo}/status")
    public ResponseModel checkOrderStatus(
            @ApiParam(value = "订单号", required = true)
            @PathVariable String orderNo) {
        log.info("收到检查订单状态请求 - 订单号: {}", orderNo);
        
        try {
            Map<String, Object> status = orderService.checkOrderStatus(orderNo);
            return ResponseModel.success("获取成功", status);
        } catch (Exception e) {
            log.error("检查订单状态失败: {}", e.getMessage());
            return ResponseModel.fail("检查失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "取消订单", notes = "取消未支付的订单")
    @PostMapping("/orders/{orderNo}/cancel")
    public ResponseModel cancelOrder(
            @ApiParam(value = "订单号", required = true)
            @PathVariable String orderNo) {
        log.info("收到取消订单请求 - 订单号: {}", orderNo);
        
        try {
            Map<String, Object> result = orderService.cancelOrder(orderNo);
            log.info("订单取消成功");
            return ResponseModel.success("取消成功", result);
        } catch (Exception e) {
            log.error("取消订单失败: {}", e.getMessage());
            return ResponseModel.fail("取消失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "模拟支付成功", notes = "模拟支付成功的回调处理")
    @PostMapping("/orders/{orderNo}/pay")
    public ResponseModel simulatePayment(
            @ApiParam(value = "订单号", required = true)
            @PathVariable String orderNo,
            @RequestBody PaymentRequest request) {
        log.info("收到模拟支付请求 - 订单号: {}, 支付方式: {}", orderNo, request.getPaymentMethod());
        
        try {
            // 生成模拟交易ID
            String transactionId = "MOCK_" + System.currentTimeMillis();
            
            Map<String, Object> result = orderService.paymentSuccess(orderNo, request.getPaymentMethod(), transactionId);
            log.info("模拟支付处理完成");
            return ResponseModel.success("支付成功", result);
        } catch (Exception e) {
            log.error("模拟支付失败: {}", e.getMessage());
            return ResponseModel.fail("支付失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "查询购买历史", notes = "根据邮箱查询用户的购买历史记录")
    @GetMapping("/history/{email}")
    public ResponseModel getPurchaseHistory(
            @ApiParam(value = "客户邮箱", required = true)
            @PathVariable String email) {
        log.info("收到查询购买历史请求 - 邮箱: {}", email);
        
        try {
            Map<String, Object> history = orderService.getPurchaseHistory(email);
            log.info("成功获取购买历史");
            return ResponseModel.success("获取成功", history);
        } catch (Exception e) {
            log.error("查询购买历史失败: {}", e.getMessage());
            return ResponseModel.fail("查询失败: " + e.getMessage());
        }
    }
    
    /**
     * 创建订单请求类
     */
    public static class CreateOrderRequest {
        private Long productId;
        private String customerEmail;
        private String customerPhone;
        private String customerName;
        private String deviceId;
        private String couponCode;
        
        // Getters and Setters
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        
        public String getCustomerEmail() { return customerEmail; }
        public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
        
        public String getCustomerPhone() { return customerPhone; }
        public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
        
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        
        public String getDeviceId() { return deviceId; }
        public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
        
        public String getCouponCode() { return couponCode; }
        public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    }
    
    /**
     * 支付请求类
     */
    public static class PaymentRequest {
        private String paymentMethod;
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }
}
