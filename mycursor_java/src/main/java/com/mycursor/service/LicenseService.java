package com.mycursor.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.mycursor.config.LicenseConfig;
import com.mycursor.entity.License;
import com.mycursor.entity.DeviceBinding;
import com.mycursor.mapper.LicenseMapper;
import com.mycursor.mapper.DeviceBindingMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * 授权码验证服务
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 16:41
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LicenseService {
    
    private final LicenseMapper licenseMapper;
    private final DeviceBindingMapper deviceBindingMapper;
    private final LicenseConfig licenseConfig;
    
    /**
     * 验证授权码并返回授权信息
     * 根据授权码和用户客户端mac地址，判断授权码是否可用，每个授权码只能绑定一台电脑
     */
    @Transactional
    public Map<String, Object> validateLicense(String licenseCode, String macAddress) {
        log.info("开始验证授权码: {}, MAC地址: {}", licenseCode, macAddress);
        
        // 1. 查找授权码
        QueryWrapper<License> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("license_code", licenseCode);
        License license = licenseMapper.selectOne(queryWrapper);
        if (license == null) {
            log.warn("授权码不存在: {}", licenseCode);
            throw new RuntimeException("授权码不存在");
        }
        
        // 2. 检查授权码有效性并构建响应数据
        boolean isLicenseValid = license.isValid();
        boolean isActivated = license.isActivated();
        
        Map<String, Object> licenseData = new HashMap<>();
        licenseData.put("version", "Pro");
        licenseData.put("membershipType", license.getMembershipType());
        licenseData.put("licenseType", license.getLicenseType());
        licenseData.put("licenseTypeDesc", License.LicenseType.getDescription(license.getLicenseType()));
        licenseData.put("usagePercentage", license.getUsagePercentage());
        licenseData.put("valid", isLicenseValid);
        licenseData.put("activated", isActivated);
        
        // 根据授权码类型添加不同的字段
        if (License.LicenseType.DAY_CARD.equals(license.getLicenseType())) {
            // 天卡：返回天数相关信息
            licenseData.put("totalDays", license.getTotalDays());
            licenseData.put("remainingDays", license.getRemainingDays());
        } else if (License.LicenseType.COUNT_CARD.equals(license.getLicenseType())) {
            // 次卡：返回次数相关信息
            licenseData.put("totalSwitches", license.getTotalSwitches());
            licenseData.put("usedSwitches", license.getUsedSwitches());
            licenseData.put("remainingSwitches", license.getRemainingSwitches());
        }
        
        // 处理未激活的授权码
        if (!isActivated) {
            // 天卡：未激活状态（需要首次绑定设备后开始计时）
            if (License.LicenseType.DAY_CARD.equals(license.getLicenseType())) {
                licenseData.put("status", "unactivated");
                licenseData.put("expiryTime", "待激活");
                licenseData.put("expiryDate", "待激活");
                licenseData.put("daysRemaining", license.getTotalDays());
                licenseData.put("message", "授权码将在首次绑定设备后开始计时");
                log.info("天卡授权码未激活: {}, 待绑定设备后开始计时", licenseCode);
            } 
            // 次卡：直接显示为有效（不需要激活过程）
            else {
                licenseData.put("status", "valid");
                licenseData.put("message", "有效次卡，剩余 " + license.getTotalSwitches() + " 次换号机会");
                log.info("次卡授权码有效: {}, 可换号次数: {}", licenseCode, license.getTotalSwitches());
            }
        } else {
            // 已激活的授权码
            if (License.LicenseType.DAY_CARD.equals(license.getLicenseType())) {
                // 天卡：显示过期时间
                licenseData.put("expiryTime", license.getExpiryTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                licenseData.put("expiryDate", license.getExpiryTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                licenseData.put("daysRemaining", license.getRemainingDays());
            } else {
                // 次卡：显示使用情况
                licenseData.put("message", "已使用 " + license.getUsedSwitches() + " 次，剩余 " + license.getRemainingSwitches() + " 次换号机会");
            }
            
            if (license.getFirstBindTime() != null) {
                licenseData.put("firstBindTime", license.getFirstBindTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            }
        }
        
        if (!isLicenseValid && isActivated) {
            // 授权码已激活但已失效
            if (License.LicenseType.DAY_CARD.equals(license.getLicenseType())) {
                log.warn("天卡授权码已失效: {}, 过期时间: {}", licenseCode, license.getExpiryTime());
            } else {
                log.warn("次卡授权码已失效: {}, 已用完所有次数 ({}/{})", 
                    licenseCode, license.getUsedSwitches(), license.getTotalSwitches());
            }
            licenseData.put("status", "expired");
            return licenseData;
        }
        
        // 3. 检查设备绑定（仅在授权码有效时检查）
        if (!validateDeviceBinding(license, macAddress)) {
            log.warn("授权码已绑定到其他设备: {}", licenseCode);
            throw new RuntimeException("授权码已绑定到其他设备");
        }
        
        // 3.5 检查换号次数限制（如果启用）
        if (licenseConfig.getDeviceSwitch().getEnabled()) {
            if (!checkSwitchLimit(licenseCode, macAddress)) {
                int maxSwitches = licenseConfig.getDeviceSwitch().getMaxDailySwitches();
                int todayCount = deviceBindingMapper.getTodaySwitchCount(licenseCode);
                log.warn("授权码今日换号次数已达上限: {}, 今日次数: {}, 上限: {}", 
                        licenseCode, todayCount, maxSwitches);
                throw new RuntimeException(String.format(
                    "授权码今日换号次数已达上限！今日已换号 %d 次，每日最多允许 %d 次。请明天再试或联系客服。", 
                    todayCount, maxSwitches));
            }
        }
        
        // 4. 创建或更新设备绑定记录（可能会激活授权码）
        createOrUpdateDeviceBinding(licenseCode, macAddress);
        
        // 5. 重新获取授权码信息（因为可能在绑定过程中被激活）
        license = licenseMapper.selectOne(queryWrapper);
        
        // 6. 更新返回数据
        if (license.isActivated()) {
            licenseData.put("activated", true);
            licenseData.put("usagePercentage", license.getUsagePercentage());
            licenseData.put("status", "valid");
            
            if (License.LicenseType.DAY_CARD.equals(license.getLicenseType())) {
                // 天卡：更新过期时间和剩余天数
                if (license.getExpiryTime() != null) {
                    licenseData.put("expiryTime", license.getExpiryTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                    licenseData.put("expiryDate", license.getExpiryTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                }
                licenseData.put("daysRemaining", license.getRemainingDays());
                licenseData.put("totalDays", license.getTotalDays());
                log.info("天卡授权码验证成功: {}, 剩余天数: {}", licenseCode, license.getRemainingDays());
            } else {
                // 次卡：更新使用次数
                licenseData.put("totalSwitches", license.getTotalSwitches());
                licenseData.put("usedSwitches", license.getUsedSwitches());
                licenseData.put("remainingSwitches", license.getRemainingSwitches());
                licenseData.put("message", "已使用 " + license.getUsedSwitches() + " 次，剩余 " + license.getRemainingSwitches() + " 次换号机会");
                log.info("次卡授权码验证成功: {}, 剩余次数: {}/{}", 
                    licenseCode, license.getRemainingSwitches(), license.getTotalSwitches());
            }
            
            if (license.getFirstBindTime() != null) {
                licenseData.put("firstBindTime", license.getFirstBindTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            }
        }
        
        return licenseData;
    }
    
    /**
     * 验证设备绑定
     */
    private boolean validateDeviceBinding(License license, String macAddress) {
        // 如果授权码还没有绑定设备，可以绑定
        if (license.getBoundMacAddress() == null) {
            return true;
        }
        
        // 如果已绑定，检查是否绑定到当前设备
        if (license.getBoundMacAddress().equals(macAddress)) {
            return true;
        }
        
        // 检查数据库中的绑定记录
        return !deviceBindingMapper.existsBindingToOtherDevice(license.getLicenseCode(), macAddress);
    }
    
    /**
     * 检查换号次数限制（原始方法，不包含时间间隔检查）
     * @param licenseCode 授权码
     * @param macAddress 当前MAC地址
     * @return true-可以换号，false-已达上限
     */
    private boolean checkSwitchLimit(String licenseCode, String macAddress) {
        // 检查是否是当前已绑定的设备（不算换号）
        DeviceBinding currentBinding = deviceBindingMapper.findByLicenseCodeAndMacAddress(licenseCode, macAddress);
        if (currentBinding != null && currentBinding.getIsActive()) {
            // 当前设备已绑定且活跃，不算换号
            return true;
        }
        
        // 获取今日换号次数
        int todaySwitchCount = deviceBindingMapper.getTodaySwitchCount(licenseCode);
        int maxDailySwitches = licenseConfig.getDeviceSwitch().getMaxDailySwitches();
        
        log.info("检查换号限制: 授权码={}, 今日已换号={}次, 上限={}次", 
                licenseCode, todaySwitchCount, maxDailySwitches);
        
        // 检查是否超过限制
        return todaySwitchCount < maxDailySwitches;
    }
    
    /**
     * 检查换号时间间隔限制（仅用于获取账号接口）
     * @param licenseCode 授权码
     * @throws RuntimeException 如果时间间隔不足
     */
    private void checkSwitchTimeInterval(String licenseCode) {
        // 获取最小换号间隔配置（分钟）
        Integer minIntervalMinutes = licenseConfig.getDeviceSwitch().getMinSwitchIntervalMinutes();
        if (minIntervalMinutes == null || minIntervalMinutes <= 0) {
            // 如果没有配置或配置为0，不限制时间间隔
            log.debug("换号时间间隔限制未启用");
            return;
        }
        
        // 查询该授权码最近一次换号的时间
        DeviceBinding lastSwitch = deviceBindingMapper.findLastSwitchByLicenseCode(licenseCode);
        
        if (lastSwitch == null || lastSwitch.getLastSwitchTime() == null) {
            // 没有换号记录，允许换号
            log.debug("授权码 {} 没有换号记录，允许换号", licenseCode);
            return;
        }
        
        // 计算距离上次换号的时间（分钟）
        LocalDateTime lastSwitchTime = lastSwitch.getLastSwitchTime();
        LocalDateTime now = LocalDateTime.now();
        long minutesSinceLastSwitch = java.time.Duration.between(lastSwitchTime, now).toMinutes();
        
        log.info("检查换号时间间隔: 授权码={}, 上次换号时间={}, 距今={}分钟, 最小间隔={}分钟", 
                licenseCode, 
                lastSwitchTime.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                minutesSinceLastSwitch, 
                minIntervalMinutes);
        
        if (minutesSinceLastSwitch < minIntervalMinutes) {
            // 时间间隔不足
            long remainingMinutes = minIntervalMinutes - minutesSinceLastSwitch;
            log.warn("换号时间间隔不足: 授权码={}, 距上次换号={}分钟, 还需等待={}分钟", 
                    licenseCode, minutesSinceLastSwitch, remainingMinutes);
            throw new RuntimeException(String.format(
                "换号操作过于频繁！每次换号需间隔 %d 分钟以上。上次换号时间: %s，距今 %d 分钟，还需等待 %d 分钟。", 
                minIntervalMinutes,
                lastSwitchTime.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                minutesSinceLastSwitch,
                remainingMinutes));
        }
    }
    
    /**
     * 创建或更新设备绑定记录
     */
    private void createOrUpdateDeviceBinding(String licenseCode, String macAddress) {
        DeviceBinding binding = deviceBindingMapper.findByLicenseCodeAndMacAddress(licenseCode, macAddress);
        
        // 获取授权码信息
        QueryWrapper<License> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("license_code", licenseCode);
        License license = licenseMapper.selectOne(queryWrapper);
        
        if (binding != null) {
            // 更新现有绑定记录
            binding.updateLastActiveTime();
            if (!binding.getIsActive()) {
                binding.activate();
            }
            deviceBindingMapper.updateById(binding);
            log.info("更新设备绑定记录: {} -> {}", licenseCode, macAddress);
        } else {
            // 创建新的绑定记录（换号操作）
            LocalDateTime bindTime = LocalDateTime.now();
            DeviceBinding newBinding = new DeviceBinding();
            newBinding.setLicenseCode(licenseCode);
            newBinding.setMacAddress(macAddress);
            newBinding.setDeviceName("Unknown Device");
            newBinding.setIsActive(true);
            newBinding.setFirstBindTime(bindTime);
            newBinding.setLastActiveTime(bindTime);
            
            // 如果启用了换号限制，记录换号操作
            if (licenseConfig.getDeviceSwitch().getEnabled()) {
                newBinding.recordSwitch();
                log.info("创建设备绑定记录（换号操作）: {} -> {}, 今日第{}次换号", 
                        licenseCode, macAddress, newBinding.getSwitchCountToday());
            } else {
                log.info("创建设备绑定记录: {} -> {}", licenseCode, macAddress);
            }
            
            deviceBindingMapper.insert(newBinding);
            
            // 更新License表中的绑定信息
            if (license != null) {
                // 首次绑定时，激活授权码并开始计时
                if (license.getFirstBindTime() == null) {
                    license.activate(bindTime);
                    
                    // 根据授权码类型输出不同的日志
                    if (License.LicenseType.DAY_CARD.equals(license.getLicenseType())) {
                        log.info("激活天卡授权码: {}, 绑定时间: {}, 过期时间: {}", 
                                licenseCode, 
                                bindTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                                license.getExpiryTime() != null ? 
                                    license.getExpiryTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "未设置");
                    } else {
                        log.info("激活次卡授权码: {}, 绑定时间: {}, 可用次数: {}", 
                                licenseCode, 
                                bindTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                                license.getTotalSwitches());
                    }
                }
                
                // 更新绑定的MAC地址
                license.bindToMac(macAddress);
                licenseMapper.updateById(license);
                
                // 禁用其他设备的绑定记录
                List<DeviceBinding> otherBindings = deviceBindingMapper.findByLicenseCode(licenseCode);
                for (DeviceBinding otherBinding : otherBindings) {
                    if (!otherBinding.getMacAddress().equals(macAddress) && otherBinding.getIsActive()) {
                        otherBinding.deactivate();
                        deviceBindingMapper.updateById(otherBinding);
                        log.info("禁用旧设备绑定: {} -> {}", licenseCode, otherBinding.getMacAddress());
                    }
                }
            }
        }
    }
    
    /**
     * 检查授权码是否存在且有效
     */
    public boolean isLicenseValid(String licenseCode) {
        return licenseMapper.existsValidLicense(licenseCode, LocalDateTime.now());
    }
    
    /**
     * 检查换号限制（供外部调用，用于账号获取接口）
     * 换号 = 调用获取账号接口（getAccountByCode）
     * 包含：换号时间间隔限制 + 每日换号次数限制
     * 
     * @param licenseCode 授权码
     * @param macAddress MAC地址
     * @throws RuntimeException 如果不满足换号条件
     */
    public void checkAccountSwitchLimit(String licenseCode, String macAddress) {
        // 如果换号限制功能未启用，直接返回
        if (!licenseConfig.getDeviceSwitch().getEnabled()) {
            log.debug("换号限制功能未启用，跳过检查");
            return;
        }
        
        log.info("🔍 开始检查换号限制 - 授权码: {}, MAC: {}", licenseCode, macAddress);
        
        // 1. 🆕 检查换号时间间隔限制（每次调用获取账号接口都要检查）
        checkSwitchTimeInterval(licenseCode);
        
        // 2. 检查每日换号次数限制
        int todaySwitchCount = deviceBindingMapper.getTodaySwitchCount(licenseCode);
        int maxDailySwitches = licenseConfig.getDeviceSwitch().getMaxDailySwitches();
        
        log.info("检查每日换号次数 - 授权码: {}, 今日已换号: {}次, 上限: {}次", 
                licenseCode, todaySwitchCount, maxDailySwitches);
        
        if (todaySwitchCount >= maxDailySwitches) {
            log.warn("授权码今日换号次数已达上限: {}, 今日次数: {}, 上限: {}", 
                    licenseCode, todaySwitchCount, maxDailySwitches);
            throw new RuntimeException(String.format(
                "授权码今日换号次数已达上限！今日已换号 %d 次，每日最多允许 %d 次。请明天再试或联系客服。", 
                todaySwitchCount, maxDailySwitches));
        }
        
        log.info("✅ 换号限制检查通过");
    }
    
    /**
     * 记录换号操作（在成功获取新账号后调用）
     * 换号 = 调用获取账号接口
     * 
     * @param licenseCode 授权码
     * @param macAddress MAC地址
     */
    public void recordAccountSwitch(String licenseCode, String macAddress) {
        // 如果换号限制功能未启用，不记录
        if (!licenseConfig.getDeviceSwitch().getEnabled()) {
            return;
        }
        
        log.info("📝 记录换号操作 - 授权码: {}, MAC: {}", licenseCode, macAddress);
        
        LocalDateTime now = LocalDateTime.now();
        
        // 查找该授权码最近一次的换号记录（任意设备）
        DeviceBinding lastSwitch = deviceBindingMapper.findLastSwitchByLicenseCode(licenseCode);
        
        // 查找当前设备的绑定记录
        DeviceBinding currentBinding = deviceBindingMapper.findByLicenseCodeAndMacAddress(licenseCode, macAddress);
        
        if (currentBinding == null) {
            // 创建新的绑定记录
            DeviceBinding newBinding = new DeviceBinding();
            newBinding.setLicenseCode(licenseCode);
            newBinding.setMacAddress(macAddress);
            newBinding.setIsActive(true);
            newBinding.setFirstBindTime(now);
            newBinding.setLastActiveTime(now);
            newBinding.recordSwitch();  // 记录换号时间
            deviceBindingMapper.insert(newBinding);
            log.info("✅ 创建新设备绑定并记录换号时间: {}", now.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        } else {
            // 更新现有绑定记录的换号时间
            currentBinding.recordSwitch();  // 记录换号时间
            currentBinding.setLastActiveTime(now);
            currentBinding.setIsActive(true);
            deviceBindingMapper.updateById(currentBinding);
            log.info("✅ 更新设备绑定并记录换号时间: {}", now.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
    }
    
    /**
     * 生成新的授权码（天卡模式）
     * @param days 有效天数
     * @return 生成的授权码信息
     */
    @Transactional
    public Map<String, Object> generateLicense(int days) {
        return generateLicense(License.LicenseType.DAY_CARD, days, null);
    }
    
    /**
     * 生成新的授权码（支持天卡和次卡两种模式）
     * @param licenseType 授权码类型：1=天卡, 2=次卡
     * @param daysOrSwitches 天卡：有效天数；次卡：换号次数
     * @param description 授权码描述（可选）
     * @return 生成的授权码信息
     */
    @Transactional
    public Map<String, Object> generateLicense(Integer licenseType, int daysOrSwitches, String description) {
        log.info("开始生成授权码 - 类型: {}, 数值: {}", licenseType, daysOrSwitches);
        
        // 验证授权码类型
        if (!License.LicenseType.DAY_CARD.equals(licenseType) && 
            !License.LicenseType.COUNT_CARD.equals(licenseType)) {
            throw new RuntimeException("无效的授权码类型: " + licenseType);
        }
        
        // 生成16位不重复的授权码
        String licenseCode = generateUniqueLicenseCode();
        
        // 创建授权码实体（不设置过期时间，等待首次绑定时激活）
        License license = new License();
        license.setLicenseCode(licenseCode);
        license.setIsActive(true);
        license.setExpiryTime(null); // 首次绑定时才设置
        license.setFirstBindTime(null); // 首次绑定时才设置
        license.setMembershipType("free_trial");
        license.setLicenseType(licenseType);
        license.setCreatedTime(LocalDateTime.now());
        license.setUpdatedTime(LocalDateTime.now());
        
        // 根据类型设置相应的字段
        if (License.LicenseType.DAY_CARD.equals(licenseType)) {
            // 天卡：设置有效天数
            license.setTotalDays(daysOrSwitches);
            license.setTotalSwitches(null);
            license.setUsedSwitches(0);
            log.info("生成天卡授权码: {}, 有效天数: {}", licenseCode, daysOrSwitches);
        } else {
            // 次卡：设置换号次数
            license.setTotalDays(null);
            license.setTotalSwitches(daysOrSwitches);
            license.setUsedSwitches(0);
            log.info("生成次卡授权码: {}, 可换号次数: {}", licenseCode, daysOrSwitches);
        }
        
        // 保存到数据库
        licenseMapper.insert(license);
        
        log.info("成功生成授权码: {}, 类型: {}, 状态: 待激活（首次绑定设备后开始计时）", 
                licenseCode, licenseType);
        
        // 构建返回数据
        Map<String, Object> result = new HashMap<>();
        result.put("licenseCode", licenseCode);
        result.put("licenseType", licenseType);
        result.put("licenseTypeDesc", License.LicenseType.getDescription(licenseType));
        result.put("membershipType", "Pro");
        result.put("isActive", true);
        result.put("activated", false); // 标记为未激活
        result.put("createdTime", license.getCreatedTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        if (License.LicenseType.DAY_CARD.equals(licenseType)) {
            result.put("totalDays", daysOrSwitches);
            result.put("expiryTime", "待激活"); // 未激活状态
        } else {
            result.put("totalSwitches", daysOrSwitches);
            result.put("usedSwitches", 0);
            result.put("remainingSwitches", daysOrSwitches);
        }
        
        return result;
    }
    
    /**
     * 生成16位不重复的授权码
     */
    private String generateUniqueLicenseCode() {
        Random random = new Random();
        String licenseCode;
        int attempts = 0;
        int maxAttempts = 100; // 最大尝试次数，避免无限循环
        
        do {
            // 生成16位随机字符串（数字+大写字母）
            StringBuilder sb = new StringBuilder();
            String chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            
            for (int i = 0; i < 16; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            
            licenseCode = sb.toString();
            attempts++;
            
            if (attempts >= maxAttempts) {
                throw new RuntimeException("生成唯一授权码失败，请重试");
            }
            
        } while (licenseMapper.existsLicense(licenseCode)); // 检查是否已存在
        
        return licenseCode;
    }
}
