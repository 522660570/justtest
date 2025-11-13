package com.mycursor.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mycursor.entity.Order;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单Mapper接口
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@Mapper
public interface OrderMapper extends BaseMapper<Order> {
    
    /**
     * 根据订单号查找订单
     */
    @Select("SELECT * FROM orders WHERE order_no = #{orderNo}")
    Order findByOrderNo(@Param("orderNo") String orderNo);
    
    /**
     * 根据客户邮箱查找订单
     */
    @Select("SELECT * FROM orders WHERE customer_email = #{email} ORDER BY created_time DESC")
    List<Order> findByCustomerEmail(@Param("email") String email);
    
    /**
     * 根据状态查找订单
     */
    @Select("SELECT * FROM orders WHERE status = #{status} ORDER BY created_time DESC")
    List<Order> findByStatus(@Param("status") String status);
    
    /**
     * 查找超时未支付的订单
     */
    @Select("SELECT * FROM orders WHERE status = 'pending' AND created_time < #{expireTime}")
    List<Order> findExpiredOrders(@Param("expireTime") LocalDateTime expireTime);
    
    /**
     * 根据设备ID查找订单
     */
    @Select("SELECT * FROM orders WHERE device_id = #{deviceId} ORDER BY created_time DESC")
    List<Order> findByDeviceId(@Param("deviceId") String deviceId);
    
    /**
     * 根据授权码查找订单
     */
    @Select("SELECT * FROM orders WHERE license_code = #{licenseCode}")
    Order findByLicenseCode(@Param("licenseCode") String licenseCode);
    
    /**
     * 统计指定时间范围内的订单数量
     */
    @Select("SELECT COUNT(*) FROM orders WHERE created_time >= #{startTime} AND created_time <= #{endTime}")
    int countOrdersByTimeRange(@Param("startTime") LocalDateTime startTime, 
                               @Param("endTime") LocalDateTime endTime);
    
    /**
     * 统计指定状态的订单数量
     */
    @Select("SELECT COUNT(*) FROM orders WHERE status = #{status}")
    int countOrdersByStatus(@Param("status") String status);
}

