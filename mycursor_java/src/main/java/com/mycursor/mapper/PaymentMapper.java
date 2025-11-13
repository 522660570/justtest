package com.mycursor.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mycursor.entity.Payment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 支付记录Mapper接口
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/26 17:40
 */
@Mapper
public interface PaymentMapper extends BaseMapper<Payment> {
    
    /**
     * 根据订单ID查找支付记录
     */
    @Select("SELECT * FROM payments WHERE order_id = #{orderId} ORDER BY created_time DESC")
    List<Payment> findByOrderId(@Param("orderId") Long orderId);
    
    /**
     * 根据订单号查找支付记录
     */
    @Select("SELECT * FROM payments WHERE order_no = #{orderNo} ORDER BY created_time DESC")
    List<Payment> findByOrderNo(@Param("orderNo") String orderNo);
    
    /**
     * 根据第三方交易ID查找支付记录
     */
    @Select("SELECT * FROM payments WHERE transaction_id = #{transactionId}")
    Payment findByTransactionId(@Param("transactionId") String transactionId);
    
    /**
     * 根据支付平台订单号查找支付记录
     */
    @Select("SELECT * FROM payments WHERE platform_order_no = #{platformOrderNo}")
    Payment findByPlatformOrderNo(@Param("platformOrderNo") String platformOrderNo);
    
    /**
     * 根据状态查找支付记录
     */
    @Select("SELECT * FROM payments WHERE status = #{status} ORDER BY created_time DESC")
    List<Payment> findByStatus(@Param("status") String status);
    
    /**
     * 查找指定订单的成功支付记录
     */
    @Select("SELECT * FROM payments WHERE order_id = #{orderId} AND status = 'success' LIMIT 1")
    Payment findSuccessPaymentByOrderId(@Param("orderId") Long orderId);
}

