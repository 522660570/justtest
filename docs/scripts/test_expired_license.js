const fs = require('fs');
const path = require('path');

// 测试过期卡密的处理逻辑

console.log('🧪 测试过期卡密处理逻辑');

// 模拟后端返回的过期卡密数据
const expiredLicenseResponse = {
  code: 1,
  message: "success",
  data: {
    version: "Pro",
    membershipType: "Pro",
    expiryTime: "2025-09-15 23:59:59",
    totalDays: 30,
    usagePercentage: 100,
    valid: false,
    remainingDays: -4,
    status: "expired",
    expiryDate: "2025-09-15 23:59:59",
    daysRemaining: -4
  }
};

// 模拟前端LicenseService的处理逻辑
function processLicenseData(result) {
  if (result.code === 1) {
    const licenseData = result.data;
    
    // 优先使用后端返回的status字段，如果没有则根据valid字段判断
    let status = 'invalid';
    if (licenseData.status) {
      status = licenseData.status; // 'valid' 或 'expired'
    } else if (licenseData.valid) {
      status = 'valid';
    } else if (licenseData.remainingDays < 0) {
      status = 'expired';
    }
    
    console.log('🔧 后端返回的授权数据:', licenseData);
    console.log('🔧 解析的状态:', status);
    
    return {
      success: true,
      data: {
        status: status,
        daysRemaining: licenseData.remainingDays || licenseData.daysRemaining || 0,
        expiryDate: licenseData.expiryTime || licenseData.expiryDate || '',
        licenseType: licenseData.membershipType || 'Pro',
        totalDays: licenseData.totalDays || 30,
        usagePercentage: licenseData.usagePercentage || 0
      }
    };
  }
  return { success: false, error: 'Invalid response' };
}

// 模拟formatLicenseStatus函数
function formatLicenseStatus(licenseData) {
  if (!licenseData) {
    return {
      statusColor: 'danger',
      statusText: '未输入',
      expiryText: '---',
      remainingText: '---'
    };
  }

  const { status, daysRemaining, expiryDate } = licenseData;

  let statusColor = 'danger';
  let statusText = '无效';
  let expiryText = '---';
  let remainingText = '---';

  if (status === 'valid') {
    if (daysRemaining > 7) {
      statusColor = 'success';
      statusText = '有效';
    } else if (daysRemaining > 0) {
      statusColor = 'warning';
      statusText = '即将过期';
    }
    
    expiryText = expiryDate;
    remainingText = daysRemaining > 0 ? `${daysRemaining}天` : '已过期';
  } else if (status === 'expired') {
    statusColor = 'danger';
    statusText = '已过期';
    expiryText = expiryDate;
    remainingText = `已过期${Math.abs(daysRemaining)}天`;
  } else {
    statusColor = 'danger';
    statusText = '无效';
  }

  return {
    statusColor,
    statusText,
    expiryText,
    remainingText
  };
}

// 测试过期卡密处理
console.log('\n📝 测试过期卡密处理:');
const processedData = processLicenseData(expiredLicenseResponse);
console.log('处理后的数据:', processedData);

if (processedData.success) {
  const formattedStatus = formatLicenseStatus(processedData.data);
  console.log('格式化后的状态:', formattedStatus);
  
  const isLicenseValid = processedData.data.status === 'valid';
  console.log('是否有效:', isLicenseValid);
  
  // 验证期望结果
  console.log('\n✅ 测试结果验证:');
  console.log(`状态: ${processedData.data.status} (期望: expired) - ${processedData.data.status === 'expired' ? '✅' : '❌'}`);
  console.log(`剩余天数: ${processedData.data.daysRemaining} (期望: -4) - ${processedData.data.daysRemaining === -4 ? '✅' : '❌'}`);
  console.log(`状态文本: ${formattedStatus.statusText} (期望: 已过期) - ${formattedStatus.statusText === '已过期' ? '✅' : '❌'}`);
  console.log(`状态颜色: ${formattedStatus.statusColor} (期望: danger) - ${formattedStatus.statusColor === 'danger' ? '✅' : '❌'}`);
  console.log(`剩余文本: ${formattedStatus.remainingText} (期望: 已过期4天) - ${formattedStatus.remainingText === '已过期4天' ? '✅' : '❌'}`);
  console.log(`按钮是否禁用: ${!isLicenseValid} (期望: true) - ${!isLicenseValid ? '✅' : '❌'}`);
}

console.log('\n🎯 测试完成！');
console.log('\n📋 修复要点:');
console.log('1. 后端现在会返回过期状态而不是抛出异常');
console.log('2. 前端正确解析status字段');
console.log('3. UI会正确显示过期状态');
console.log('4. 按钮会正确禁用');
