#!/usr/bin/env node

/**
 * 图标转换工具
 * 帮助生成各平台所需的图标格式
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 图标转换工具\n');

const buildDir = path.join(__dirname, '../build');
const icoPath = path.join(buildDir, 'icon.ico');
const icnsPath = path.join(buildDir, 'icon.icns');
const pngPath = path.join(buildDir, 'icon.png');

// 检查图标文件
function checkIcons() {
  console.log('📋 检查现有图标文件:\n');
  
  const hasIco = fs.existsSync(icoPath);
  const hasIcns = fs.existsSync(icnsPath);
  const hasPng = fs.existsSync(pngPath);
  
  console.log(`  ${hasIco ? '✅' : '❌'} Windows 图标 (icon.ico): ${hasIco ? '已存在' : '缺失'}`);
  console.log(`  ${hasIcns ? '✅' : '❌'} macOS 图标 (icon.icns): ${hasIcns ? '已存在' : '缺失'}`);
  console.log(`  ${hasPng ? '✅' : '❌'} Linux 图标 (icon.png): ${hasPng ? '已存在' : '缺失'}\n`);
  
  return { hasIco, hasIcns, hasPng };
}

// 提供转换指南
function provideGuide(status) {
  const missing = [];
  if (!status.hasIco) missing.push('icon.ico');
  if (!status.hasIcns) missing.push('icon.icns');
  if (!status.hasPng) missing.push('icon.png');
  
  if (missing.length === 0) {
    console.log('🎉 所有图标文件都已准备就绪！\n');
    console.log('现在你可以开始打包了：');
    console.log('  npm run build:win-all   # Windows 全架构');
    console.log('  npm run build:mac-all   # macOS 全架构');
    console.log('  npm run build:linux-all # Linux 全架构');
    return true;
  }
  
  console.log('⚠️  缺失以下图标文件，需要先准备：\n');
  
  if (!status.hasIco) {
    console.log('📌 Windows 图标 (icon.ico)');
    console.log('   方法1: 在线转换 PNG -> ICO');
    console.log('   - https://www.aconvert.com/cn/icon/png-to-ico/');
    console.log('   - https://www.icoconverter.com/');
    console.log('   方法2: 使用 Photoshop 或其他工具导出为 ICO');
    console.log('   推荐尺寸: 256x256\n');
  }
  
  if (!status.hasIcns) {
    console.log('📌 macOS 图标 (icon.icns)');
    console.log('   方法1: 在线转换 PNG -> ICNS');
    console.log('   - https://cloudconvert.com/png-to-icns');
    console.log('   - https://iconverticons.com/online/');
    console.log('   方法2: 在 macOS 上使用 iconutil 命令行工具');
    console.log('   推荐源文件: 1024x1024 PNG\n');
  }
  
  if (!status.hasPng) {
    console.log('📌 Linux 图标 (icon.png)');
    console.log('   方法1: 从 ICO 转换');
    console.log('   - https://www.aconvert.com/cn/icon/ico-to-png/');
    console.log('   方法2: 直接准备 PNG 文件');
    console.log('   推荐尺寸: 512x512 或 1024x1024\n');
  }
  
  console.log('💡 提示:');
  console.log('   - 准备一个 1024x1024 的 PNG 源文件最方便');
  console.log('   - 然后使用在线工具转换为其他格式');
  console.log('   - 转换后的文件放到 build/ 目录即可\n');
  
  return false;
}

// 生成平台检测信息
function showPlatformInfo() {
  const platform = process.platform;
  console.log('🖥️  当前平台信息:\n');
  console.log(`   操作系统: ${platform}`);
  
  if (platform === 'win32') {
    console.log('   推荐打包: Windows (本地) + Linux (WSL) + macOS (CI/CD)');
    console.log('\n   Windows 打包命令:');
    console.log('     npm run build:win-all');
    console.log('\n   Linux 打包 (需要 WSL):');
    console.log('     wsl');
    console.log('     cd /mnt/d/cursor-my/cursor-refill-tool');
    console.log('     npm run build:linux-all');
    console.log('\n   macOS 打包:');
    console.log('     只能在 macOS 上打包，或使用 GitHub Actions');
  } else if (platform === 'darwin') {
    console.log('   推荐打包: macOS (本地) + Linux (本地) + Windows (CI/CD)');
    console.log('\n   macOS 打包命令:');
    console.log('     npm run build:mac-all');
    console.log('\n   Linux 打包命令:');
    console.log('     npm run build:linux-all');
    console.log('\n   Windows 打包:');
    console.log('     可以尝试本地打包，或使用 GitHub Actions');
  } else {
    console.log('   推荐打包: Linux (本地) + macOS/Windows (CI/CD)');
    console.log('\n   Linux 打包命令:');
    console.log('     npm run build:linux-all');
  }
  console.log('\n');
}

// 主函数
function main() {
  const status = checkIcons();
  const ready = provideGuide(status);
  
  console.log('─'.repeat(60));
  showPlatformInfo();
  
  console.log('─'.repeat(60));
  console.log('\n📚 详细文档:');
  console.log('   BUILD_MULTI_PLATFORM_GUIDE.md - 多平台打包完整指南');
  console.log('   docs/BUILD_GUIDE.md - 基础构建指南');
  console.log('   BUILD_MAC_GUIDE.md - macOS 专用指南\n');
  
  if (!ready) {
    console.log('⚠️  请先准备缺失的图标文件，然后重新运行此脚本检查。\n');
    process.exit(1);
  }
  
  process.exit(0);
}

main();

