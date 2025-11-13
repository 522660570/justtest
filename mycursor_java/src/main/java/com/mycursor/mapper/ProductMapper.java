package com.mycursor.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mycursor.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 商品Mapper接口
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@Mapper
public interface ProductMapper extends BaseMapper<Product> {
    
    /**
     * 查找所有上架的商品
     */
    @Select("SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order ASC, created_time ASC")
    List<Product> findActiveProducts();
    
    /**
     * 查找热门商品
     */
    @Select("SELECT * FROM products WHERE is_active = 1 AND is_hot = 1 ORDER BY sort_order ASC")
    List<Product> findHotProducts();
    
    /**
     * 根据时长查找商品
     */
    @Select("SELECT * FROM products WHERE is_active = 1 AND duration_days = #{durationDays}")
    List<Product> findByDurationDays(@Param("durationDays") Integer durationDays);
    
    /**
     * 减少商品库存
     */
    @Update("UPDATE products SET stock_quantity = stock_quantity - #{quantity} " +
            "WHERE id = #{productId} AND stock_quantity >= #{quantity}")
    int decreaseStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);
    
    /**
     * 增加商品库存
     */
    @Update("UPDATE products SET stock_quantity = stock_quantity + #{quantity} WHERE id = #{productId}")
    int increaseStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);
}

