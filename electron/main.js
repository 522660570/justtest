const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs').promises
const os = require('os')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const isDev = process.env.NODE_ENV === 'development'

// 🔧 调试模式开关（从 package.json 读取）
const packageJson = require('../package.json')
const DEBUG_MODE = packageJson.debugMode || false
console.log('🔧 调试模式:', DEBUG_MODE ? '开启' : '关闭')

// 简化的环境检测
const getAppEnvironment = () => {
  return isDev ? 'development' : 'production'
}

// 检查管理员权限
const checkAdminRights = async () => {
  if (process.platform !== 'win32') {
    return true // 非Windows系统假设有权限
  }
  
  try {
    // 使用net session命令检查管理员权限
    const result = await execAsync('net session >nul 2>&1 && echo "admin" || echo "user"')
    return result.stdout && result.stdout.includes('admin')
  } catch (error) {
    console.warn('⚠️ 无法检查管理员权限:', error.message)
    return false
  }
}

// 日志文件路径
const getLogPath = () => {
  const logDir = path.join(os.homedir(), '.cursor-renewal-tool', 'logs')
  const logFile = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`)
  return { logDir, logFile }
}

// 确保日志目录存在
const ensureLogDir = async () => {
  const { logDir } = getLogPath()
  try {
    await fs.access(logDir)
  } catch (error) {
    await fs.mkdir(logDir, { recursive: true })
  }
}

// 写入日志
const writeLog = async (level, message, error = null) => {
  try {
    await ensureLogDir()
    const { logFile } = getLogPath()
    const timestamp = new Date().toISOString()
    let logEntry = `[${timestamp}] [${level}] ${message}`
    
    if (error) {
      logEntry += `\nError: ${error.message}`
      if (error.stack) {
        logEntry += `\nStack: ${error.stack}`
      }
    }
    
    logEntry += '\n'
    
    // 同时输出到控制台
    console.log(logEntry.trim())
    
    // 写入文件
    await fs.appendFile(logFile, logEntry, 'utf8')
  } catch (logError) {
    console.error('写入日志失败:', logError)
  }
}

// 全局错误处理
process.on('uncaughtException', async (error) => {
  await writeLog('FATAL', '未捕获的异常', error)
  console.error('未捕获的异常:', error)
  
  // 显示错误对话框
  if (mainWindow) {
    dialog.showErrorBox('应用程序错误', `发生了未预期的错误：\n${error.message}\n\n请查看日志文件获取详细信息。`)
  }
  
  // 延迟退出，让日志写入完成
  setTimeout(() => {
    app.exit(1)
  }, 1000)
})

process.on('unhandledRejection', async (reason, promise) => {
  await writeLog('ERROR', '未处理的Promise拒绝', reason instanceof Error ? reason : new Error(String(reason)))
  console.error('未处理的Promise拒绝:', reason)
})

// 保持对window对象的全局引用，避免被垃圾回收
let mainWindow

async function createWindow() {
  try {
    // 生产模式下跳过所有检查，直接创建窗口
    const preloadPath = path.join(__dirname, 'preload.js')
    
    // 检查管理员权限（简化版，减少启动时间）
    const hasAdminRights = await checkAdminRights()
    if (hasAdminRights) {
      console.log('✅ 已获得管理员权限')
    } else {
      console.warn('⚠️ 未获得管理员权限')
    }
    
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 700,
      minWidth: 1000,
      minHeight: 500,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: preloadPath,
        devTools: DEBUG_MODE, // 根据调试模式开关控制
        webSecurity: true
      },
      show: false, // 先不显示，等准备好了再显示
      titleBarStyle: 'hidden', // 隐藏标题栏
      frame: false, // 无边框窗口
      center: true, // 居中显示
      resizable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      focusable: true,
      alwaysOnTop: false,
      fullscreenable: true,
      skipTaskbar: false, // 确保在任务栏显示
      title: 'Cursor Manager',
      autoHideMenuBar: true, // 自动隐藏菜单栏
      thickFrame: false, // 去除窗口边框
      transparent: false, // 确保不透明
      backgroundColor: '#667eea', // 设置背景色与渐变一致
      vibrancy: 'none', // 禁用毛玻璃效果
      visualEffectState: 'active' // 确保视觉效果正常
    })

    // 加载应用
    if (isDev && process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:5173')
      // 开发模式下打开开发者工具
      mainWindow.webContents.openDevTools()
    } else {
      // 生产模式：根据打包后的实际路径加载
      let indexPath
      if (app.isPackaged) {
        // 打包后的路径
        indexPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html')
      } else {
        // 本地构建测试路径
        indexPath = path.join(__dirname, '../dist/index.html')
      }
      
      console.log('🔍 尝试加载页面:', indexPath)
      console.log('📦 是否已打包:', app.isPackaged)
      console.log('📂 resourcesPath:', process.resourcesPath)
      console.log('📂 __dirname:', __dirname)
      
      mainWindow.loadFile(indexPath).catch(err => {
        console.error('❌ 加载页面失败:', err)
        // 如果加载失败，显示错误信息
        mainWindow.loadURL(`data:text/html,<h1 style="color:white;background:#333;padding:20px;">页面加载失败<br>错误: ${err.message}<br>路径: ${indexPath}</h1>`)
      })
    }

    // 调试功能（仅在调试模式下启用）
    if (DEBUG_MODE) {
      console.log('🔧 调试功能已启用: F12 打开开发者工具, Ctrl+Shift+D 打开调试面板')
      
      // F12 打开/关闭开发者工具
      mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
          event.preventDefault()
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools()
          } else {
            mainWindow.webContents.openDevTools()
          }
        }
      })
      
      // 开发环境默认打开开发者工具
      if (isDev) {
        setTimeout(() => {
          mainWindow.webContents.openDevTools()
        }, 1000)
      }
    } else {
      // 生产模式：禁用右键菜单
      mainWindow.webContents.on('context-menu', (event) => {
        event.preventDefault()
      })
    }
    
    // 当窗口准备好显示时
    mainWindow.once('ready-to-show', () => {
      // 立即显示窗口，不等待任何异步操作
      mainWindow.show()
      mainWindow.focus()
    })
    
    // 监听加载失败事件（简化版）
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`页面加载失败: ${errorDescription} (${errorCode}) - ${validatedURL}`)
      dialog.showErrorBox('加载失败', `页面加载失败：\n${errorDescription}`)
    })
    
    // 监听渲染进程崩溃（简化版）
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error(`渲染进程崩溃: ${details.reason}`)
      dialog.showErrorBox('进程崩溃', `渲染进程崩溃：\n原因: ${details.reason}`)
      app.relaunch()
      app.exit()
    })

    // 当窗口被关闭时
    mainWindow.on('closed', () => {
      mainWindow = null
    })

    // 处理窗口关闭事件
    mainWindow.on('close', (event) => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    // 防止新窗口打开
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      require('electron').shell.openExternal(url)
      return { action: 'deny' }
    })
    
    // 禁用开发者工具和右键菜单
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault()
    })
    
    // 禁用所有开发者工具快捷键
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // 禁用 F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U 等
      if (input.key === 'F12' || 
          (input.control && input.shift && input.key === 'I') ||
          (input.control && input.shift && input.key === 'J') ||
          (input.control && input.key === 'U') ||
          (input.control && input.key === 'Shift' && input.key === 'I')) {
        event.preventDefault()
      }
    })
    
    // 禁用右键菜单
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault()
    })
    
    // 禁用拖拽文件
    mainWindow.webContents.on('will-navigate', (event) => {
      event.preventDefault()
    })
    
  } catch (error) {
    await writeLog('FATAL', '创建窗口时发生错误', error)
    
    dialog.showErrorBox('启动失败', `应用程序启动失败：\n${error.message}\n\n请查看日志文件获取详细信息。`)
    
    app.quit()
  }
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(async () => {
  // 简化启动逻辑，减少日志写入
  console.log('🚀 应用程序启动中...')
  
  // 立即创建窗口，不等待任何检查
  createWindow()

  app.on('activate', () => {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}).catch((error) => {
  console.error('Electron启动失败:', error)
  app.quit()
})

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，除非用户用Cmd + Q确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 在这个文件中，你可以包含应用程序剩余的所有主进程代码
// 也可以拆分成几个文件，然后用require导入

// IPC通信处理
ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options)
  return result
})

ipcMain.handle('show-error-box', async (event, title, content) => {
  dialog.showErrorBox(title, content)
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-app-path', () => {
  return app.getAppPath()
})

// 处理应用退出
ipcMain.handle('quit-app', () => {
  app.quit()
})

// 处理窗口控制
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close()
  }
})

// 自定义标题栏拖拽
ipcMain.handle('start-drag', (event, data) => {
  if (mainWindow) {
    const { x, y } = data
    const [currentX, currentY] = mainWindow.getPosition()
    const [mouseX, mouseY] = mainWindow.getBounds()
    
    // 计算鼠标在窗口内的相对位置
    const offsetX = x - mouseX
    const offsetY = y - mouseY
    
    // 开始拖拽
    mainWindow.setPosition(x - offsetX, y - offsetY)
  }
})

// 获取窗口状态
ipcMain.handle('get-window-state', () => {
  if (mainWindow) {
    return {
      isMaximized: mainWindow.isMaximized(),
      isMinimized: mainWindow.isMinimized(),
      isFullScreen: mainWindow.isFullScreen()
    }
  }
  return null
})

// 打开购买页面
ipcMain.handle('open-purchase-page', async (event, url) => {
  try {
    writeLog('INFO', `打开购买页面: ${url}`)
    
    // 使用shell.openExternal打开外部浏览器
    await shell.openExternal(url)
    
    writeLog('INFO', '成功打开购买页面')
    return { success: true }
  } catch (error) {
    writeLog('ERROR', `打开购买页面失败: ${error.message}`)
    return { success: false, error: error.message }
  }
})

// 检查管理员权限
ipcMain.handle('check-admin-rights', async () => {
  return await checkAdminRights()
})

// 获取应用环境信息（简化版）
ipcMain.handle('get-app-environment', () => {
  return {
    environment: getAppEnvironment(),
    isDev: isDev
  }
})

// 获取调试模式状态
ipcMain.handle('get-debug-mode', () => {
  return DEBUG_MODE
})

// 安全设置
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault()
    require('electron').shell.openExternal(navigationURL)
  })
})

// 防止导航到外部URL
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationURL) => {
    const parsedUrl = new URL(navigationURL)
    
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault()
    }
  })
})

// 配置文件路径
const getConfigPath = () => {
  const configDir = path.join(os.homedir(), '.cursor-renewal-tool')
  const configFile = path.join(configDir, 'config.json')
  return { configDir, configFile }
}

// 确保配置目录存在
const ensureConfigDir = async () => {
  const { configDir } = getConfigPath()
  try {
    await fs.access(configDir)
  } catch (error) {
    await fs.mkdir(configDir, { recursive: true })
    console.log('📁 创建配置目录:', configDir)
  }
}

// IPC处理程序 - 配置文件操作
ipcMain.handle('read-config-file', async () => {
  try {
    const { configFile } = getConfigPath()
    await ensureConfigDir()
    const data = await fs.readFile(configFile, 'utf8')
    return data
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null // 文件不存在
    }
    throw error
  }
})

ipcMain.handle('write-config-file', async (event, data) => {
  try {
    const { configFile } = getConfigPath()
    await ensureConfigDir()
    await fs.writeFile(configFile, data, 'utf8')
    return true
  } catch (error) {
    throw error
  }
})

ipcMain.handle('delete-config-file', async () => {
  try {
    const { configFile } = getConfigPath()
    await fs.unlink(configFile)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true // 文件不存在，认为删除成功
    }
    throw error
  }
})

ipcMain.handle('get-config-file-info', async () => {
  try {
    const { configFile } = getConfigPath()
    const stats = await fs.stat(configFile)
    const data = await fs.readFile(configFile, 'utf8')
    const config = JSON.parse(data)
    
    return {
      path: configFile,
      size: stats.size,
      modified: stats.mtime,
      hasLicenseCode: !!config.licenseCode,
      hasLicenseData: !!config.licenseData,
      lastUpdated: config.lastUpdated,
      dataLastUpdated: config.dataLastUpdated
    }
  } catch (error) {
    throw error
  }
})

// CursorService需要的IPC处理程序
ipcMain.handle('get-platform', () => {
  return os.platform()
})

ipcMain.handle('get-homedir', () => {
  return os.homedir()
})

ipcMain.handle('path-join', (event, ...args) => {
  return path.join(...args)
})

ipcMain.handle('fs-access', async (event, filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    return false
  }
})

ipcMain.handle('fs-read-file', async (event, filePath, encoding = 'utf8') => {
  try {
    const data = await fs.readFile(filePath, encoding)
    return data
  } catch (error) {
    throw error
  }
})

ipcMain.handle('fs-write-file', async (event, filePath, data, encoding = 'utf8') => {
  try {
    // ⚠️ 写入前检查并移除只读属性（防止 EPERM 错误）
    try {
      const stats = await fs.stat(filePath)
      // Windows 下检查只读属性
      if (process.platform === 'win32' && (stats.mode & 0o200) === 0) {
        console.log('⚠️ 文件是只读的，尝试移除只读属性:', filePath)
        await fs.chmod(filePath, 0o666) // 设置为可读写
        console.log('✅ 成功移除只读属性')
      }
    } catch (error) {
      // 文件不存在或无法访问，忽略
      if (error.code !== 'ENOENT') {
        console.warn('⚠️ 检查只读属性失败:', error.message)
      }
    }
    
    await fs.writeFile(filePath, data, encoding)
    return true
  } catch (error) {
    throw error
  }
})

ipcMain.handle('sqlite-query', async (event, dbPath, query, params = []) => {
  try {
    // 动态导入sqlite3
    const sqlite3 = require('sqlite3').verbose()
    const db = new sqlite3.Database(dbPath)
    
    const result = await new Promise((resolve, reject) => {
      if (query.toLowerCase().startsWith('select')) {
        db.all(query, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      } else {
        db.run(query, params, function(err) {
          if (err) reject(err)
          else resolve({ changes: this.changes, lastID: this.lastID })
        })
      }
    })
    
    // 关闭数据库连接
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) console.warn('⚠️ 关闭数据库连接时出现警告:', err.message)
        resolve()
      })
    })
    
    return result
  } catch (error) {
    throw error
  }
})

ipcMain.handle('exec-command', async (event, command) => {
  try {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    const result = await execAsync(command)
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      error: false,
      exitCode: 0
    }
  } catch (error) {
    // ⚠️ execAsync 在命令返回非0退出码时会抛出错误
    // 但这对于某些命令（如tasklist找不到进程）是正常的
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      error: true,
      exitCode: error.code || 1
    }
  }
})

// 非阻塞的命令执行，用于启动应用程序
ipcMain.handle('exec-command-async', async (event, command) => {
  try {
    const { exec } = require('child_process')
    
    console.log('🚀 异步执行命令:', command)
    
    // 不等待命令完成，直接返回
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ 命令执行过程中的信息:', error.message)
      }
      if (stdout) console.log('📤 stdout:', stdout)
      if (stderr) console.log('📤 stderr:', stderr)
    })
    
    return {
      success: true,
      pid: child.pid,
      message: '命令已启动'
    }
  } catch (error) {
    console.error('❌ exec-command-async 错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// 专门用于启动应用程序的IPC处理程序
ipcMain.handle('spawn-detached', async (event, command, args = []) => {
  try {
    const { spawn } = require('child_process')
    
    console.log('🚀 启动命令:', command, args)
    
    let child
    if (process.platform === 'win32') {
      // Windows特殊处理：直接启动exe文件
      child = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
        shell: false,  // Windows上不使用shell
        windowsHide: false  // 显示窗口
      })
    } else {
      // macOS和Linux
      child = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
        shell: true
      })
    }
    
    child.unref() // 让子进程独立运行
    
    return {
      success: true,
      pid: child.pid,
      message: '应用程序已启动'
    }
  } catch (error) {
    console.error('❌ spawn-detached 错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// 查找Cursor可执行文件
ipcMain.handle('find-cursor-executable', async () => {
  try {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    // 方法1: 通过正在运行的进程查找
    try {
      const result = await execAsync('powershell "Get-Process -Name Cursor -ErrorAction SilentlyContinue | Select-Object -First 1 | Select-Object -ExpandProperty Path"', { timeout: 5000 })
      const processPath = result.stdout.trim()
      if (processPath && processPath !== '') {
        try {
          await fs.access(processPath)
          console.log('✅ 通过进程找到Cursor路径:', processPath)
          return { success: true, path: processPath, method: 'process' }
        } catch (e) {
          console.log('⚠️ 进程路径无法访问:', processPath)
        }
      }
    } catch (e) {
      console.log('⚠️ 无法通过进程查找Cursor')
    }
    
    // 方法2: 通过注册表查找
    try {
      const regResult = await execAsync('reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "Cursor" 2>nul | findstr "DisplayIcon"', { timeout: 5000 })
      const regLines = regResult.stdout.split('\n')
      for (const line of regLines) {
        if (line.includes('DisplayIcon') && line.includes('Cursor.exe')) {
          const match = line.match(/REG_SZ\s+(.+\.exe)/i)
          if (match) {
            const regPath = match[1].trim()
            try {
              await fs.access(regPath)
              console.log('✅ 通过注册表找到Cursor路径:', regPath)
              return { success: true, path: regPath, method: 'registry' }
            } catch (e) {
              console.log('⚠️ 注册表路径无法访问:', regPath)
            }
          }
        }
      }
    } catch (e) {
      console.log('⚠️ 无法通过注册表查找Cursor')
    }
    
    // 方法3: 在常见安装位置搜索
    const commonPaths = [
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Cursor\\Cursor.exe',
      'C:\\Program Files\\Cursor\\Cursor.exe',
      'C:\\Program Files (x86)\\Cursor\\Cursor.exe',
      'D:\\Cursor\\Cursor.exe',
      'E:\\Cursor\\Cursor.exe',
      'F:\\Cursor\\Cursor.exe'
    ]
    
    const homeDir = os.homedir()
    const username = process.env.USERNAME || process.env.USER || 'User'
    
    for (let commonPath of commonPaths) {
      // 展开环境变量
      commonPath = commonPath.replace('%USERNAME%', username)
      commonPath = commonPath.replace('~', homeDir)
      
      try {
        await fs.access(commonPath)
        console.log('✅ 在常见位置找到Cursor路径:', commonPath)
        return { success: true, path: commonPath, method: 'common' }
      } catch (e) {
        // 继续搜索
      }
    }
    
    // 方法4: 在整个系统中搜索 Cursor.exe
    try {
      const searchResult = await execAsync('powershell "Get-ChildItem -Path C:\\ -Recurse -Name \'Cursor.exe\' -ErrorAction SilentlyContinue | Select-Object -First 3"', { timeout: 15000 })
      const searchPaths = searchResult.stdout.split('\n').filter(p => p.trim())
      for (const relativePath of searchPaths) {
        const fullPath = `C:\\${relativePath.trim()}`
        try {
          await fs.access(fullPath)
          console.log('✅ 通过全局搜索找到Cursor路径:', fullPath)
          return { success: true, path: fullPath, method: 'search' }
        } catch (e) {
          // 继续搜索
        }
      }
    } catch (e) {
      console.log('⚠️ 全局搜索失败')
    }
    
    return { success: false, error: '未找到Cursor可执行文件' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 查找Cursor数据库文件
ipcMain.handle('find-cursor-db', async () => {
  try {
    const homeDir = os.homedir()
    
    // 可能的Cursor数据库路径
    const possiblePaths = [
      // Windows路径
      path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
      path.join(homeDir, 'AppData', 'Local', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
      path.join(homeDir, 'AppData', 'Roaming', 'cursor', 'User', 'globalStorage', 'state.vscdb'),
      path.join(homeDir, 'AppData', 'Local', 'cursor', 'User', 'globalStorage', 'state.vscdb'),
      
      // 其他可能的路径
      path.join(homeDir, '.cursor', 'User', 'globalStorage', 'state.vscdb'),
      path.join(homeDir, '.config', 'cursor', 'User', 'globalStorage', 'state.vscdb'),
      
      // macOS路径
      path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
      path.join(homeDir, 'Library', 'Application Support', 'cursor', 'User', 'globalStorage', 'state.vscdb'),
      
      // Linux路径
      path.join(homeDir, '.config', 'Cursor', 'User', 'globalStorage', 'state.vscdb')
    ]
    
    const foundPaths = []
    
    for (const dbPath of possiblePaths) {
      try {
        await fs.access(dbPath)
        const stats = await fs.stat(dbPath)
        foundPaths.push({
          path: dbPath,
          size: stats.size,
          modified: stats.mtime,
          exists: true
        })
      } catch (error) {
        // 文件不存在，跳过
      }
    }
    
    // 也尝试通过搜索找到所有的state.vscdb文件
    try {
      let searchCommand
      if (process.platform === 'win32') {
        searchCommand = `dir "${homeDir}\\AppData" /s /b | findstr state.vscdb`
      } else if (process.platform === 'darwin') {
        searchCommand = `find "${homeDir}/Library/Application Support" -name "state.vscdb" 2>/dev/null`
      } else {
        searchCommand = `find "${homeDir}" -name "state.vscdb" 2>/dev/null`
      }
      
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)
      
      const result = await execAsync(searchCommand)
      const searchResults = result.stdout.split('\n').filter(line => line.trim())
      
      for (const foundPath of searchResults) {
        if (foundPath.trim() && !foundPaths.some(p => p.path === foundPath.trim())) {
          try {
            const stats = await fs.stat(foundPath.trim())
            foundPaths.push({
              path: foundPath.trim(),
              size: stats.size,
              modified: stats.mtime,
              exists: true,
              foundBySearch: true
            })
          } catch (error) {
            // 忽略无法访问的文件
          }
        }
      }
    } catch (searchError) {
      console.log('搜索命令失败:', searchError.message)
    }
    
    return {
      success: true,
      foundPaths: foundPaths,
      totalFound: foundPaths.length,
      platform: process.platform,
      homeDir: homeDir
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      foundPaths: [],
      platform: process.platform,
      homeDir: os.homedir()
    }
  }
})

// 获取目录下的所有文件
ipcMain.handle('list-directory', async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true })
    const result = files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      isFile: file.isFile(),
      path: path.join(dirPath, file.name)
    }))
    return { success: true, files: result }
  } catch (error) {
    return { success: false, error: error.message, files: [] }
  }
})

// 获取日志文件路径
ipcMain.handle('get-log-path', async () => {
  try {
    const { logFile, logDir } = getLogPath()
    return {
      success: true,
      logFile,
      logDir,
      exists: await fs.access(logFile).then(() => true).catch(() => false)
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

// 读取日志文件内容
ipcMain.handle('read-log-file', async (event, lines = 100) => {
  try {
    const { logFile } = getLogPath()
    const content = await fs.readFile(logFile, 'utf8')
    const allLines = content.split('\n')
    const recentLines = allLines.slice(-lines).join('\n')
    
    return {
      success: true,
      content: recentLines,
      totalLines: allLines.length,
      requestedLines: lines
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      content: ''
    }
  }
})

// 清空日志文件
ipcMain.handle('clear-log-file', async () => {
  try {
    const { logFile } = getLogPath()
    await fs.writeFile(logFile, '', 'utf8')
    await writeLog('INFO', '日志文件已清空')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 获取MAC地址
// 强制解锁文件（Windows）
ipcMain.handle('unlock-file', async (event, filePath) => {
  try {
    if (process.platform !== 'win32') {
      return { success: false, error: 'Only supported on Windows' }
    }

    await writeLog('INFO', `尝试解锁文件: ${filePath}`)
    
    // 使用 handle.exe 工具或简单的重命名技巧
    // 方法1: 尝试重命名文件（如果被锁定会失败）
    const tempPath = filePath + '.unlocking'
    try {
      await fs.rename(filePath, tempPath)
      await fs.rename(tempPath, filePath)
      console.log('✅ 文件解锁成功（通过重命名）')
      return { success: true, method: 'rename' }
    } catch (error) {
      console.log('⚠️ 重命名方法失败，文件可能仍被锁定')
    }
    
    // 方法2: 尝试复制+删除（强制）
    try {
      const backup = filePath + '.locked.backup'
      await fs.copyFile(filePath, backup)
      await fs.unlink(filePath)
      await fs.rename(backup, filePath)
      console.log('✅ 文件解锁成功（通过复制删除）')
      return { success: true, method: 'copy-delete' }
    } catch (error) {
      console.log('⚠️ 复制删除方法失败')
      return { success: false, error: error.message }
    }
  } catch (error) {
    await writeLog('ERROR', `解锁文件失败: ${filePath}`, error)
    return { success: false, error: error.message }
  }
})

// Windows注册表操作（用于机器码重置）
ipcMain.handle('update-windows-registry', async (event, keyPath, valueName, value) => {
  try {
    if (process.platform !== 'win32') {
      throw new Error('Registry updates are only supported on Windows')
    }

    await writeLog('INFO', `准备更新注册表: ${keyPath}\\${valueName}`)
    
    // 使用reg add命令更新注册表
    // /f 参数强制覆盖现有值,不需要确认
    const command = `reg add "${keyPath}" /v "${valueName}" /t REG_SZ /d "${value}" /f`
    
    try {
      const result = await execAsync(command)
      await writeLog('INFO', `注册表更新成功: ${keyPath}\\${valueName}`)
      return {
        success: true,
        message: `Registry key ${valueName} updated successfully`
      }
    } catch (error) {
      if (error.message.includes('denied') || error.message.includes('访问被拒绝')) {
        await writeLog('WARN', `注册表更新需要管理员权限: ${keyPath}\\${valueName}`, error)
        return {
          success: false,
          error: 'Administrator rights required',
          needsAdmin: true
        }
      }
      throw error
    }
  } catch (error) {
    await writeLog('ERROR', `更新注册表失败: ${keyPath}\\${valueName}`, error)
    return {
      success: false,
      error: error.message
    }
  }
})

ipcMain.handle('read-windows-registry', async (event, keyPath, valueName) => {
  try {
    if (process.platform !== 'win32') {
      throw new Error('Registry reads are only supported on Windows')
    }

    const command = `reg query "${keyPath}" /v "${valueName}"`
    
    try {
      const result = await execAsync(command)
      // 解析reg query的输出
      const lines = result.stdout.split('\n')
      for (const line of lines) {
        if (line.includes(valueName)) {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 3) {
            return {
              success: true,
              value: parts[parts.length - 1]
            }
          }
        }
      }
      return {
        success: false,
        error: 'Value not found'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        notFound: true
      }
    }
  } catch (error) {
    await writeLog('ERROR', `读取注册表失败: ${keyPath}\\${valueName}`, error)
    return {
      success: false,
      error: error.message
    }
  }
})

ipcMain.handle('get-mac-address', async () => {
  try {
    const networkInterfaces = os.networkInterfaces()
    
    // 优先查找物理网卡的MAC地址
    const priorityInterfaces = ['以太网', 'Ethernet', 'Wi-Fi', 'WiFi', 'WLAN', 'en0', 'eth0']
    
    for (const interfaceName of priorityInterfaces) {
      const networkInterface = networkInterfaces[interfaceName]
      if (networkInterface) {
        for (const net of networkInterface) {
          if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
            console.log(`找到MAC地址: ${net.mac} (${interfaceName})`)
            return net.mac
          }
        }
      }
    }
    
    // 如果优先接口没找到，遍历所有接口
    for (const [interfaceName, networkInterface] of Object.entries(networkInterfaces)) {
      if (networkInterface) {
        for (const net of networkInterface) {
          if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
            console.log(`找到MAC地址: ${net.mac} (${interfaceName})`)
            return net.mac
          }
        }
      }
    }
    
    // 备用方案：使用系统命令获取
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync('getmac /v /fo csv | findstr /i "物理地址\\|Physical Address" | findstr /v "N/A"')
        const lines = stdout.trim().split('\n')
        if (lines.length > 0) {
          const match = lines[0].match(/([0-9A-F]{2}[:-]){5}[0-9A-F]{2}/i)
          if (match) {
            const macAddress = match[0].replace(/-/g, ':').toUpperCase()
            console.log(`通过命令获取MAC地址: ${macAddress}`)
            return macAddress
          }
        }
      } catch (cmdError) {
        console.warn('命令行获取MAC地址失败:', cmdError.message)
      }
    } else if (process.platform === 'darwin') {
      try {
        const { stdout } = await execAsync('ifconfig | grep ether | head -1 | awk \'{print $2}\'')
        const macAddress = stdout.trim().toUpperCase()
        if (macAddress && macAddress.match(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/)) {
          console.log(`通过命令获取MAC地址: ${macAddress}`)
          return macAddress
        }
      } catch (cmdError) {
        console.warn('命令行获取MAC地址失败:', cmdError.message)
      }
    } else if (process.platform === 'linux') {
      try {
        const { stdout } = await execAsync('cat /sys/class/net/*/address | grep -v "00:00:00:00:00:00" | head -1')
        const macAddress = stdout.trim().toUpperCase()
        if (macAddress && macAddress.match(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/)) {
          console.log(`通过命令获取MAC地址: ${macAddress}`)
          return macAddress
        }
      } catch (cmdError) {
        console.warn('命令行获取MAC地址失败:', cmdError.message)
      }
    }
    
    console.warn('无法获取MAC地址')
    return 'unknown'
    
  } catch (error) {
    console.error('获取MAC地址时发生错误:', error)
    return 'unknown'
  }
})

// 设置应用程序用户模型ID（Windows）
if (process.platform === 'win32') {
  app.setAppUserModelId('com.cursor.manager')
}

// 单实例应用
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时，将会聚焦到mainWindow这个窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
