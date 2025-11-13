package com.mycursor.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mycursor.entity.License;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;

/**
 * 授权码Mapper接口
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 16:50
 */
@Mapper
public interface LicenseMapper extends BaseMapper<License> {
    
    /**
     * 查找有效的授权码
     * 天卡（license_type=1）：检查 expiry_time > now
     * 次卡（license_type=2）：检查 used_switches < total_switches
     */
    @Select("SELECT * FROM license WHERE license_code = #{licenseCode} " +
            "AND is_active = 1 " +
            "AND (" +
            "  (license_type = 1 AND expiry_time > #{now}) " +
            "  OR (license_type = 2 AND used_switches < total_switches)" +
            ") LIMIT 1")
    License findValidLicense(@Param("licenseCode") String licenseCode, 
                           @Param("now") LocalDateTime now);
    
    /**
     * 根据MAC地址查找绑定的授权码
     */
    @Select("SELECT * FROM license WHERE bound_mac_address = #{macAddress} LIMIT 1")
    License findByBoundMacAddress(@Param("macAddress") String macAddress);
    
    /**
     * 检查授权码是否存在且有效
     * 天卡（license_type=1）：检查 expiry_time > now
     * 次卡（license_type=2）：检查 used_switches < total_switches
     */
    @Select("SELECT COUNT(*) > 0 FROM license WHERE license_code = #{licenseCode} " +
            "AND is_active = 1 " +
            "AND (" +
            "  (license_type = 1 AND expiry_time > #{now}) " +  // 天卡：未过期
            "  OR (license_type = 2 AND used_switches < total_switches)" + // 次卡：还有剩余次数
            ")")
    boolean existsValidLicense(@Param("licenseCode") String licenseCode, 
                              @Param("now") LocalDateTime now);
    
    /**
     * 检查授权码是否存在（包括已过期的）
     */
    @Select("SELECT COUNT(*) > 0 FROM license WHERE license_code = #{licenseCode}")
    boolean existsLicense(@Param("licenseCode") String licenseCode);
}
