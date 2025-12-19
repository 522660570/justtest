#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')

// 获取日志文件路径
const getLogPath = () => {
  const logDir = path.join(os.homedir(), '.cursor-renewal-tool', 'logs')
  const today = new Date().toISOString().slice(0, 10)
  const logFile = path.join(logDir, `app-${today}.log`)
  return { logDir, logFile }
}

// 主函数
async function main() {
  try {
    console.log('🔍 查找日志文件...')
    
    const { logDir, logFile } = getLogPath()
    
    console.log(`📁 日志目录: ${logDir}`)
    console.log(`📄 今日日志文件: ${logFile}`)
    console.log()
    
    // 检查日志目录是否存在
    if (!fs.existsSync(logDir)) {
      console.log('❌ 日志目录不存在，应用程序可能还没有运行过')
      return
    }
    
    // 列出所有日志文件
    console.log('📋 可用的日志文件:')
    const files = fs.readdirSync(logDir)
      .filter(file => file.startsWith('app-') && file.endsWith('.log'))
      .sort()
      .reverse() // 最新的在前面
    
    if (files.length === 0) {
      console.log('   没有找到日志文件')
      return
    }
    
    files.forEach((file, index) => {
      const filePath = path.join(logDir, file)
      const stats = fs.statSync(filePath)
      const size = (stats.size / 1024).toFixed(1) + 'KB'
      const modified = stats.mtime.toLocaleString()
      console.log(`   ${index + 1}. ${file} (${size}, 修改时间: ${modified})`)
    })
    
    console.log()
    
    // 读取最新的日志文件
    const latestLogFile = path.join(logDir, files[0])
    console.log(`📖 显示最新日志文件内容 (${files[0]}):`)
    console.log('=' .repeat(80))
    
    const content = fs.readFileSync(latestLogFile, 'utf8')
    const lines = content.split('\n')
    
    // 显示最后50行
    const recentLines = lines.slice(-50).filter(line => line.trim())
    
    if (recentLines.length === 0) {
      console.log('日志文件为空')
    } else {
      recentLines.forEach(line => console.log(line))
    }
    
    console.log('=' .repeat(80))
    console.log(`📊 总共 ${lines.length} 行，显示最后 ${recentLines.length} 行非空内容`)
    
    // 如果有错误或警告，单独显示
    const errorLines = lines.filter(line => line.includes('[ERROR]') || line.includes('[FATAL]'))
    if (errorLines.length > 0) {
      console.log()
      console.log('🚨 发现的错误信息:')
      console.log('-'.repeat(80))
      errorLines.forEach(line => console.log(line))
    }
    
  } catch (error) {
    console.error('❌ 读取日志文件时发生错误:', error.message)
  }
}

// 运行脚本
if (require.main === module) {
  main()
}

module.exports = { getLogPath }
