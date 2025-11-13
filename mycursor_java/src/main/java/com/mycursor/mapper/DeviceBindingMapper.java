package com.mycursor.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mycursor.entity.DeviceBinding;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 设备绑定Mapper接口
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 16:52
 */
@Mapper
public interface DeviceBindingMapper extends BaseMapper<DeviceBinding> {
    
    /**
     * 根据授权码和MAC地址查找绑定记录
     */
    @Select("SELECT * FROM device_binding WHERE license_code = #{licenseCode} " +
            "AND mac_address = #{macAddress} LIMIT 1")
    DeviceBinding findByLicenseCodeAndMacAddress(@Param("licenseCode") String licenseCode, 
                                               @Param("macAddress") String macAddress);
    
    /**
     * 根据授权码查找所有绑定记录
     */
    @Select("SELECT * FROM device_binding WHERE license_code = #{licenseCode}")
    List<DeviceBinding> findByLicenseCode(@Param("licenseCode") String licenseCode);
    
    /**
     * 根据MAC地址查找所有绑定记录
     */
    @Select("SELECT * FROM device_binding WHERE mac_address = #{macAddress}")
    List<DeviceBinding> findByMacAddress(@Param("macAddress") String macAddress);
    
    /**
     * 查找授权码的活跃绑定记录
     */
    @Select("SELECT * FROM device_binding WHERE license_code = #{licenseCode} " +
            "AND is_active = 1")
    List<DeviceBinding> findActiveBindingsByLicenseCode(@Param("licenseCode") String licenseCode);
    
    /**
     * 检查授权码是否已绑定到指定MAC地址
     */
    @Select("SELECT COUNT(*) > 0 FROM device_binding WHERE license_code = #{licenseCode} " +
            "AND mac_address = #{macAddress} AND is_active = 1")
    boolean existsActiveBinding(@Param("licenseCode") String licenseCode, 
                               @Param("macAddress") String macAddress);
    
    /**
     * 检查授权码是否已绑定到其他设备
     */
    @Select("SELECT COUNT(*) > 0 FROM device_binding WHERE license_code = #{licenseCode} " +
            "AND mac_address != #{macAddress} AND is_active = 1")
    boolean existsBindingToOtherDevice(@Param("licenseCode") String licenseCode, 
                                      @Param("macAddress") String macAddress);
    
    /**
     * 查询授权码今日换号次数
     * @param licenseCode 授权码
     * @return 今日换号总次数
     */
    @Select("SELECT COALESCE(SUM(switch_count_today), 0) FROM device_binding " +
            "WHERE license_code = #{licenseCode} AND last_switch_date = CURDATE()")
    int getTodaySwitchCount(@Param("licenseCode") String licenseCode);
    
    /**
     * 查询授权码的所有活跃绑定记录（用于检查换号限制）
     * @param licenseCode 授权码
     * @return 活跃的绑定记录列表
     */
    @Select("SELECT * FROM device_binding WHERE license_code = #{licenseCode} " +
            "AND (last_switch_date = CURDATE() OR last_switch_date IS NULL)")
    List<DeviceBinding> findTodayActiveBindings(@Param("licenseCode") String licenseCode);
    
    /**
     * 查询授权码最近一次换号的记录（用于时间间隔检查）
     * @param licenseCode 授权码
     * @return 最近一次换号的绑定记录
     */
    @Select("SELECT * FROM device_binding WHERE license_code = #{licenseCode} " +
            "AND last_switch_time IS NOT NULL " +
            "ORDER BY last_switch_time DESC LIMIT 1")
    DeviceBinding findLastSwitchByLicenseCode(@Param("licenseCode") String licenseCode);
}
