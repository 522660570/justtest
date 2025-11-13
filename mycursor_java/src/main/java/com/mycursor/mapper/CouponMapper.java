package com.mycursor.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mycursor.entity.Coupon;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 优惠券Mapper接口
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@Mapper
public interface CouponMapper extends BaseMapper<Coupon> {
    
    /**
     * 根据优惠券代码查找优惠券
     */
    @Select("SELECT * FROM coupons WHERE code = #{code}")
    Coupon findByCode(@Param("code") String code);
    
    /**
     * 查找当前可用的优惠券
     */
    @Select("SELECT * FROM coupons WHERE is_active = 1 " +
            "AND start_time <= #{now} AND end_time > #{now} " +
            "AND (usage_limit IS NULL OR used_count < usage_limit) " +
            "ORDER BY created_time DESC")
    List<Coupon> findAvailableCoupons(@Param("now") LocalDateTime now);
    
    /**
     * 增加优惠券使用次数
     */
    @Update("UPDATE coupons SET used_count = used_count + 1 WHERE id = #{couponId}")
    int increaseUsedCount(@Param("couponId") Long couponId);
    
    /**
     * 减少优惠券使用次数（退款时使用）
     */
    @Update("UPDATE coupons SET used_count = used_count - 1 WHERE id = #{couponId} AND used_count > 0")
    int decreaseUsedCount(@Param("couponId") Long couponId);
}

