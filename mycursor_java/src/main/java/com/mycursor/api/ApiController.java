package com.mycursor.api;

import com.mycursor.res.ResponseModel;
import com.mycursor.service.LicenseService;
import com.mycursor.service.AccountService;
import com.mycursor.service.CursorUsageService;
import com.mycursor.service.SystemNoticeService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 15:45
 */
@Slf4j
@RestController
@CrossOrigin(origins = "*") // 允许跨域请求
@Api(tags = "Cursor授权管理", description = "提供授权码验证和账号获取相关API")
@RequiredArgsConstructor
public class ApiController {
    
    private final LicenseService licenseService;
    private final AccountService accountService;
    private final CursorUsageService cursorUsageService;
    private final SystemNoticeService systemNoticeService;
    private final com.mycursor.config.VersionConfig versionConfig;
    @ApiOperation(value = "验证授权码", notes = "根据授权码和MAC地址验证授权码的有效性并返回授权信息")
    @GetMapping("/getInfoByCode/{code}/{mac}")
    public ResponseModel getInfoByCode(
            @ApiParam(value = "授权码", required = true, example = "VALID_CODE_123") 
            @PathVariable(value = "code") String code, 
            @ApiParam(value = "设备MAC地址", required = true, example = "00:11:22:33:44:55") 
            @PathVariable(value = "mac") String mac) {
        
        try {
            log.info("收到授权码验证请求 - 授权码: {}, MAC: {}", code, mac);
            
        //根据授权码和用户客户端mac地址，判断授权码是否可用，每个授权码只能绑定一台电脑
            Map<String, Object> licenseData = licenseService.validateLicense(code, mac);
            
            log.info("授权码验证成功 - 授权码: {}", code);
            return ResponseModel.success("授权码验证成功", licenseData);
            
        } catch (Exception e) {
            e.printStackTrace();
            log.error("授权码验证失败 - 授权码: {}, 错误: {}", code, e.getMessage());
            return ResponseModel.fail(e.getMessage());
        }
    }

    @ApiOperation(value = "获取新账号", notes = "根据授权码、MAC地址和当前账号获取一个新的Cursor账号")
    @GetMapping("/getAccountByCode/{code}/{mac}/{currentAccount}")
    public ResponseModel getAccountByCode(
            @ApiParam(value = "授权码", required = true, example = "VALID_CODE_123") 
            @PathVariable(value = "code") String code,
            @ApiParam(value = "设备MAC地址", required = true, example = "00:11:22:33:44:55") 
            @PathVariable(value = "mac") String mac,
            @ApiParam(value = "当前账号邮箱", required = true, example = "current@example.com") 
            @PathVariable(value = "currentAccount") String currentAccount) {
        
        try {
            log.info("收到获取账号请求 - 授权码: {}, MAC: {}, 当前账号: {}", code, mac, currentAccount);
            
        //根据授权码和用户客户端mac地址，先判断请求合法性
            if (!licenseService.isLicenseValid(code)) {
                log.warn("授权码无效: {}", code);
                return ResponseModel.fail("授权码无效或已过期");
            }
            
            // 🆕 检查换号时间间隔限制（如果启用）
            licenseService.checkAccountSwitchLimit(code, mac);

        //判断当前账号currentAccount（这是个email）是否存在于本地数据库，如果存在，判断额度是否已用完，如果没用完不给获取账号
        //从本地数据库获取一个账号，在这里请求接口判断一下是否为满额度可用账号
            Map<String, Object> accountData = accountService.getAccountByCode(code, mac, currentAccount);
            
            // 🆕 记录换号操作（在成功获取账号后）
            licenseService.recordAccountSwitch(code, mac);

        //返回账号给前端
            log.info("成功分配账号 - 邮箱: {}", accountData.get("email"));
            return ResponseModel.success("获取新账号成功", accountData);
            
        } catch (Exception e) {
            log.error("获取账号失败 - 授权码: {}, 错误: {}", code, e.getMessage());
            return ResponseModel.fail(e.getMessage());
        }
    }
    
