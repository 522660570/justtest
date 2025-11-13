package com.mycursor.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.mycursor.entity.CursorAccount;
import com.mycursor.mapper.CursorAccountMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 账号管理服务
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 16:42
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {
    
    private final CursorAccountMapper accountMapper;
    private final CursorUsageService cursorUsageService;
    private final CursorSubscriptionService subscriptionService;
    private final com.mycursor.mapper.LicenseMapper licenseMapper;
    private final TokenRefreshService tokenRefreshService;
    private final com.mycursor.config.AccountConfig accountConfig;
    
    /**
     * 判断账号类型是否有效（可接受）
     * 根据配置决定是否接受 free 账号
     * 
     * @param membershipType 账号类型
     * @return true=有效类型，false=无效类型
     */
    private boolean isValidMembershipType(String membershipType) {
        if (membershipType == null) {
            return false;
        }
        
        // 始终接受 pro 和 free_trial
        if ("pro".equals(membershipType) || "free_trial".equals(membershipType)) {
            return true;
        }
        
        // 根据配置决定是否接受 free
        if ("free".equals(membershipType) && accountConfig.getAcceptFreeAccounts()) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取新账号
     * 根据业务逻辑：
     * 1. 判断当前账号是否存在于本地数据库
     * 2. 如果存在，判断额度是否已用完，如果没用完不给获取账号
     * 3. 从本地数据库获取一个账号，请求接口判断是否为满额度可用账号
     */
    @Transactional
    public Map<String, Object> getAccountByCode(String licenseCode, String macAddress, String currentAccount) {
        log.info("获取新账号 - 授权码: {}, MAC: {}, 当前账号: {}", licenseCode, macAddress, currentAccount);
        
        // 1. 判断当前账号是否存在于本地数据库，如果存在，判断额度是否已用完
        if (isCurrentAccountStillUsable(currentAccount)) {
            log.warn("当前账号仍可用，拒绝获取新账号: {}", currentAccount);
            throw new RuntimeException("当前账号额度未用完，无法获取新账号");
        }
        
        // 2. 从本地数据库获取一个可用账号
        CursorAccount account = accountMapper.findFirstAvailableAccount();
        if (account == null) {
            log.error("没有可用的Cursor账号");
            throw new RuntimeException("暂无可用账号，请稍后再试");
        }

        // 3. 先检查账号的订阅状态，只有符合条件的账号才能使用（避免无用的额度检查）
        // 🆕 支持通过配置开关控制是否检查
        if (accountConfig.getEnableSubscriptionCheck() && !verifyAccountMembershipType(account)) {
            log.warn("账号 {} 不符合一键换号条件，标记为不可用并尝试获取下一个账号", account.getEmail());
            account.setIsAvailable(false);
            accountMapper.updateById(account);
            
            // 继续获取下一个账号
            return getAccountByCodeLoop(licenseCode, macAddress, currentAccount, 1);
        } else if (!accountConfig.getEnableSubscriptionCheck()) {
            log.info("✅ 订阅状态检查已禁用，跳过检查");
        }
        
        // 4. 检查账号额度是否真的可用
        // 🆕 支持通过配置开关控制是否检查
        if (accountConfig.getEnableQuotaCheck() && verifyAccountQuotaStatus(account)) {
            log.warn("账号 {} 额度已满，标记为不可用并尝试获取下一个账号", account.getEmail());
            account.updateQuotaStatus(true);
            accountMapper.updateById(account);
            
            // 使用循环而不是递归，避免事务问题
            return getAccountByCodeLoop(licenseCode, macAddress, currentAccount, 1);
        } else if (!accountConfig.getEnableQuotaCheck()) {
            log.info("✅ 额度检查已禁用，跳过检查");
        }
        
        // 5. 标记账号为已使用并记录占用的授权码
        account.markAsOccupied(licenseCode);
        accountMapper.updateById(account);
        
        // 5.5 如果是次卡，扣减换号次数
        decrementCountCardSwitch(licenseCode);
        
        // 6. 构建响应数据
        Map<String, Object> accountData = new HashMap<>();
        accountData.put("email", account.getEmail());
        
        // ✅ 兼容新旧客户端策略：
        // - 如果数据库中有 accessToken（通过批量刷新接口刷新过），返回给旧客户端使用
        // - 如果数据库中没有 accessToken，返回空字符串，让新客户端自己调用 reftoken 接口
        String accessToken = account.getAccessToken();
        String refreshToken = account.getRefreshToken();
        String sessionToken = account.getSessionToken();
        
        // 判断是否有有效的 accessToken
        boolean hasAccessToken = accessToken != null && !accessToken.trim().isEmpty();
        
        accountData.put("accessToken", hasAccessToken ? accessToken : ""); // 有值返回，无值返回空
        accountData.put("refreshToken", hasAccessToken ? refreshToken : ""); // 有值返回，无值返回空
        accountData.put("sessionToken", sessionToken);
        accountData.put("signUpType", account.getSignUpType());
        accountData.put("membershipType", account.getMembershipType()); // 返回订阅类型
        
        log.info("成功分配账号: {} (类型: free_trial, sessionToken: {}, accessToken: {})", 
            account.getEmail(),
            sessionToken != null ? "有" : "无",
            hasAccessToken ? "有(数据库)" : "无(需前端获取)");
        
        return accountData;
    }
    
    /**
     * 循环获取可用账号（避免递归导致的事务问题）
     * @param licenseCode 授权码
     * @param macAddress MAC地址
     * @param currentAccountEmail 当前账号邮箱
     * @param attemptCount 尝试次数
     * @return 账号数据
     */
    private Map<String, Object> getAccountByCodeLoop(String licenseCode, String macAddress, String currentAccountEmail, int attemptCount) {
        // 限制最大尝试次数，避免无限循环
        if (attemptCount > 10) {
            log.error("尝试获取可用账号次数过多，停止尝试");
            throw new RuntimeException("系统繁忙，请稍后再试");
        }
        
        log.info("第 {} 次尝试获取可用账号", attemptCount);
        
        // 获取下一个可用账号
        CursorAccount account = accountMapper.findFirstAvailableAccount();
        if (account == null) {
            log.error("第 {} 次尝试：没有可用的Cursor账号", attemptCount);
            throw new RuntimeException("暂无可用账号，请稍后再试");
        }
        
        // 先检查账号的订阅状态，只有 free_trial 账号才能使用（避免无用的额度检查）
        // 🆕 支持通过配置开关控制是否检查
        if (accountConfig.getEnableSubscriptionCheck() && !verifyAccountMembershipType(account)) {
            log.warn("第 {} 次尝试：账号 {} 不是 free_trial 类型，标记为不可用", attemptCount, account.getEmail());
            account.setIsAvailable(false);
            accountMapper.updateById(account);
            
            // 继续尝试下一个账号
            return getAccountByCodeLoop(licenseCode, macAddress, currentAccountEmail, attemptCount + 1);
        } else if (!accountConfig.getEnableSubscriptionCheck()) {
            log.info("✅ 循环中：订阅状态检查已禁用，跳过检查");
        }
        
        // 检查账号额度是否真的可用（只检查 free_trial 账号）
        // 🆕 支持通过配置开关控制是否检查
        if (accountConfig.getEnableQuotaCheck() && verifyAccountQuotaStatus(account)) {
            log.warn("第 {} 次尝试：账号 {} 额度已满，标记为不可用", attemptCount, account.getEmail());
            account.updateQuotaStatus(true);
            accountMapper.updateById(account);
            
            // 继续尝试下一个账号
            return getAccountByCodeLoop(licenseCode, macAddress, currentAccountEmail, attemptCount + 1);
        } else if (!accountConfig.getEnableQuotaCheck()) {
            log.info("✅ 循环中：额度检查已禁用，跳过检查");
        }
        
        // 找到可用账号，标记为已使用并记录占用的授权码
        account.markAsOccupied(licenseCode);
        accountMapper.updateById(account);
        
        // 如果是次卡，扣减换号次数
        decrementCountCardSwitch(licenseCode);
        
        // 构建响应数据
        Map<String, Object> accountData = new HashMap<>();
        accountData.put("email", account.getEmail());
        
        // ✅ 兼容新旧客户端策略：
        // - 如果数据库中有 accessToken（通过批量刷新接口刷新过），返回给旧客户端使用
        // - 如果数据库中没有 accessToken，返回空字符串，让新客户端自己调用 reftoken 接口
        String accessToken = account.getAccessToken();
        String refreshToken = account.getRefreshToken();
        String sessionToken = account.getSessionToken();
        
        // 判断是否有有效的 accessToken
        boolean hasAccessToken = accessToken != null && !accessToken.trim().isEmpty();
        
        accountData.put("accessToken", hasAccessToken ? accessToken : ""); // 有值返回，无值返回空
        accountData.put("refreshToken", hasAccessToken ? refreshToken : ""); // 有值返回，无值返回空
        accountData.put("sessionToken", sessionToken);
        accountData.put("signUpType", account.getSignUpType());
        accountData.put("membershipType", account.getMembershipType()); // 返回订阅类型
        
        log.info("第 {} 次尝试成功分配账号: {} (类型: free_trial, sessionToken: {}, accessToken: {})", 
            attemptCount, account.getEmail(),
            sessionToken != null ? "有" : "无",
            hasAccessToken ? "有(数据库)" : "无(需前端获取)");
        return accountData;
    }
    
    /**
     * 检查当前账号是否仍然可用
     * 判断逻辑：
     * 1. 账号不在数据库 → 允许换号
     * 2. 账号在数据库但不是 pro/free_trial 类型 → 允许换号（这种账号不应该被使用）
     * 3. 账号是 pro/free_trial 类型 → 检查额度是否用完
     */
    private boolean isCurrentAccountStillUsable(String currentAccountEmail) {
        if (currentAccountEmail == null || currentAccountEmail.trim().isEmpty() 
            || "no-current-account".equals(currentAccountEmail)) {
            log.info("当前账号为空，可以获取新账号");
            return false;
        }
        
        QueryWrapper<CursorAccount> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("email", currentAccountEmail);
        CursorAccount currentAccount = accountMapper.selectOne(queryWrapper);
        if (currentAccount == null) {
            log.info("当前账号 {} 不在数据库中，可以获取新账号", currentAccountEmail);
            return false;
        }
        
        // 先检查账号类型：如果不是有效类型，允许换号
        String membershipType = currentAccount.getMembershipType();
        boolean isValidType = isValidMembershipType(membershipType);
        
        if (!isValidType) {
            log.info("当前账号 {} 的类型是 {}，不是有效类型，允许换号", 
                currentAccountEmail, membershipType);
            return false;
        }
        
        // 如果配置了不检查额度，直接允许换号
        if (!accountConfig.getCheckQuotaOnSwitch()) {
            log.info("当前账号 {} 是 {} 类型，配置为不检查额度，允许换号", currentAccountEmail, membershipType);
            return false;
        }
        
        // 账号类型是有效类型，检查额度是否用完
        log.info("当前账号 {} 是 {} 类型，检查额度状态...", currentAccountEmail, membershipType);
        
        boolean isQuotaFull = verifyAccountQuotaStatus(currentAccount);
        currentAccount.updateQuotaStatus(isQuotaFull);
        accountMapper.updateById(currentAccount);
        
        if (isQuotaFull) {
            log.info("当前账号 {} 额度已满，可以获取新账号", currentAccountEmail);
            return false;
        }
        
        log.info("当前账号 {} 额度未用完，不允许获取新账号", currentAccountEmail);
        return true;
    }
    
    /**
     * 检查账号的订阅类型
     * 判断账号是否可以用于一键换号
     * 
     * @param account 账号对象
     * @return true 表示可以用于一键换号，false 表示不可以
     */
    private boolean verifyAccountMembershipType(CursorAccount account) {
        log.info("开始检查账号 {} 的订阅类型...", account.getEmail());
        
        // 检查是否有SessionToken
        if (account.getSessionToken() == null || account.getSessionToken().trim().isEmpty()) {
            log.warn("账号 {} 缺少SessionToken，无法检查订阅类型", account.getEmail());
            return false;
        }
        
        try {
            // 调用 Cursor Stripe API 获取订阅状态
            Map<String, Object> subscriptionInfo = subscriptionService.getSubscriptionStatus(account.getSessionToken());
            String membershipType = (String) subscriptionInfo.get("membershipType");
            
            // 提取订阅详情字段
            Integer trialLengthDays = subscriptionInfo.get("trialLengthDays") != null ? 
                (Integer) subscriptionInfo.get("trialLengthDays") : null;
            Integer daysRemainingOnTrial = subscriptionInfo.get("daysRemainingOnTrial") != null ? 
                (Integer) subscriptionInfo.get("daysRemainingOnTrial") : null;
            
            // 更新账号的订阅信息到数据库
            account.setMembershipType(membershipType);
            account.setMembershipCheckTime(LocalDateTime.now());
            account.setTrialLengthDays(trialLengthDays);
            account.setDaysRemainingOnTrial(daysRemainingOnTrial);
            accountMapper.updateById(account);
            
            log.info("账号 {} 订阅类型检查完成 - 类型: {}, 试用总天数: {}, 剩余天数: {}", 
                account.getEmail(), membershipType, trialLengthDays, daysRemainingOnTrial);
            
            // 检查是否需要删除账号：根据配置决定是否保留
            boolean shouldKeep = isValidMembershipType(membershipType);
            
            if (!shouldKeep) {
                String rejectReason = accountConfig.getAcceptFreeAccounts() 
                    ? "(不是pro、free_trial或free)" 
                    : "(不是pro或free_trial)";
                log.warn("⚠️ 账号 {} membershipType={} {}，账号将被删除", 
                    account.getEmail(), membershipType, rejectReason);
                accountMapper.deleteById(account.getId());
                return false;
            }
            
            // 判断账号是否可以用于一键换号
            boolean isFreeTrialAccount = "free_trial".equals(membershipType);
            boolean isFreeAccount = "free".equals(membershipType);
            boolean canUseForSwitch = isFreeTrialAccount || (isFreeAccount && accountConfig.getUseFreeAccountsForSwitch());
            
            if (isFreeTrialAccount) {
                log.info("✅ 账号 {} 是 free_trial 类型，可以使用", account.getEmail());
            } else if ("pro".equals(membershipType)) {
                log.info("✅ 账号 {} 是 pro 类型，保留但不用于一键换号", account.getEmail());
            } else if (isFreeAccount) {
                if (accountConfig.getUseFreeAccountsForSwitch()) {
                    log.info("✅ 账号 {} 是 free 类型，可以用于一键换号", account.getEmail());
                } else {
                    log.info("✅ 账号 {} 是 free 类型，保留但不用于一键换号", account.getEmail());
                }
            }
            
            return canUseForSwitch;
            
        } catch (Exception e) {
            log.error("检查账号 {} 订阅类型时发生错误: {}", account.getEmail(), e.getMessage());
            
            // 检查是否是 SessionToken 无效的错误
            String errorMsg = e.getMessage();
            boolean isTokenInvalid = errorMsg != null && (
                errorMsg.contains("401") || 
                errorMsg.contains("403") || 
                errorMsg.contains("Unauthorized") ||
                errorMsg.contains("not_authenticated") ||
                errorMsg.contains("SessionToken无效") ||
                errorMsg.contains("SessionToken 无效") ||
                errorMsg.contains("已过期")
            );
            
            if (isTokenInvalid) {
                // SessionToken 无效，删除账号
                log.warn("账号 {} SessionToken无效/已过期，将被删除", account.getEmail());
                try {
                    accountMapper.deleteById(account.getId());
                } catch (Exception deleteError) {
                    log.error("删除账号 {} 失败: {}", account.getEmail(), deleteError.getMessage());
                }
            }
            
            return false;
        }
    }
    
    /**
     * 真实检查账号额度状态
     * 通过Cursor官方API检查账号的实际使用情况
     */
    private boolean verifyAccountQuotaStatus(CursorAccount account) {
        log.info("开始检查账号 {} 的真实额度状态...", account.getEmail());
        
        // 检查是否有SessionToken
        if (account.getSessionToken() == null || account.getSessionToken().trim().isEmpty()) {
            log.warn("账号 {} 缺少SessionToken，无法检查真实额度，默认认为可用", account.getEmail());
            return false; // 没有SessionToken时默认认为可用（返回false表示额度未满）
        }
        
        try {
            // 调用真实的Cursor API检查使用情况（不带账号实体，避免事务嵌套）
            Map<String, Object> usageInfo = cursorUsageService.checkAccountUsage(account.getSessionToken());
            boolean isQuotaFull = (Boolean) usageInfo.get("isQuotaFull");
            java.math.BigDecimal actualUsage = (java.math.BigDecimal) usageInfo.get("totalUsed");
            
            // 手动更新账号的实际使用金额（在同一个事务中）
            account.setActualUsageAmount(actualUsage);
            
            log.info("账号 {} 真实额度检查完成 - 已使用: ${}, 额度已满: {}", 
                account.getEmail(), actualUsage, isQuotaFull);
            
            return isQuotaFull; // 直接返回是否额度已满
            
        } catch (Exception e) {
            log.error("检查账号 {} 真实额度时发生错误: {}", account.getEmail(), e.getMessage());
            
            // 检查是否是SessionToken相关错误，如果是则标记账号为不可用
            if (e.getMessage().contains("403 Forbidden") || e.getMessage().contains("401 Unauthorized") 
                || e.getMessage().contains("SessionToken无效") || e.getMessage().contains("认证失败")) {
                log.warn("账号 {} SessionToken无效或已过期，标记为不可用", account.getEmail());
                account.setIsAvailable(false);
                account.setIsQuotaFull(true);
                account.setQuotaCheckTime(LocalDateTime.now());
                account.setUpdatedTime(LocalDateTime.now());
                
                // 更新备注信息
                String currentNotes = account.getNotes();
                String newNote = String.format("[%s] SessionToken无效，标记为不可用: %s", 
                    LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), 
                    e.getMessage());
                
                if (currentNotes != null && !currentNotes.isEmpty()) {
                    account.setNotes(currentNotes + "\n" + newNote);
                } else {
                    account.setNotes(newNote);
                }
                
                // 在同一个事务中更新数据库
                accountMapper.updateById(account);
                
                return true; // 标记为额度已满，不可用
            }
            
            // 其他错误使用备用策略：检查数据库中的上次检查结果
            if (account.getQuotaCheckTime() != null) {
                LocalDateTime lastCheck = account.getQuotaCheckTime();
                // 如果上次检查是在1小时内，使用上次的结果
                if (lastCheck.isAfter(LocalDateTime.now().minusHours(1))) {
                    log.info("使用账号 {} 的上次检查结果: {}", account.getEmail(), account.getIsQuotaFull());
                    return account.getIsQuotaFull();
                }
            }
            
            // 无法确定时，保守处理，认为额度已满
            log.warn("无法确定账号 {} 的额度状态，保守认为额度已满", account.getEmail());
            return true;
        }
    }
    
    /**
     * 获取可用账号数量
     */
    public long getAvailableAccountCount() {
        return accountMapper.countAvailableAccounts();
    }
    
    /**
     * 刷新所有账号的额度状态
     */
    @Transactional
    public void refreshAccountQuotaStatus() {
        log.info("开始刷新账号额度状态");
        LocalDateTime checkTime = LocalDateTime.now().minusHours(1);
        List<CursorAccount> accounts = accountMapper.findAccountsNeedingQuotaRecheck(checkTime);
        
        for (CursorAccount account : accounts) {
            boolean isQuotaFull = verifyAccountQuotaStatus(account);
            account.updateQuotaStatus(isQuotaFull);
            accountMapper.updateById(account);
        }
        
        log.info("账号额度状态刷新完成，处理了 {} 个账号", accounts.size());
    }
    
    /**
     * 批量导入账号数据
     * 支持新增和更新已有账号，并自动检查订阅状况
     * @param accountsData 账号数据列表
     * @return 导入结果统计
     */
    @Transactional
    public Map<String, Object> importAccounts(List<Map<String, Object>> accountsData) {
        log.info("开始批量导入账号数据，总数: {}", accountsData.size());
        
        int successCount = 0;
        int updateCount = 0;
        int insertCount = 0;
        int skipCount = 0;
        int subscriptionCheckCount = 0;  // 订阅查询成功数量
        int subscriptionCheckFailedCount = 0;  // 订阅查询失败数量
        List<String> errors = new ArrayList<>();
        List<Map<String, Object>> subscriptionResults = new ArrayList<>();  // 订阅查询结果
        
        for (Map<String, Object> accountData : accountsData) {
            try {
                String email = (String) accountData.get("email");
                if (email == null || email.trim().isEmpty()) {
                    errors.add("账号数据缺少email字段");
                    skipCount++;
                    continue;
                }
                
                // 检查账号是否已存在
                QueryWrapper<CursorAccount> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("email", email);
                CursorAccount existingAccount = accountMapper.selectOne(queryWrapper);
                
                CursorAccount savedAccount;
                if (existingAccount != null) {
                    // 更新已有账号
                    updateExistingAccount(existingAccount, accountData);
                    accountMapper.updateById(existingAccount);
                    savedAccount = existingAccount;
                    updateCount++;
                    log.info("更新已有账号: {}", email);
                } else {
                    // 创建新账号
                    CursorAccount newAccount = createNewAccount(accountData);
                    accountMapper.insert(newAccount);
                    savedAccount = newAccount;
                    insertCount++;
                    log.info("创建新账号: {}", email);
                }
                
                successCount++;
                
                // 🔑 导入后自动检查订阅状况
                if (savedAccount.getSessionToken() != null && !savedAccount.getSessionToken().trim().isEmpty()) {
                    try {
                        log.info("🔍 正在检查账号 {} 的订阅状况...", email);
                        Map<String, Object> subscriptionInfo = subscriptionService.getSubscriptionStatus(savedAccount.getSessionToken());
                        
                        // 提取订阅信息
                        String membershipType = (String) subscriptionInfo.get("membershipType");
                        Integer trialLengthDays = subscriptionInfo.get("trialLengthDays") != null ? 
                            (Integer) subscriptionInfo.get("trialLengthDays") : null;
                        Integer daysRemainingOnTrial = subscriptionInfo.get("daysRemainingOnTrial") != null ? 
                            (Integer) subscriptionInfo.get("daysRemainingOnTrial") : null;
                        
                        // 更新账号的订阅信息
                        savedAccount.setMembershipType(membershipType);
                        savedAccount.setMembershipCheckTime(LocalDateTime.now());
                        savedAccount.setTrialLengthDays(trialLengthDays);
                        savedAccount.setDaysRemainingOnTrial(daysRemainingOnTrial);
                        accountMapper.updateById(savedAccount);
                        
                        subscriptionCheckCount++;
                        
                        // 记录订阅查询结果
                        Map<String, Object> subscriptionResult = new HashMap<>();
                        subscriptionResult.put("email", email);
                        subscriptionResult.put("membershipType", membershipType);
                        subscriptionResult.put("trialLengthDays", trialLengthDays);
                        subscriptionResult.put("daysRemainingOnTrial", daysRemainingOnTrial);
                        subscriptionResults.add(subscriptionResult);
                        
                        log.info("✅ 账号 {} 订阅状况查询完成 - 类型: {}, 试用天数: {}, 剩余天数: {}", 
                            email, membershipType, trialLengthDays, daysRemainingOnTrial);
                            
                    } catch (Exception e) {
                        subscriptionCheckFailedCount++;
                        log.warn("⚠️ 账号 {} 订阅状况查询失败: {}", email, e.getMessage());
                        
                        // 记录失败的订阅查询
                        Map<String, Object> subscriptionResult = new HashMap<>();
                        subscriptionResult.put("email", email);
                        subscriptionResult.put("error", e.getMessage());
                        subscriptionResults.add(subscriptionResult);
                    }
                } else {
                    log.debug("账号 {} 没有 SessionToken，跳过订阅状况查询", email);
                    accountMapper.delete(new LambdaQueryWrapper<CursorAccount>().eq(CursorAccount::getEmail,email));
                }
                
            } catch (Exception e) {
                String email = (String) accountData.getOrDefault("email", "unknown");
                String errorMsg = String.format("处理账号 %s 时发生错误: %s", email, e.getMessage());
                errors.add(errorMsg);
                log.error(errorMsg, e);
                skipCount++;
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", accountsData.size());
        result.put("successCount", successCount);
        result.put("insertCount", insertCount);
        result.put("updateCount", updateCount);
        result.put("skipCount", skipCount);
        result.put("errorCount", errors.size());
        result.put("errors", errors);
        result.put("subscriptionCheckCount", subscriptionCheckCount);
        result.put("subscriptionCheckFailedCount", subscriptionCheckFailedCount);
        result.put("subscriptionResults", subscriptionResults);
        
        log.info("账号导入完成 - 总数: {}, 成功: {}, 新增: {}, 更新: {}, 跳过: {}, 错误: {}", 
            accountsData.size(), successCount, insertCount, updateCount, skipCount, errors.size());
        log.info("订阅状况查询 - 成功: {}, 失败: {}", subscriptionCheckCount, subscriptionCheckFailedCount);
        
        return result;
    }
    
    /**
     * 更新已有账号信息
     */
    private void updateExistingAccount(CursorAccount existingAccount, Map<String, Object> accountData) {
        // 更新注册类型（如果提供）
        String signUpType = (String) accountData.get("sign_up_type");
        if (signUpType != null) {
            existingAccount.setSignUpType(signUpType);
        }
        
        // 提取认证信息
        @SuppressWarnings("unchecked")
        Map<String, Object> authInfo = (Map<String, Object>) accountData.get("auth_info");
        if (authInfo != null) {
            String accessToken = (String) authInfo.get("cursorAuth/accessToken");
            String refreshToken = (String) authInfo.get("cursorAuth/refreshToken");
            String sessionToken = (String) authInfo.get("WorkosCursorSessionToken");
            
            log.debug("更新账号 {} - 原始数据: accessToken={}, refreshToken={}, sessionToken={}", 
                existingAccount.getEmail(),
                accessToken != null ? "有(" + accessToken.length() + "字符)" : "无",
                refreshToken != null ? "有(" + refreshToken.length() + "字符)" : "无",
                sessionToken != null ? "有(" + sessionToken.length() + "字符)" : "无");
            
            // ✅ 新策略：不在后端提取 accessToken，导入时直接使用提供的值
            if (accessToken != null) {
                existingAccount.setAccessToken(accessToken);
                log.debug("设置账号 {} 的 accessToken", existingAccount.getEmail());
            }
            if (refreshToken != null) {
                existingAccount.setRefreshToken(refreshToken);
                log.debug("设置账号 {} 的 refreshToken", existingAccount.getEmail());
            }
            if (sessionToken != null) {
                existingAccount.setSessionToken(sessionToken);
                log.debug("设置账号 {} 的 sessionToken", existingAccount.getEmail());
            }
        } else {
            log.warn("⚠️ 更新账号 {} 时没有提供 auth_info 数据", existingAccount.getEmail());
        }
        
        // 更新使用情况信息
        @SuppressWarnings("unchecked")
        Map<String, Object> modelUsage = (Map<String, Object>) accountData.get("modelUsage");
        if (modelUsage != null) {
            Integer used = (Integer) modelUsage.get("used");
            Integer total = (Integer) modelUsage.get("total");
            
            if (used != null && total != null) {
                // 计算使用百分比
                double usagePercentage = (double) used / total * 100;
                
                // 如果使用率达到100%，标记为额度已满
                if (usagePercentage >= 100) {
                    existingAccount.setIsQuotaFull(true);
                    existingAccount.setIsAvailable(false);
                } else {
                    existingAccount.setIsQuotaFull(false);
                    existingAccount.setIsAvailable(true);
                }
            }
        }
        
        // 更新注册时间
        String registerTime = (String) accountData.get("register_time");
        if (registerTime != null) {
            try {
                LocalDateTime registerDateTime = LocalDateTime.parse(registerTime, 
                    java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                existingAccount.setCreatedTime(registerDateTime);
            } catch (Exception e) {
                log.warn("解析注册时间失败: {}", registerTime);
            }
        }
        
        // 更新备注信息
        String currentNotes = existingAccount.getNotes();
        String newNote = String.format("[%s] 通过导入更新账号信息", 
            LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        if (currentNotes != null && !currentNotes.isEmpty()) {
            existingAccount.setNotes(currentNotes + "\n" + newNote);
        } else {
            existingAccount.setNotes(newNote);
        }
        
        existingAccount.setUpdatedTime(LocalDateTime.now());
    }
    
    /**
     * 创建新账号
     */
    private CursorAccount createNewAccount(Map<String, Object> accountData) {
        CursorAccount newAccount = new CursorAccount();
        
        // 设置基本信息
        newAccount.setEmail((String) accountData.get("email"));
        
        // 设置注册类型，优先使用传入的值，否则默认为"email"
        String signUpType = (String) accountData.get("sign_up_type");
        newAccount.setSignUpType(signUpType != null ? signUpType : "email");
        
        newAccount.setIsAvailable(true);
        newAccount.setIsQuotaFull(false);
        newAccount.setActualUsageAmount(BigDecimal.ZERO);
        
        // 提取认证信息
        @SuppressWarnings("unchecked")
        Map<String, Object> authInfo = (Map<String, Object>) accountData.get("auth_info");
        if (authInfo != null) {
            String accessToken = (String) authInfo.get("cursorAuth/accessToken");
            String refreshToken = (String) authInfo.get("cursorAuth/refreshToken");
            String sessionToken = (String) authInfo.get("WorkosCursorSessionToken");
            
            log.debug("创建新账号 {} - 原始数据: accessToken={}, refreshToken={}, sessionToken={}", 
                newAccount.getEmail(),
                accessToken != null ? "有(" + accessToken.length() + "字符)" : "无",
                refreshToken != null ? "有(" + refreshToken.length() + "字符)" : "无",
                sessionToken != null ? "有(" + sessionToken.length() + "字符)" : "无");
            
            // ✅ 新策略：不在后端提取 accessToken，导入时直接使用提供的值
            newAccount.setAccessToken(accessToken);
            newAccount.setRefreshToken(refreshToken);
            newAccount.setSessionToken(sessionToken);
            
            log.debug("创建新账号 {} - 最终设置: accessToken={}, refreshToken={}, sessionToken={}", 
                newAccount.getEmail(),
                accessToken != null ? "有" : "无",
                refreshToken != null ? "有" : "无",
                sessionToken != null ? "有" : "无");
        } else {
            log.warn("⚠️ 创建新账号 {} 时没有提供 auth_info 数据", newAccount.getEmail());
        }
        
        // 设置使用情况
        @SuppressWarnings("unchecked")
        Map<String, Object> modelUsage = (Map<String, Object>) accountData.get("modelUsage");
        if (modelUsage != null) {
            Integer used = (Integer) modelUsage.get("used");
            Integer total = (Integer) modelUsage.get("total");
            
            if (used != null && total != null) {
                // 计算使用百分比
                double usagePercentage = (double) used / total * 100;
                
                // 如果使用率达到100%，标记为额度已满
                if (usagePercentage >= 100) {
                    newAccount.setIsQuotaFull(true);
                    newAccount.setIsAvailable(false);
                }
            }
        }
        
        // 设置注册时间
        String registerTime = (String) accountData.get("register_time");
        if (registerTime != null) {
            try {
                LocalDateTime registerDateTime = LocalDateTime.parse(registerTime, 
                    java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                newAccount.setCreatedTime(registerDateTime);
            } catch (Exception e) {
                log.warn("解析注册时间失败: {}", registerTime);
                newAccount.setCreatedTime(LocalDateTime.now());
            }
        } else {
            newAccount.setCreatedTime(LocalDateTime.now());
        }
        
        // 设置备注
        newAccount.setNotes(String.format("[%s] 通过导入创建新账号", 
            LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))));
        
        return newAccount;
    }
    
    /**
     * 根据授权码查询被占用的账号
     * @param licenseCode 授权码
     * @return 账号信息
     */
    public Map<String, Object> getAccountsByLicenseCode(String licenseCode) {
        log.info("查询授权码 {} 占用的账号", licenseCode);
        
        List<CursorAccount> occupiedAccounts = accountMapper.findByOccupiedLicenseCode(licenseCode);
        long totalCount = accountMapper.countByOccupiedLicenseCode(licenseCode);
        
        List<Map<String, Object>> accountList = new ArrayList<>();
        for (CursorAccount account : occupiedAccounts) {
            Map<String, Object> accountInfo = new HashMap<>();
            accountInfo.put("id", account.getId());
            accountInfo.put("email", account.getEmail());
            accountInfo.put("signUpType", account.getSignUpType());
            accountInfo.put("isAvailable", account.getIsAvailable());
            accountInfo.put("isQuotaFull", account.getIsQuotaFull());
            accountInfo.put("actualUsageAmount", account.getActualUsageAmount());
            accountInfo.put("occupiedTime", account.getOccupiedTime());
            accountInfo.put("lastUsedTime", account.getLastUsedTime());
            accountInfo.put("quotaCheckTime", account.getQuotaCheckTime());
            accountInfo.put("notes", account.getNotes());
            accountList.add(accountInfo);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("licenseCode", licenseCode);
        result.put("totalCount", totalCount);
        result.put("accounts", accountList);
        
        log.info("授权码 {} 占用了 {} 个账号", licenseCode, totalCount);
        return result;
    }
    
    /**
     * 获取账号使用统计
     * @return 统计信息
     */
    public Map<String, Object> getAccountUsageStats() {
        log.info("获取账号使用统计");
        
        // 总账号数
        long totalAccounts = accountMapper.selectCount(null);
        
        // 可用账号数
        long availableAccounts = accountMapper.countAvailableAccounts();
        
        // 被占用的账号数
        List<CursorAccount> occupiedAccounts = accountMapper.findAllOccupiedAccounts();
        long occupiedCount = occupiedAccounts.size();
        
        // 额度已满的账号数
        QueryWrapper<CursorAccount> quotaFullQuery = new QueryWrapper<>();
        quotaFullQuery.eq("is_quota_full", true);
        long quotaFullAccounts = accountMapper.selectCount(quotaFullQuery);
        
        // 按授权码分组统计
        Map<String, Long> licenseCodeStats = new HashMap<>();
        for (CursorAccount account : occupiedAccounts) {
            String licenseCode = account.getOccupiedByLicenseCode();
            licenseCodeStats.put(licenseCode, licenseCodeStats.getOrDefault(licenseCode, 0L) + 1);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalAccounts", totalAccounts);
        result.put("availableAccounts", availableAccounts);
        result.put("occupiedAccounts", occupiedCount);
        result.put("quotaFullAccounts", quotaFullAccounts);
        result.put("usageRate", totalAccounts > 0 ? (double) occupiedCount / totalAccounts * 100 : 0);
        result.put("licenseCodeStats", licenseCodeStats);
        result.put("statisticsTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("账号使用统计 - 总数: {}, 可用: {}, 占用: {}, 额度满: {}", 
            totalAccounts, availableAccounts, occupiedCount, quotaFullAccounts);
        
        return result;
    }
    
    /**
     * 释放指定授权码占用的所有账号
     * @param licenseCode 授权码
     * @return 释放结果
     */
    @Transactional
    public Map<String, Object> releaseAccountsByLicenseCode(String licenseCode) {
        log.info("释放授权码 {} 占用的账号", licenseCode);
        
        // 查询被占用的账号
        List<CursorAccount> occupiedAccounts = accountMapper.findByOccupiedLicenseCode(licenseCode);
        
        // 释放账号
        int releasedCount = accountMapper.releaseAccountsByLicenseCode(licenseCode);
        
        Map<String, Object> result = new HashMap<>();
        result.put("licenseCode", licenseCode);
        result.put("releasedCount", releasedCount);
        result.put("releasedAccounts", occupiedAccounts.stream()
            .map(account -> {
                Map<String, Object> accountInfo = new HashMap<>();
                accountInfo.put("email", account.getEmail());
                accountInfo.put("occupiedTime", account.getOccupiedTime());
                return accountInfo;
            })
            .toArray());
        result.put("releaseTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("成功释放授权码 {} 占用的 {} 个账号", licenseCode, releasedCount);
        return result;
    }
    
    /**
     * 更新所有账号的订阅状态
     * 通过调用 Cursor Stripe API 获取每个账号的订阅状态并更新到数据库
     * 
     * @return 更新结果统计
     */
    @Transactional
    public Map<String, Object> updateAllMembershipStatus() {
        log.info("🔄 开始批量更新所有账号的订阅状态...");
        
        // 查询所有有 SessionToken 且额度未满的账号
        QueryWrapper<CursorAccount> queryWrapper = new QueryWrapper<>();
        queryWrapper.isNotNull("session_token");
        queryWrapper.ne("session_token", "");
        queryWrapper.eq("is_quota_full", false);  // 🔑 只查询额度未满的账号
        List<CursorAccount> accounts = accountMapper.selectList(queryWrapper);
        
        int totalCount = accounts.size();
        int successCount = 0;
        int failedCount = 0;
        int skippedCount = 0;
        
        Map<String, Integer> membershipStats = new HashMap<>();
        membershipStats.put("free", 0);
        membershipStats.put("pro", 0);
        membershipStats.put("business", 0);
        membershipStats.put("unknown", 0);
        
        List<Map<String, Object>> failedAccounts = new ArrayList<>();
        
        // 统计额度已满被跳过的账号数量
        QueryWrapper<CursorAccount> quotaFullQuery = new QueryWrapper<>();
        quotaFullQuery.eq("is_quota_full", true);
        int quotaFullCount = (int) accountMapper.selectCount(quotaFullQuery);
        
        log.info("📊 找到 {} 个有 SessionToken 且额度未满的账号，开始逐个更新...", totalCount);
        log.info("⏭️ 额度已满账号: {} 个（已自动跳过）", quotaFullCount);
        
        for (int i = 0; i < accounts.size(); i++) {
            CursorAccount account = accounts.get(i);
            int progress = i + 1;
            
            try {
                log.info("📍 [{}/{}] 正在更新账号: {}", progress, totalCount, account.getEmail());
                
                String sessionToken = account.getSessionToken();
                if (sessionToken == null || sessionToken.trim().isEmpty()) {
                    log.warn("⚠️ 账号 {} 的 SessionToken 为空，跳过", account.getEmail());
                    skippedCount++;
                    continue;
                }
                
                // 调用 Cursor Stripe API 获取订阅状态
                Map<String, Object> subscriptionInfo = subscriptionService.getSubscriptionStatus(sessionToken);
                String membershipType = (String) subscriptionInfo.get("membershipType");
                Integer trialLengthDays = subscriptionInfo.get("trialLengthDays") != null ? 
                    (Integer) subscriptionInfo.get("trialLengthDays") : null;
                Integer daysRemainingOnTrial = subscriptionInfo.get("daysRemainingOnTrial") != null ? 
                    (Integer) subscriptionInfo.get("daysRemainingOnTrial") : null;
                
                // 检查是否需要删除账号：根据配置决定是否保留
                boolean shouldKeep = isValidMembershipType(membershipType);
                
                if (!shouldKeep) {
                    // 不是有效类型，删除账号
                    accountMapper.deleteById(account.getId());
                    String rejectReason = accountConfig.getAcceptFreeAccounts() 
                        ? "(不是pro、free_trial或free)" 
                        : "(不是pro或free_trial)";
                    log.warn("⚠️ [{}/{}] 账号 {} membershipType={} {}，已从数据库删除", 
                        progress, totalCount, account.getEmail(), membershipType, rejectReason);
                    
                    // 记录到失败账号列表
                    Map<String, Object> deletedInfo = new HashMap<>();
                    deletedInfo.put("email", account.getEmail());
                    deletedInfo.put("error", "membershipType=" + membershipType + " " + rejectReason + "，账号已删除");
                    failedAccounts.add(deletedInfo);
                    failedCount++;
                    continue; // 跳过后续处理
                }
                
                // 更新账号的订阅状态和详细信息
                account.setMembershipType(membershipType);
                account.setMembershipCheckTime(LocalDateTime.now());
                account.setTrialLengthDays(trialLengthDays);
                account.setDaysRemainingOnTrial(daysRemainingOnTrial);
                account.setUpdatedTime(LocalDateTime.now());
                
                accountMapper.updateById(account);
                
                // 统计
                membershipStats.put(membershipType, membershipStats.getOrDefault(membershipType, 0) + 1);
                successCount++;
                
                log.info("✅ [{}/{}] 账号 {} 更新成功 - 类型: {}, 试用总天数: {}, 剩余天数: {}", 
                    progress, totalCount, account.getEmail(), membershipType, trialLengthDays, daysRemainingOnTrial);
                
                // 添加延迟，避免频繁请求
                if (i < accounts.size() - 1) {
                    Thread.sleep(500); // 每次请求间隔 500ms
                }
                
            } catch (Exception e) {
                failedCount++;
                log.error("❌ [{}/{}] 账号 {} 更新失败: {}", 
                    progress, totalCount, account.getEmail(), e.getMessage());
                
                // 检查是否是 SessionToken 无效的错误（401, 403, 或包含特定关键字）
                String errorMsg = e.getMessage();
                boolean isTokenInvalid = errorMsg != null && (
                    errorMsg.contains("401") || 
                    errorMsg.contains("403") || 
                    errorMsg.contains("Unauthorized") ||
                    errorMsg.contains("not_authenticated") ||
                    errorMsg.contains("SessionToken无效") ||
                    errorMsg.contains("SessionToken 无效") ||
                    errorMsg.contains("已过期")
                );
                
                if (isTokenInvalid) {
                    // SessionToken 无效，直接删除账号
                    try {
                        accountMapper.deleteById(account.getId());
                        log.warn("⚠️ [{}/{}] 账号 {} SessionToken无效/已过期，已从数据库删除", 
                            progress, totalCount, account.getEmail());
                        
                        // 记录删除信息
                        Map<String, Object> deletedInfo = new HashMap<>();
                        deletedInfo.put("email", account.getEmail());
                        deletedInfo.put("error", "SessionToken无效/已过期，账号已删除");
                        failedAccounts.add(deletedInfo);
                    } catch (Exception deleteError) {
                        log.error("❌ 删除账号 {} 失败: {}", account.getEmail(), deleteError.getMessage());
                        
                        // 如果删除失败，记录原始错误
                        Map<String, Object> failedInfo = new HashMap<>();
                        failedInfo.put("email", account.getEmail());
                        failedInfo.put("error", errorMsg);
                        failedAccounts.add(failedInfo);
                    }
                } else {
                    // 其他错误，记录失败信息并标记为 unknown
                    Map<String, Object> failedInfo = new HashMap<>();
                    failedInfo.put("email", account.getEmail());
                    failedInfo.put("error", errorMsg);
                    failedAccounts.add(failedInfo);
                    
                    // 标记为 unknown
                    try {
                        account.setMembershipType("unknown");
                        account.setMembershipCheckTime(LocalDateTime.now());
                        account.setUpdatedTime(LocalDateTime.now());
                        accountMapper.updateById(account);
                        membershipStats.put("unknown", membershipStats.getOrDefault("unknown", 0) + 1);
                    } catch (Exception updateError) {
                        log.error("❌ 标记账号 {} 为 unknown 失败: {}", account.getEmail(), updateError.getMessage());
                    }
                }
            }
        }
        
        // 构建返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", totalCount);
        result.put("successCount", successCount);
        result.put("failedCount", failedCount);
        result.put("skippedCount", skippedCount);
        result.put("quotaFullSkippedCount", quotaFullCount);  // 🔑 添加额度已满跳过数量
        result.put("membershipStats", membershipStats);
        result.put("failedAccounts", failedAccounts);
        result.put("updateTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("✅ 批量更新订阅状态完成！");
        log.info("📊 总数: {}, 成功: {}, 失败: {}, 跳过: {}, 额度已满自动跳过: {}", 
            totalCount, successCount, failedCount, skippedCount, quotaFullCount);
        log.info("📊 订阅类型统计: free={}, pro={}, business={}, unknown={}", 
            membershipStats.get("free"), membershipStats.get("pro"), 
            membershipStats.get("business"), membershipStats.get("unknown"));
        
        return result;
    }
    
    /**
     * 更新单个账号的订阅状态
     * 
     * @param email 账号邮箱
     * @return 更新结果
     */
    @Transactional
    public Map<String, Object> updateSingleMembershipStatus(String email) {
        log.info("🔄 开始更新账号 {} 的订阅状态", email);
        
        // 查询账号
        QueryWrapper<CursorAccount> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("email", email);
        CursorAccount account = accountMapper.selectOne(queryWrapper);
        
        if (account == null) {
            throw new RuntimeException("账号不存在: " + email);
        }
        
        String sessionToken = account.getSessionToken();
        if (sessionToken == null || sessionToken.trim().isEmpty()) {
            throw new RuntimeException("账号缺少 SessionToken");
        }
        
        try {
            // 调用 Cursor Stripe API 获取订阅状态
            Map<String, Object> subscriptionInfo = subscriptionService.getSubscriptionStatus(sessionToken);
            String membershipType = (String) subscriptionInfo.get("membershipType");
            Integer trialLengthDays = subscriptionInfo.get("trialLengthDays") != null ? 
                (Integer) subscriptionInfo.get("trialLengthDays") : null;
            Integer daysRemainingOnTrial = subscriptionInfo.get("daysRemainingOnTrial") != null ? 
                (Integer) subscriptionInfo.get("daysRemainingOnTrial") : null;
            
            // 检查是否需要删除账号：根据配置决定是否保留
            boolean shouldKeep = isValidMembershipType(membershipType);
            
            if (!shouldKeep) {
                // 不是有效类型，删除账号
                accountMapper.deleteById(account.getId());
                String rejectReason = accountConfig.getAcceptFreeAccounts() 
                    ? "(不是pro、free_trial或free)" 
                    : "(不是pro或free_trial)";
                log.warn("⚠️ 账号 {} membershipType={} {}，已从数据库删除", 
                    email, membershipType, rejectReason);
                
                // 返回删除信息
                Map<String, Object> result = new HashMap<>();
                result.put("email", email);
                result.put("action", "deleted");
                result.put("reason", "membershipType=" + membershipType + " " + rejectReason + "，账号已删除");
                result.put("subscriptionInfo", subscriptionInfo);
                result.put("deleteTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                
                return result;
            }
            
            // 更新账号的订阅状态和详细信息
            String oldMembershipType = account.getMembershipType();
            account.setMembershipType(membershipType);
            account.setMembershipCheckTime(LocalDateTime.now());
            account.setTrialLengthDays(trialLengthDays);
            account.setDaysRemainingOnTrial(daysRemainingOnTrial);
            account.setUpdatedTime(LocalDateTime.now());
            
            accountMapper.updateById(account);
            
            log.info("✅ 账号 {} 订阅状态更新成功: {} -> {}, 试用总天数: {}, 剩余天数: {}", 
                email, oldMembershipType, membershipType, trialLengthDays, daysRemainingOnTrial);
            
            // 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("email", email);
            result.put("action", "updated");
            result.put("oldMembershipType", oldMembershipType);
            result.put("newMembershipType", membershipType);
            result.put("subscriptionInfo", subscriptionInfo);
            result.put("updateTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 账号 {} 订阅状态更新失败: {}", email, e.getMessage());
            
            // 检查是否是 SessionToken 无效的错误
            String errorMsg = e.getMessage();
            boolean isTokenInvalid = errorMsg != null && (
                errorMsg.contains("401") || 
                errorMsg.contains("403") || 
                errorMsg.contains("Unauthorized") ||
                errorMsg.contains("not_authenticated") ||
                errorMsg.contains("SessionToken无效") ||
                errorMsg.contains("SessionToken 无效") ||
                errorMsg.contains("已过期")
            );
            
            if (isTokenInvalid) {
                // SessionToken 无效，直接删除账号
                try {
                    accountMapper.deleteById(account.getId());
                    log.warn("⚠️ 账号 {} SessionToken无效/已过期，已从数据库删除", email);
                    
                    // 返回删除信息
                    Map<String, Object> result = new HashMap<>();
                    result.put("email", email);
                    result.put("action", "deleted");
                    result.put("reason", "SessionToken无效/已过期，账号已删除");
                    result.put("error", errorMsg);
                    result.put("deleteTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                    
                    return result;
                } catch (Exception deleteError) {
                    log.error("❌ 删除账号 {} 失败: {}", email, deleteError.getMessage());
                    throw new RuntimeException("删除账号失败: " + deleteError.getMessage(), deleteError);
                }
            }
            
            // 其他错误，抛出异常
            throw new RuntimeException("更新订阅状态失败: " + e.getMessage(), e);
        }
    }
    
    /**
     * 扣减次卡的换号次数
     * @param licenseCode 授权码
     */
    private void decrementCountCardSwitch(String licenseCode) {
        try {
            // 查询授权码
            com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.mycursor.entity.License> queryWrapper = 
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
            queryWrapper.eq("license_code", licenseCode);
            com.mycursor.entity.License license = licenseMapper.selectOne(queryWrapper);
            
            if (license == null) {
                log.warn("未找到授权码: {}", licenseCode);
                return;
            }
            
            // 如果是次卡，扣减次数
            if (com.mycursor.entity.License.LicenseType.COUNT_CARD.equals(license.getLicenseType())) {
                license.useSwitch();
                licenseMapper.updateById(license);
                
                log.info("次卡授权码 {} 换号成功，已使用 {}/{} 次", 
                    licenseCode, license.getUsedSwitches(), license.getTotalSwitches());
            }
        } catch (Exception e) {
            log.error("扣减次卡换号次数失败 - 授权码: {}, 错误: {}", licenseCode, e.getMessage());
            // 不抛出异常，避免影响主流程
        }
    }
    
    /**
     * 批量刷新所有可用账号的 AccessToken
     * 只刷新 is_available=1 的账号
     * 
     * @return 刷新结果统计
     */
    @Transactional
    public Map<String, Object> refreshAllAvailableAccountsAccessToken() {
        log.info("🔄 开始批量刷新所有可用账号的 AccessToken...");
        
        // 查询所有可用账号（is_available=1 且有 sessionToken）
        QueryWrapper<CursorAccount> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("is_available", true);
        queryWrapper.isNotNull("session_token");
        queryWrapper.isNull("access_token");
        queryWrapper.ne("session_token", "");
        List<CursorAccount> availableAccounts = accountMapper.selectList(queryWrapper);
        
        int totalCount = availableAccounts.size();
        int successCount = 0;
        int failedCount = 0;
        int skippedCount = 0;
        
        List<Map<String, Object>> successAccounts = new ArrayList<>();
        List<Map<String, Object>> failedAccounts = new ArrayList<>();
        
        log.info("📊 找到 {} 个可用账号（is_available=1 且有 sessionToken），开始逐个刷新...", totalCount);
        
        for (int i = 0; i < availableAccounts.size(); i++) {
            CursorAccount account = availableAccounts.get(i);
            int progress = i + 1;
            
            try {
                log.info("📍 [{}/{}] 正在刷新账号: {}", progress, totalCount, account.getEmail());
                
                String sessionToken = account.getSessionToken();
                if (sessionToken == null || sessionToken.trim().isEmpty()) {
                    log.warn("⚠️ 账号 {} 的 SessionToken 为空，跳过", account.getEmail());
                    skippedCount++;
                    continue;
                }
                
                // 调用 TokenRefreshService 获取 accessToken
                Map<String, String> tokens = tokenRefreshService.getAccessToken(sessionToken);
                
                if (tokens.containsKey("accessToken") && tokens.get("accessToken") != null && !tokens.get("accessToken").isEmpty()) {
                    String accessToken = tokens.get("accessToken");
                    String refreshToken = tokens.get("refreshToken");
                    
                    // 更新数据库
                    account.setAccessToken(accessToken);
                    account.setRefreshToken(refreshToken);
                    account.setUpdatedTime(LocalDateTime.now());
                    accountMapper.updateById(account);
                    
                    successCount++;
                    
                    // 记录成功信息
                    Map<String, Object> successInfo = new HashMap<>();
                    successInfo.put("email", account.getEmail());
                    successInfo.put("accessTokenLength", accessToken.length());
                    successInfo.put("daysLeft", tokens.get("daysLeft"));
                    successInfo.put("expireTime", tokens.get("expireTime"));
                    successAccounts.add(successInfo);
                    
                    log.info("✅ [{}/{}] 账号 {} AccessToken 刷新成功 (长度: {}, 剩余天数: {}, 过期时间: {})", 
                        progress, totalCount, account.getEmail(), accessToken.length(), 
                        tokens.get("daysLeft"), tokens.get("expireTime"));
                } else {
                    failedCount++;
                    log.warn("⚠️ [{}/{}] 账号 {} AccessToken 刷新失败：无法获取有效的 accessToken", 
                        progress, totalCount, account.getEmail());
                    
                    // 记录失败信息
                    Map<String, Object> failedInfo = new HashMap<>();
                    failedInfo.put("email", account.getEmail());
                    failedInfo.put("error", "无法获取有效的 accessToken");
                    failedAccounts.add(failedInfo);
                }
                
                // 添加延迟，避免频繁请求
                if (i < availableAccounts.size() - 1) {
                    Thread.sleep(500); // 每次请求间隔 500ms
                }
                
            } catch (Exception e) {
                failedCount++;
                log.error("❌ [{}/{}] 账号 {} AccessToken 刷新失败: {}", 
                    progress, totalCount, account.getEmail(), e.getMessage());
                
                // 记录失败信息
                Map<String, Object> failedInfo = new HashMap<>();
                failedInfo.put("email", account.getEmail());
                failedInfo.put("error", e.getMessage());
                failedAccounts.add(failedInfo);
            }
        }
        
        // 构建返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", totalCount);
        result.put("successCount", successCount);
        result.put("failedCount", failedCount);
        result.put("skippedCount", skippedCount);
        result.put("successAccounts", successAccounts);
        result.put("failedAccounts", failedAccounts);
        result.put("refreshTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("✅ 批量刷新 AccessToken 完成！");
        log.info("📊 总数: {}, 成功: {}, 失败: {}, 跳过: {}", 
            totalCount, successCount, failedCount, skippedCount);
        
        return result;
    }
    
    /**
     * 获取订阅状态统计
     * 
     * @return 统计信息
     */
    public Map<String, Object> getMembershipStatistics() {
        log.info("📊 获取订阅状态统计");
        
        // 总账号数
        long totalAccounts = accountMapper.selectCount(null);
        
        // 按订阅类型统计
        QueryWrapper<CursorAccount> freeQuery = new QueryWrapper<>();
        freeQuery.eq("membership_type", "free");
        long freeCount = accountMapper.selectCount(freeQuery);
        
        QueryWrapper<CursorAccount> proQuery = new QueryWrapper<>();
        proQuery.eq("membership_type", "pro");
        long proCount = accountMapper.selectCount(proQuery);
        
        QueryWrapper<CursorAccount> businessQuery = new QueryWrapper<>();
        businessQuery.eq("membership_type", "business");
        long businessCount = accountMapper.selectCount(businessQuery);
        
        QueryWrapper<CursorAccount> unknownQuery = new QueryWrapper<>();
        unknownQuery.eq("membership_type", "unknown");
        long unknownCount = accountMapper.selectCount(unknownQuery);
        
        // 最近检查时间
        QueryWrapper<CursorAccount> recentCheckQuery = new QueryWrapper<>();
        recentCheckQuery.isNotNull("membership_check_time");
        recentCheckQuery.orderByDesc("membership_check_time");
        recentCheckQuery.last("LIMIT 1");
        CursorAccount recentChecked = accountMapper.selectOne(recentCheckQuery);
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalAccounts", totalAccounts);
        result.put("freeCount", freeCount);
        result.put("proCount", proCount);
        result.put("businessCount", businessCount);
        result.put("unknownCount", unknownCount);
        result.put("lastCheckTime", recentChecked != null ? 
            recentChecked.getMembershipCheckTime().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : 
            null);
        result.put("statisticsTime", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("订阅状态统计 - 总数: {}, Free: {}, Pro: {}, Business: {}, Unknown: {}", 
            totalAccounts, freeCount, proCount, businessCount, unknownCount);
        
        return result;
    }
}
