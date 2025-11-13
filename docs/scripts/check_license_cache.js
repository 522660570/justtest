#!/usr/bin/env node

/**
 * 检查和清理授权码缓存位置
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

console.log('🔍 检查授权码缓存位置...\n')

// 1. Electron配置文件位置
const electronConfigDir = path.join(os.homedir(), '.cursor-renewal-tool')
const electronConfigFile = path.join(electronConfigDir, 'config.json')

console.log('📁 Electron配置文件位置:')
console.log(`   目录: ${electronConfigDir}`)
console.log(`   文件: ${electronConfigFile}`)

if (fs.existsSync(electronConfigFile)) {
  try {
    const configData = fs.readFileSync(electronConfigFile, 'utf8')
    const config = JSON.parse(configData)
    
    console.log('✅ 找到Electron配置文件:')
    console.log(`   授权码: ${config.licenseCode || '无'}`)
    console.log(`   最后更新: ${config.lastUpdated || '无'}`)
    console.log(`   状态数据: ${config.licenseData ? '有' : '无'}`)
    
    if (config.licenseData) {
      console.log(`   状态详情: ${JSON.stringify(config.licenseData, null, 2)}`)
    }
  } catch (error) {
    console.log('❌ 配置文件格式错误:', error.message)
  }
} else {
  console.log('⚠️  Electron配置文件不存在')
}

console.log('\n' + '='.repeat(60) + '\n')

// 2. 浏览器localStorage位置（需要在浏览器中检查）
console.log('🌐 浏览器存储位置:')
console.log('   localStorage key: cursor-renewal-config')
console.log('   需要在浏览器开发者工具中检查:')
console.log('   1. 打开 http://localhost:5173')
console.log('   2. 按 F12 → Application → Local Storage')
console.log('   3. 查看 cursor-renewal-config 项')

console.log('\n' + '='.repeat(60) + '\n')

// 3. 其他可能的缓存位置
const otherCachePaths = [
  // 应用数据目录
  path.join(os.homedir(), 'AppData', 'Roaming', 'cursor-renewal-tool'),
  path.join(os.homedir(), 'AppData', 'Local', 'cursor-renewal-tool'),
  
  // 用户目录下的隐藏文件
  path.join(os.homedir(), '.cursor-renewal'),
  path.join(os.homedir(), '.cursor-config'),
  
  // 项目目录下的配置
  path.join(__dirname, 'config.json'),
  path.join(__dirname, '.config.json'),
  path.join(__dirname, 'user-config.json'),
]

console.log('🔍 检查其他可能的缓存位置:')
otherCachePaths.forEach(cachePath => {
  if (fs.existsSync(cachePath)) {
    console.log(`✅ 找到: ${cachePath}`)
    try {
      if (fs.statSync(cachePath).isFile()) {
        const content = fs.readFileSync(cachePath, 'utf8')
        console.log(`   内容预览: ${content.substring(0, 100)}...`)
      }
    } catch (error) {
      console.log(`   读取失败: ${error.message}`)
    }
  } else {
    console.log(`⚠️  不存在: ${cachePath}`)
  }
})

console.log('\n' + '='.repeat(60) + '\n')

// 4. 提供清理选项
console.log('🧹 清理授权码缓存:')
console.log('选择要清理的位置:')
console.log('1. 清理Electron配置文件')
console.log('2. 清理所有缓存位置')
console.log('3. 只查看，不清理')

// 如果有命令行参数，自动执行清理
const args = process.argv.slice(2)
if (args.includes('--clear-electron') || args.includes('-e')) {
  clearElectronConfig()
} else if (args.includes('--clear-all') || args.includes('-a')) {
  clearAllCache()
} else {
  console.log('\n💡 使用方法:')
  console.log('   node check_license_cache.js --clear-electron  # 清理Electron配置')
  console.log('   node check_license_cache.js --clear-all       # 清理所有缓存')
}

function clearElectronConfig() {
  console.log('\n🧹 清理Electron配置文件...')
  
  if (fs.existsSync(electronConfigFile)) {
    try {
      fs.unlinkSync(electronConfigFile)
      console.log('✅ 已删除Electron配置文件')
    } catch (error) {
      console.log('❌ 删除失败:', error.message)
    }
  }
  
  if (fs.existsSync(electronConfigDir)) {
    try {
      // 检查目录是否为空
      const files = fs.readdirSync(electronConfigDir)
      if (files.length === 0) {
        fs.rmdirSync(electronConfigDir)
        console.log('✅ 已删除空的配置目录')
      }
    } catch (error) {
      console.log('⚠️  配置目录可能不为空，未删除')
    }
  }
}

function clearAllCache() {
  console.log('\n🧹 清理所有授权码缓存...')
  
  // 清理Electron配置
  clearElectronConfig()
  
  // 清理其他可能的缓存文件
  otherCachePaths.forEach(cachePath => {
    if (fs.existsSync(cachePath)) {
      try {
        if (fs.statSync(cachePath).isFile()) {
          fs.unlinkSync(cachePath)
          console.log(`✅ 已删除: ${cachePath}`)
        } else if (fs.statSync(cachePath).isDirectory()) {
          fs.rmSync(cachePath, { recursive: true, force: true })
          console.log(`✅ 已删除目录: ${cachePath}`)
        }
      } catch (error) {
        console.log(`❌ 删除失败 ${cachePath}: ${error.message}`)
      }
    }
  })
  
  console.log('\n💡 还需要手动清理浏览器localStorage:')
  console.log('   在浏览器开发者工具中删除 cursor-renewal-config')
}

console.log('\n🎯 完成授权码缓存检查!')
