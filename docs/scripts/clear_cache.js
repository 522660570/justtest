#!/usr/bin/env node

/**
 * 前端缓存清理脚本
 * 模拟用户首次打开应用的状态
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

console.log('🧹 开始清理前端缓存，模拟首次打开应用...\n')

// 清理项目缓存目录
const cacheDirs = [
  // 项目构建缓存
  path.join(__dirname, 'dist'),
  path.join(__dirname, '.vite'),
  path.join(__dirname, 'node_modules/.vite'),
  path.join(__dirname, 'node_modules/.cache'),
  
  // Electron缓存
  path.join(__dirname, 'electron/dist'),
  
  // 其他可能的缓存
  path.join(__dirname, '.cache'),
  path.join(__dirname, 'build'),
]

// 清理配置文件
const configFiles = [
  path.join(__dirname, 'config.json'),
  path.join(__dirname, 'electron/config.json'),
]

/**
 * 递归删除目录
 */
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true })
      console.log(`✅ 已删除: ${dirPath}`)
      return true
    } catch (error) {
      console.log(`❌ 删除失败: ${dirPath} - ${error.message}`)
      return false
    }
  } else {
    console.log(`⚠️  不存在: ${dirPath}`)
    return true
  }
}

/**
 * 删除文件
 */
function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath)
      console.log(`✅ 已删除: ${filePath}`)
      return true
    } catch (error) {
      console.log(`❌ 删除失败: ${filePath} - ${error.message}`)
      return false
    }
  } else {
    console.log(`⚠️  不存在: ${filePath}`)
    return true
  }
}

// 1. 清理项目缓存目录
console.log('📁 清理项目缓存目录:')
cacheDirs.forEach(dir => {
  removeDir(dir)
})

console.log('\n📄 清理配置文件:')
configFiles.forEach(file => {
  removeFile(file)
})

// 2. 清理系统级缓存
console.log('\n💻 清理系统级缓存:')

// Electron用户数据目录
const electronAppName = 'cursor-manager' // 根据您的应用名称调整
const electronUserDataPaths = []

if (process.platform === 'win32') {
  electronUserDataPaths.push(
    path.join(os.homedir(), 'AppData', 'Roaming', electronAppName),
    path.join(os.homedir(), 'AppData', 'Local', electronAppName),
  )
} else if (process.platform === 'darwin') {
  electronUserDataPaths.push(
    path.join(os.homedir(), 'Library', 'Application Support', electronAppName),
    path.join(os.homedir(), 'Library', 'Caches', electronAppName),
  )
} else if (process.platform === 'linux') {
  electronUserDataPaths.push(
    path.join(os.homedir(), '.config', electronAppName),
    path.join(os.homedir(), '.cache', electronAppName),
  )
}

electronUserDataPaths.forEach(dir => {
  removeDir(dir)
})

// 3. 清理浏览器存储（需要手动操作）
console.log('\n🌐 浏览器存储清理提示:')
console.log('请手动清理以下浏览器存储:')
console.log('1. 打开浏览器开发者工具 (F12)')
console.log('2. 进入 Application/Storage 标签')
console.log('3. 清理以下项目:')
console.log('   - Local Storage (http://localhost:5173)')
console.log('   - Session Storage (http://localhost:5173)')
console.log('   - IndexedDB')
console.log('   - Cookies')
console.log('   - Cache Storage')

// 4. 清理Node.js缓存
console.log('\n📦 清理Node.js缓存:')
try {
  const { execSync } = require('child_process')
  console.log('正在清理npm缓存...')
  execSync('npm cache clean --force', { stdio: 'inherit' })
  console.log('✅ npm缓存清理完成')
} catch (error) {
  console.log('❌ npm缓存清理失败:', error.message)
}

console.log('\n🎉 缓存清理完成！')
console.log('\n📋 后续步骤:')
console.log('1. 重新安装依赖: npm install')
console.log('2. 启动开发服务器: npm run dev')
console.log('3. 测试应用首次启动体验')

console.log('\n💡 首次启动检查清单:')
console.log('- [ ] 没有缓存的授权码')
console.log('- [ ] 没有缓存的账号信息')
console.log('- [ ] 没有保存的配置文件')
console.log('- [ ] 界面显示初始状态')
console.log('- [ ] 需要重新输入授权码')
