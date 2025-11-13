package com.mycursor.service;

import com.mycursor.entity.Product;
import com.mycursor.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 商品服务
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {
    
    private final ProductMapper productMapper;
    
    /**
     * 获取所有上架商品
     */
    public Map<String, Object> getAllProducts() {
        log.info("获取所有上架商品");
        
        List<Product> products = productMapper.findActiveProducts();
        
        List<Map<String, Object>> productList = new ArrayList<>();
        for (Product product : products) {
            productList.add(convertToMap(product));
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("products", productList);
        result.put("totalCount", productList.size());
        result.put("fetchTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("获取到 {} 个商品", productList.size());
        return result;
    }
    
    /**
     * 获取热门商品
     */
    public Map<String, Object> getHotProducts() {
        log.info("获取热门商品");
        
        List<Product> products = productMapper.findHotProducts();
        
        List<Map<String, Object>> productList = new ArrayList<>();
        for (Product product : products) {
            productList.add(convertToMap(product));
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("products", productList);
        result.put("totalCount", productList.size());
        
        log.info("获取到 {} 个热门商品", productList.size());
        return result;
    }
    
    /**
     * 根据ID获取商品详情
     */
    public Map<String, Object> getProductById(Long productId) {
        log.info("获取商品详情 - ID: {}", productId);
        
        Product product = productMapper.selectById(productId);
        if (product == null) {
            throw new RuntimeException("商品不存在");
        }
        
        if (!product.getIsActive()) {
            throw new RuntimeException("商品已下架");
        }
        
        Map<String, Object> result = convertToMap(product);
        log.info("获取商品详情成功 - 商品: {}", product.getName());
        return result;
    }
    
    /**
     * 检查商品库存
     */
    public boolean checkStock(Long productId, Integer quantity) {
        Product product = productMapper.selectById(productId);
        if (product == null) {
            return false;
        }
        
        // -1 表示无限库存
        if (product.getStockQuantity() == null || product.getStockQuantity() == -1) {
            return true;
        }
        
        return product.getStockQuantity() >= quantity;
    }
    
    /**
     * 减少库存
     */
    public boolean decreaseStock(Long productId, Integer quantity) {
        log.info("减少商品库存 - 商品ID: {}, 数量: {}", productId, quantity);
        
        int affected = productMapper.decreaseStock(productId, quantity);
        if (affected > 0) {
            log.info("库存减少成功");
            return true;
        } else {
            log.warn("库存减少失败，可能库存不足");
            return false;
        }
    }
    
    /**
     * 增加库存（退款时使用）
     */
    public boolean increaseStock(Long productId, Integer quantity) {
        log.info("增加商品库存 - 商品ID: {}, 数量: {}", productId, quantity);
        
        int affected = productMapper.increaseStock(productId, quantity);
        log.info("库存增加结果: {}", affected > 0 ? "成功" : "失败");
        return affected > 0;
    }
    
    /**
     * 将Product实体转换为Map
     */
    private Map<String, Object> convertToMap(Product product) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", product.getId());
        map.put("name", product.getName());
        map.put("description", product.getDescription());
        map.put("durationDays", product.getDurationDays());
        map.put("price", product.getPrice());
        map.put("originalPrice", product.getOriginalPrice());
        map.put("actualPrice", product.getActualPrice());
        map.put("discountAmount", product.getDiscountAmount());
        map.put("discountPercentage", product.getDiscountPercentage());
        map.put("stockQuantity", product.getStockQuantity());
        map.put("isHot", product.getIsHot());
        map.put("hasStock", product.hasStock());
        map.put("isPurchasable", product.isPurchasable());
        map.put("sortOrder", product.getSortOrder());
        map.put("createdTime", product.getCreatedTime() != null ? 
            product.getCreatedTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null);
        
        return map;
    }
}

