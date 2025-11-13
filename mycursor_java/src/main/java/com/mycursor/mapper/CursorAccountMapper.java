package com.mycursor.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mycursor.entity.CursorAccount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cursor账号Mapper接口
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 16:51
 */
@Mapper
public interface CursorAccountMapper extends BaseMapper<CursorAccount> {
    
    /**
     * 查找可用的账号（未满额度且可用）
     */
    @Select("SELECT * FROM cursor_account WHERE is_available = 1 " +
            "AND is_quota_full = 0 ORDER BY last_used_time ASC")
    List<CursorAccount> findAvailableAccounts();
    
    /**
     * 查找第一个可用账号
     */
    @Select("SELECT * FROM cursor_account WHERE is_available = 1 " +
            "AND is_quota_full = 0 ORDER BY last_used_time ASC LIMIT 1")
    CursorAccount findFirstAvailableAccount();
    
    /**
     * 查找需要重新检查额度的账号
     */
    @Select("SELECT * FROM cursor_account WHERE is_available = 1 " +
            "AND (quota_check_time IS NULL OR quota_check_time < #{checkTime})")
    List<CursorAccount> findAccountsNeedingQuotaRecheck(@Param("checkTime") LocalDateTime checkTime);
    
    /**
     * 统计可用账号数量
     */
    @Select("SELECT COUNT(*) FROM cursor_account WHERE is_available = 1 " +
            "AND is_quota_full = 0")
    long countAvailableAccounts();
    
    /**
     * 检查邮箱是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM cursor_account WHERE email = #{email}")
    boolean existsByEmail(@Param("email") String email);
    
    /**
     * 根据授权码查找被占用的账号
     */
    @Select("SELECT * FROM cursor_account WHERE occupied_by_license_code = #{licenseCode}")
    List<CursorAccount> findByOccupiedLicenseCode(@Param("licenseCode") String licenseCode);
    
    /**
     * 统计被指定授权码占用的账号数量
     */
    @Select("SELECT COUNT(*) FROM cursor_account WHERE occupied_by_license_code = #{licenseCode}")
    long countByOccupiedLicenseCode(@Param("licenseCode") String licenseCode);
    
    /**
     * 查找所有被占用的账号
     */
    @Select("SELECT * FROM cursor_account WHERE occupied_by_license_code IS NOT NULL ORDER BY occupied_time DESC")
    List<CursorAccount> findAllOccupiedAccounts();
    
    /**
     * 根据授权码释放账号占用状态
     */
    @Update("UPDATE cursor_account SET occupied_by_license_code = NULL, occupied_time = NULL, is_available = true, updated_time = NOW() WHERE occupied_by_license_code = #{licenseCode}")
    int releaseAccountsByLicenseCode(@Param("licenseCode") String licenseCode);
}
