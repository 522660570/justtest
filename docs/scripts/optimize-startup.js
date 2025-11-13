#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 启动速度优化工具')
console.log('=' .repeat(50))

// 检查当前配置
const packageJsonPath = path.join(__dirname, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

console.log('📋 当前配置:')
console.log(`   - 压缩级别: ${packageJson.build.compression}`)
console.log(`   - ASAR打包: ${packageJson.build.asar}`)
console.log(`   - 执行级别: ${packageJson.build.win.requestedExecutionLevel}`)

// 优化建议
console.log('\n💡 优化建议:')
console.log('1. 使用SSD硬盘可以显著提升启动速度')
console.log('2. 关闭不必要的后台程序')
console.log('3. 确保有足够的可用内存')
console.log('4. 考虑使用NSIS安装器而不是便携版')

// 性能测试
console.log('\n⏱️  性能测试建议:')
console.log('1. 冷启动: 重启电脑后第一次启动')
console.log('2. 热启动: 关闭后立即重新启动')
console.log('3. 对比测试: 与其他Electron应用对比')

// 生成优化报告
const report = {
  timestamp: new Date().toISOString(),
  config: {
    compression: packageJson.build.compression,
    asar: packageJson.build.asar,
    executionLevel: packageJson.build.win.requestedExecutionLevel
  },
  optimizations: [
    '减少启动时日志记录',
    '优化窗口创建过程',
    '使用normal压缩级别',
    '启用ASAR打包',
    '降低权限要求'
  ],
  recommendations: [
    '使用SSD硬盘',
    '关闭后台程序',
    '确保足够内存',
    '考虑使用安装器版本'
  ]
}

const reportPath = path.join(__dirname, 'startup-optimization-report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

console.log(`\n📊 优化报告已保存到: ${reportPath}`)
console.log('\n✅ 优化完成！重新构建应用程序以应用更改。')


