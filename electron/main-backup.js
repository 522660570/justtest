const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const isDev = process.env.NODE_ENV === 'development'

// 简化的管理员权限检查
const checkAdminRights = async () => {
  if (process.platform !== 'win32') {
    return true
  }
  
  try {
    const result = await execAsync('net session >nul 2>&1 && echo "admin" || echo "user"')
    return result.stdout && result.stdout.includes('admin')
  } catch (error) {
    return false
  }
}

// 简化的全局错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  app.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('未处理的Promise拒绝:', reason)
})

// 保持对window对象的全局引用，避免被垃圾回收
let mainWindow

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js')
  
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
      devTools: false,
      webSecurity: true
    },
    show: false,
    titleBarStyle: 'hidden',
    frame: false,
    center: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    focusable: true,
    alwaysOnTop: false,
    fullscreenable: true,
    skipTaskbar: false,
    title: 'Cursor Manager',
    autoHideMenuBar: true,
    thickFrame: false,
    transparent: false,
    backgroundColor: '#667eea',
    vibrancy: 'none',
    visualEffectState: 'active'
  })

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html')
    mainWindow.loadFile(indexPath)
  }

  // 当窗口准备好显示时
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // 当窗口被关闭时
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 处理窗口关闭事件
  mainWindow.on('close', () => {
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
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
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

// 检查管理员权限
ipcMain.handle('check-admin-rights', async () => {
  return await checkAdminRights()
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
      stderr: result.stderr
    }
  } catch (error) {
    return {
      stdout: '',
      stderr: error.message,
      error: true
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