    @ApiOperation(value = "检测账号使用情况", notes = "通过SessionToken检测账号的真实使用情况")
    @GetMapping("/checkUsage/{sessionToken}")
    public ResponseModel checkAccountUsage(
            @ApiParam(value = "SessionToken", required = true, example = "user_xxx%3A%3Aeyj...")
            @PathVariable(value = "sessionToken") String sessionToken) {

        log.info("收到检测账号使用情况请求, SessionToken: {}...", sessionToken.substring(0, Math.min(50, sessionToken.length())));

        try {
            Map<String, Object> usageInfo = cursorUsageService.checkAccountUsage(sessionToken);
            log.info("账号使用情况检测成功");
            return ResponseModel.success("检测成功", usageInfo);

        } catch (Exception e) {
            log.error("检测账号使用情况失败: {}", e.getMessage(), e);
            return ResponseModel.fail("检测失败: " + e.getMessage());
        }
    }

    @ApiOperation(value = "导入账号数据", notes = "通过JSON文件批量导入Cursor账号数据，支持新增和更新")
    @PostMapping(value = "/importAccounts", consumes = "multipart/form-data")
    public ResponseModel importAccounts(
            @ApiParam(value = "账号数据JSON文件", required = true)
            @RequestParam("file") MultipartFile file) {

        log.info("收到账号导入请求，文件名: {}, 大小: {} bytes", file.getOriginalFilename(), file.getSize());

        try {
            // 检查文件
            if (file.isEmpty()) {
                return ResponseModel.fail("上传文件不能为空");
            }

            // 检查文件类型
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".json"))) {
                return ResponseModel.fail("只支持JSON文件格式");
            }

            // 读取文件内容
            String jsonContent = new String(file.getBytes(), "UTF-8");
            log.debug("文件内容长度: {}", jsonContent.length());

            // 解析JSON
            ObjectMapper objectMapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> accountsData = objectMapper.readValue(jsonContent, List.class);

            log.info("解析JSON成功，账号数量: {}", accountsData.size());

            // 导入账号数据
            Map<String, Object> importResult = accountService.importAccounts(accountsData);
            log.info("账号导入成功");
            return ResponseModel.success("导入成功", importResult);

        } catch (Exception e) {
            log.error("账号导入失败: {}", e.getMessage(), e);
            return ResponseModel.fail("导入失败: " + e.getMessage());
        }
    }

    @ApiOperation(value = "通过JSON文本导入账号", notes = "通过输入框直接输入JSON文本批量导入Cursor账号数据")
    @PostMapping("/importAccountsFromJson")
    public ResponseModel importAccountsFromJson(@RequestBody List<Map<String, Object>> accountsData) {
        
        log.info("收到JSON文本导入账号请求，账号数量: {}", accountsData.size());
        
        try {
            // 检查数据
            if (accountsData == null || accountsData.isEmpty()) {
                return ResponseModel.fail("账号数据不能为空");
            }
            
            log.info("接收到账号数据，数量: {}", accountsData.size());
            
            // 转换数据格式（适配新的字段名）
            List<Map<String, Object>> convertedData = convertJsonAccountData(accountsData);
            
            // 导入账号数据
            Map<String, Object> importResult = accountService.importAccounts(convertedData);
            log.info("JSON文本导入账号成功");
            return ResponseModel.success("导入成功", importResult);
            
        } catch (Exception e) {
            log.error("JSON文本导入账号失败: {}", e.getMessage(), e);
            return ResponseModel.fail("导入失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "通过JSON字符串导入账号", notes = "通过包装的JSON字符串导入账号数据")
    @PostMapping("/importAccountsFromJsonString")
    public ResponseModel importAccountsFromJsonString(@RequestBody ImportJsonRequest request) {
        
        log.info("收到JSON字符串导入账号请求");
        
        try {
            // 检查JSON内容
            if (request.getJsonData() == null || request.getJsonData().trim().isEmpty()) {
                return ResponseModel.fail("JSON数据不能为空");
            }
            
            String jsonContent = request.getJsonData().trim();
            log.info("JSON内容长度: {}", jsonContent.length());
            
            // 解析JSON
            ObjectMapper objectMapper = new ObjectMapper();
            List<Map<String, Object>> accountsData;
            
            try {
                // 尝试解析为数组
                if (jsonContent.startsWith("[")) {
                    accountsData = objectMapper.readValue(jsonContent, List.class);
                } else {
                    // 单个对象，包装成数组
                    @SuppressWarnings("unchecked")
                    Map<String, Object> singleAccount = objectMapper.readValue(jsonContent, Map.class);
                    accountsData = new ArrayList<>();
                    accountsData.add(singleAccount);
                }
            } catch (Exception e) {
                return ResponseModel.fail("JSON格式错误: " + e.getMessage());
            }
            
            log.info("解析JSON成功，账号数量: {}", accountsData.size());
            
            // 转换数据格式（适配新的字段名）
            List<Map<String, Object>> convertedData = convertJsonAccountData(accountsData);
            
            // 导入账号数据
            Map<String, Object> importResult = accountService.importAccounts(convertedData);
            log.info("JSON字符串导入账号成功");
            return ResponseModel.success("导入成功", importResult);
            
        } catch (Exception e) {
            log.error("JSON字符串导入账号失败: {}", e.getMessage(), e);
            return ResponseModel.fail("导入失败: " + e.getMessage());
        }
    }
    
    /**
     * 转换JSON账号数据格式
     * 将新格式的字段名转换为系统内部使用的字段名
     */
    private List<Map<String, Object>> convertJsonAccountData(List<Map<String, Object>> originalData) {
        List<Map<String, Object>> convertedData = new ArrayList<>();
        
        for (Map<String, Object> original : originalData) {
            Map<String, Object> converted = new HashMap<>();
            
            // 复制email字段
            converted.put("email", original.get("email"));
            
            // 创建auth_info对象来包装认证信息
            Map<String, Object> authInfo = new HashMap<>();
            if (original.containsKey("WorkosCursorSessionToken")) {
                authInfo.put("WorkosCursorSessionToken", original.get("WorkosCursorSessionToken"));
            }
            
            // 如果有认证信息，添加到converted中
            if (!authInfo.isEmpty()) {
                converted.put("auth_info", authInfo);
            }
            
            // registration_time -> register_time (注意：AccountService中使用的是register_time)
            if (original.containsKey("registration_time")) {
                converted.put("register_time", original.get("registration_time"));
            }
            
            // 设置默认的sign_up_type
            converted.put("sign_up_type", "Auth0");
            
            // 复制其他可能存在的字段
            for (Map.Entry<String, Object> entry : original.entrySet()) {
                String key = entry.getKey();
                if (!key.equals("WorkosCursorSessionToken") && 
                    !key.equals("registration_time") && 
                    !key.equals("email")) {
                    converted.put(key, entry.getValue());
                }
            }
            
            convertedData.add(converted);
        }
        
        return convertedData;
    }
    
    /**
     * JSON导入请求类
     */
    public static class ImportJsonRequest {
        private String jsonData;
        
        public String getJsonData() {
            return jsonData;
        }
        
        public void setJsonData(String jsonData) {
            this.jsonData = jsonData;
        }
    }
    
    @ApiOperation(value = "查询授权码占用的账号", notes = "根据授权码查询被该授权码占用的所有账号")
    @GetMapping("/getAccountsByLicense/{licenseCode}")
    public ResponseModel getAccountsByLicense(
            @ApiParam(value = "授权码", required = true, example = "VALID_CODE_123")
            @PathVariable(value = "licenseCode") String licenseCode) {
        
        log.info("收到查询授权码占用账号请求 - 授权码: {}", licenseCode);
        
        try {
            // 检查授权码是否有效
            if (!licenseService.isLicenseValid(licenseCode)) {
                log.warn("授权码无效: {}", licenseCode);
                return ResponseModel.fail("授权码无效或已过期");
            }
            
            // 查询被该授权码占用的账号
            Map<String, Object> accountsInfo = accountService.getAccountsByLicenseCode(licenseCode);
            
            log.info("成功查询授权码占用账号 - 授权码: {}, 账号数量: {}", 
                licenseCode, accountsInfo.get("totalCount"));
            
            return ResponseModel.success("查询成功", accountsInfo);
            
        } catch (Exception e) {
            log.error("查询授权码占用账号失败 - 授权码: {}, 错误: {}", licenseCode, e.getMessage());
            return ResponseModel.fail("查询失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "获取账号使用统计", notes = "获取所有账号的使用情况统计")
    @GetMapping("/getAccountUsageStats")
    public ResponseModel getAccountUsageStats() {
        
        log.info("收到获取账号使用统计请求");
        
        try {
            Map<String, Object> stats = accountService.getAccountUsageStats();
            
            log.info("成功获取账号使用统计");
            return ResponseModel.success("获取统计成功", stats);
            
        } catch (Exception e) {
            log.error("获取账号使用统计失败: {}", e.getMessage());
            return ResponseModel.fail("获取统计失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "释放授权码占用的账号", notes = "释放指定授权码占用的所有账号，使其重新可用")
    @PostMapping("/releaseAccountsByLicense/{licenseCode}")
    public ResponseModel releaseAccountsByLicense(
            @ApiParam(value = "授权码", required = true, example = "VALID_CODE_123")
            @PathVariable(value = "licenseCode") String licenseCode) {
        
        log.info("收到释放授权码占用账号请求 - 授权码: {}", licenseCode);
        
        try {
            // 检查授权码是否有效
            if (!licenseService.isLicenseValid(licenseCode)) {
                log.warn("授权码无效: {}", licenseCode);
                return ResponseModel.fail("授权码无效或已过期");
            }
            
            // 释放被该授权码占用的账号
            Map<String, Object> releaseResult = accountService.releaseAccountsByLicenseCode(licenseCode);
            
            log.info("成功释放授权码占用账号 - 授权码: {}, 释放数量: {}", 
                licenseCode, releaseResult.get("releasedCount"));
            
            return ResponseModel.success("释放成功", releaseResult);
            
        } catch (Exception e) {
            log.error("释放授权码占用账号失败 - 授权码: {}, 错误: {}", licenseCode, e.getMessage());
            return ResponseModel.fail("释放失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "生成新授权码（天卡）", notes = "根据指定天数生成一个新的16位天卡授权码")
    @PostMapping("/generateLicense/{days}")
    public ResponseModel generateLicense(
            @ApiParam(value = "有效天数", required = true, example = "30")
            @PathVariable(value = "days") int days) {
        
        log.info("收到生成天卡授权码请求 - 有效天数: {}", days);
        
        try {
            // 验证天数参数
            if (days <= 0) {
                return ResponseModel.fail("有效天数必须大于0");
            }
            
            if (days > 3650) { // 限制最大10年
                return ResponseModel.fail("有效天数不能超过3650天（10年）");
            }
            
            // 生成天卡授权码
            Map<String, Object> licenseInfo = licenseService.generateLicense(days);
            
            log.info("成功生成天卡授权码 - 授权码: {}, 有效天数: {}", 
                licenseInfo.get("licenseCode"), days);
            
            return ResponseModel.success("天卡授权码生成成功", licenseInfo);
            
        } catch (Exception e) {
            log.error("生成天卡授权码失败 - 有效天数: {}, 错误: {}", days, e.getMessage());
            return ResponseModel.fail("生成失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "生成新授权码（支持天卡和次卡）", notes = "根据指定类型和数值生成一个新的16位授权码")
    @GetMapping("/generateLicenseV2/{licenseType}/{value}")
    public ResponseModel generateLicenseV2(
            @ApiParam(value = "授权码类型：1=天卡, 2=次卡", required = true, example = "2")
            @PathVariable(value = "licenseType") int licenseType,
            @ApiParam(value = "天卡：有效天数；次卡：换号次数", required = true, example = "5")
            @PathVariable(value = "value") int value) {
        
        try {
            log.info("收到生成授权码请求 - 类型: {}, 数值: {}", licenseType, value);
            
            // 验证参数
            if (value <= 0) {
                return ResponseModel.fail("数值必须大于0");
            }
            
            // 验证授权码类型
            if (licenseType != 1 && licenseType != 2) {
                return ResponseModel.fail("无效的授权码类型，只支持 1=天卡, 2=次卡");
            }
            
            // 根据类型验证数值范围
            if (licenseType == 1) {
                if (value > 3650) { // 限制最大10年
                    return ResponseModel.fail("天卡有效天数不能超过3650天（10年）");
                }
            } else if (licenseType == 2) {
                if (value > 1000) { // 限制最大1000次
                    return ResponseModel.fail("次卡换号次数不能超过1000次");
                }
            }
            
            // 生成授权码
            Map<String, Object> licenseInfo = licenseService.generateLicense(licenseType, value, null);
            
            log.info("成功生成授权码 - 授权码: {}, 类型: {}, 数值: {}", 
                licenseInfo.get("licenseCode"), licenseType, value);
            
            return ResponseModel.success("授权码生成成功", licenseInfo);
            
        } catch (Exception e) {
            log.error("生成授权码失败 - 错误: {}", e.getMessage());
            return ResponseModel.fail("生成失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "获取系统公告", notes = "获取当前有效的系统公告列表")
    @GetMapping("/getSystemNotices")
    public ResponseModel getSystemNotices() {
        
        log.info("收到获取系统公告请求");
        
        try {
            Map<String, Object> notices = systemNoticeService.getActiveNotices();
            
            log.info("成功获取系统公告");
            return ResponseModel.success("获取成功", notices);
            
        } catch (Exception e) {
            log.error("获取系统公告失败: {}", e.getMessage());
            return ResponseModel.fail("获取失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "获取指定类型的公告", notes = "获取指定类型的系统公告")
    @GetMapping("/getNoticesByType/{noticeType}")
    public ResponseModel getNoticesByType(
            @ApiParam(value = "公告类型", required = true, example = "warning")
            @PathVariable(value = "noticeType") String noticeType) {
        
        log.info("收到获取{}类型公告请求", noticeType);
        
        try {
            Map<String, Object> notices = systemNoticeService.getNoticesByType(noticeType);
            
            log.info("成功获取{}类型公告", noticeType);
            return ResponseModel.success("获取成功", notices);
            
        } catch (Exception e) {
            log.error("获取{}类型公告失败: {}", noticeType, e.getMessage());
            return ResponseModel.fail("获取失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "更新所有账号的订阅状态", notes = "批量更新所有账号的订阅状态（通过 Cursor Stripe API）")
    @PostMapping("/updateAllMembershipStatus")
    public ResponseModel updateAllMembershipStatus() {
        
        log.info("🔄 收到批量更新订阅状态请求");
        
        try {
            Map<String, Object> updateResult = accountService.updateAllMembershipStatus();
            
            log.info("✅ 批量更新订阅状态完成");
            return ResponseModel.success("更新成功", updateResult);
            
        } catch (Exception e) {
            log.error("❌ 批量更新订阅状态失败: {}", e.getMessage(), e);
            return ResponseModel.fail("更新失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "更新单个账号的订阅状态", notes = "更新指定邮箱账号的订阅状态")
    @PostMapping("/updateMembershipStatus/{email}")
    public ResponseModel updateSingleMembershipStatus(
            @ApiParam(value = "账号邮箱", required = true, example = "test@example.com")
            @PathVariable(value = "email") String email) {
        
        log.info("🔄 收到更新账号 {} 订阅状态请求", email);
        
        try {
            Map<String, Object> updateResult = accountService.updateSingleMembershipStatus(email);
            
            log.info("✅ 账号 {} 订阅状态更新完成", email);
            return ResponseModel.success("更新成功", updateResult);
            
        } catch (Exception e) {
            log.error("❌ 账号 {} 订阅状态更新失败: {}", email, e.getMessage());
            return ResponseModel.fail("更新失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "获取订阅状态统计", notes = "获取所有账号的订阅状态统计信息")
    @GetMapping("/getMembershipStatistics")
    public ResponseModel getMembershipStatistics() {
        
        log.info("📊 收到获取订阅状态统计请求");
        
        try {
            Map<String, Object> statistics = accountService.getMembershipStatistics();
            
            log.info("✅ 成功获取订阅状态统计");
            return ResponseModel.success("获取成功", statistics);
            
        } catch (Exception e) {
            log.error("❌ 获取订阅状态统计失败: {}", e.getMessage());
            return ResponseModel.fail("获取失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "批量刷新可用账号的AccessToken", notes = "批量刷新所有可用账号（is_available=1）的AccessToken")
    @PostMapping("/refreshAvailableAccountsAccessToken")
    public ResponseModel refreshAvailableAccountsAccessToken() {
        
        log.info("🔄 收到批量刷新可用账号AccessToken请求");
        
        try {
            Map<String, Object> refreshResult = accountService.refreshAllAvailableAccountsAccessToken();
            
            int successCount = (int) refreshResult.get("successCount");
            int failedCount = (int) refreshResult.get("failedCount");
            int totalCount = (int) refreshResult.get("totalCount");
            
            String message = String.format("刷新完成！总数: %d, 成功: %d, 失败: %d", 
                totalCount, successCount, failedCount);
            
            log.info("✅ 批量刷新AccessToken完成 - {}", message);
            return ResponseModel.success(message, refreshResult);
            
        } catch (Exception e) {
            log.error("❌ 批量刷新可用账号AccessToken失败: {}", e.getMessage(), e);
            return ResponseModel.fail("批量刷新AccessToken失败: " + e.getMessage());
        }
    }
    
    @ApiOperation(value = "检查客户端版本", notes = "检查当前客户端版本是否为最新版本，返回更新信息")
    @GetMapping("/checkVersion/{currentVersion}")
    public ResponseModel checkVersion(
            @ApiParam(value = "当前客户端版本号", required = true, example = "1.0.0")
            @PathVariable(value = "currentVersion") String currentVersion) {
        
        log.info("收到版本检查请求 - 当前版本: {}", currentVersion);
        
        try {
            // 从配置文件读取最新版本信息
            String latestVersion = versionConfig.getLatest();
            
            // 解析版本号
            boolean needsUpdate = compareVersions(currentVersion, latestVersion) < 0;
            
            Map<String, Object> versionInfo = new HashMap<>();
            versionInfo.put("currentVersion", currentVersion);
            versionInfo.put("latestVersion", latestVersion);
            versionInfo.put("needsUpdate", needsUpdate);
            
            if (needsUpdate) {
                // 需要更新时返回更新信息（从配置文件读取）
                Map<String, Object> updateInfo = new HashMap<>();
                updateInfo.put("title", versionConfig.getUpdateTitle());
                updateInfo.put("message", versionConfig.getUpdateMessage() + " v" + latestVersion);
                updateInfo.put("features", versionConfig.getFeatures());
                updateInfo.put("downloadUrl", versionConfig.getDownloadUrl());
                updateInfo.put("forceUpdate", versionConfig.getForceUpdate());
                
                versionInfo.put("updateInfo", updateInfo);
                
                log.info("检测到需要更新 - 当前版本: {}, 最新版本: {}", currentVersion, latestVersion);
            } else {
                log.info("当前版本已是最新 - 版本: {}", currentVersion);
            }
            
            return ResponseModel.success("版本检查成功", versionInfo);
            
        } catch (Exception e) {
            log.error("版本检查失败: {}", e.getMessage());
            return ResponseModel.fail("版本检查失败: " + e.getMessage());
        }
    }
    
    /**
     * 比较两个版本号
     * @param version1 版本1
     * @param version2 版本2
     * @return 负数表示version1 < version2，0表示相等，正数表示version1 > version2
     */
    private int compareVersions(String version1, String version2) {
        try {
            // 移除可能的 'v' 前缀
            version1 = version1.replaceFirst("^v", "");
            version2 = version2.replaceFirst("^v", "");
            
            String[] parts1 = version1.split("\\.");
            String[] parts2 = version2.split("\\.");
            
            int maxLength = Math.max(parts1.length, parts2.length);
            
            for (int i = 0; i < maxLength; i++) {
                int v1 = i < parts1.length ? Integer.parseInt(parts1[i]) : 0;
                int v2 = i < parts2.length ? Integer.parseInt(parts2[i]) : 0;
                
                if (v1 != v2) {
                    return Integer.compare(v1, v2);
                }
            }
            
            return 0;
        } catch (Exception e) {
            log.error("版本号解析失败: version1={}, version2={}", version1, version2);
            return 0; // 解析失败时认为版本相同
        }
    }
}
