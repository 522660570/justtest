package com.mycursor.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mycursor.entity.SystemNotice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 系统公告Mapper接口
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/21 15:20
 */
@Mapper
public interface SystemNoticeMapper extends BaseMapper<SystemNotice> {
    
    /**
     * 查找当前有效的公告
     */
    @Select("SELECT * FROM system_notice WHERE is_active = 1 " +
            "AND (start_time IS NULL OR start_time <= #{now}) " +
            "AND (end_time IS NULL OR end_time > #{now}) " +
            "ORDER BY priority DESC, created_time DESC")
    List<SystemNotice> findActiveNotices(@Param("now") LocalDateTime now);
    
    /**
     * 查找指定类型的有效公告
     */
    @Select("SELECT * FROM system_notice WHERE is_active = 1 " +
            "AND notice_type = #{noticeType} " +
            "AND (start_time IS NULL OR start_time <= #{now}) " +
            "AND (end_time IS NULL OR end_time > #{now}) " +
            "ORDER BY priority DESC, created_time DESC")
    List<SystemNotice> findActiveNoticesByType(@Param("noticeType") String noticeType, 
                                               @Param("now") LocalDateTime now);
    
    /**
     * 查找最高优先级的有效公告
     */
    @Select("SELECT * FROM system_notice WHERE is_active = 1 " +
            "AND (start_time IS NULL OR start_time <= #{now}) " +
            "AND (end_time IS NULL OR end_time > #{now}) " +
            "ORDER BY priority DESC, created_time DESC LIMIT 1")
    SystemNotice findTopActiveNotice(@Param("now") LocalDateTime now);
}
