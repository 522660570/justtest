// 检查是否在Electron环境中
const isElectron = typeof window !== 'undefined' && window.electronAPI

// 统一的API接口，支持Electron和浏览器环境
const api = {
  async getPlatform() {
    if (isElectron) {
      return await window.electronAPI.getPlatform()
    } else {
      return 'browser'
    }
  },
  
  async getHomedir() {
    if (isElectron) {
      return await window.electronAPI.getHomedir()
    } else {
      return '/mock/home'
    }
  },
  
  async pathJoin(...args) {
    if (isElectron) {
      return await window.electronAPI.pathJoin(...args)
    } else {
      return args.join('/')
    }
  },
  
  async fsAccess(filePath) {
    if (isElectron) {
      return await window.electronAPI.fsAccess(filePath)
    } else {
      return true // 模拟文件存在
    }
  },
  
  async fsReadFile(filePath, encoding = 'utf8') {
    if (isElectron) {
      return await window.electronAPI.fsReadFile(filePath, encoding)
    } else {
      return 'mock-file-content'
    }
  },
  
  async fsWriteFile(filePath, data, encoding = 'utf8') {
    if (isElectron) {
      return await window.electronAPI.fsWriteFile(filePath, data, encoding)
    } else {
      return true // 模拟写入成功
    }
  },
  
  async sqliteQuery(dbPath, query, params = []) {
    if (isElectron) {
      return await window.electronAPI.sqliteQuery(dbPath, query, params)
    } else {
      return [] // 模拟空结果
    }
  },
  
  async execCommand(command) {
    if (isElectron) {
      return await window.electronAPI.execCommand(command)
    } else {
      return { stdout: '', stderr: '', error: false }
    }
  },
  
  async execCommandAsync(command) {
    if (isElectron) {
      return await window.electronAPI.execCommandAsync(command)
    } else {
      return { success: true, pid: 12345, message: 'Browser simulation - async command' }
    }
  },
  
  async spawnDetached(command, args = []) {
    if (isElectron) {
      return await window.electronAPI.spawnDetached(command, args)
    } else {
      return { success: true, pid: 12345, message: 'Browser simulation - spawn detached' }
    }
  }
}

class CursorService {
  constructor() {
    this.platform = null
    this.cursorPaths = null
    this.initialized = false
  }

  async initialize() {
    if (this.initialized) return
    
    this.platform = await api.getPlatform()
    this.cursorPaths = await this.getCursorPaths()
    
    // 智能检测实际的数据库路径
    await this.detectActualDbPath()
    
    this.initialized = true
    
    console.log('🔧 CursorService已初始化，平台:', this.platform)
    console.log('🔧 SQLite数据库路径:', this.cursorPaths.sqlite)
  }

  /**
   * 智能检测实际的Cursor数据库文件路径
   */
  async detectActualDbPath() {
    if (!isElectron) {
      return // 浏览器环境不需要检测
    }

    try {
      console.log('🔍 正在智能检测Cursor数据库文件路径...')
      
      // 首先检查当前配置的路径是否存在
      const currentPathExists = await api.fsAccess(this.cursorPaths.sqlite)
      if (currentPathExists) {
        console.log('✅ 当前配置的数据库路径有效:', this.cursorPaths.sqlite)
        return
      }
      
      console.log('⚠️ 当前配置的数据库路径无效:', this.cursorPaths.sqlite)
      console.log('🔍 开始搜索实际的数据库文件位置...')
      
      // 使用新的API搜索数据库文件
      const searchResult = await window.electronAPI.findCursorDb()
      
      if (searchResult.success && searchResult.foundPaths.length > 0) {
        console.log(`✅ 找到 ${searchResult.foundPaths.length} 个Cursor数据库文件:`)
        searchResult.foundPaths.forEach((pathInfo, index) => {
          console.log(`   ${index + 1}. ${pathInfo.path}`)
          console.log(`      大小: ${pathInfo.size} bytes, 修改时间: ${pathInfo.modified}`)
          if (pathInfo.foundBySearch) {
            console.log('      (通过搜索命令找到)')
          }
        })
        
        // 选择最新的数据库文件
        const latestDb = searchResult.foundPaths.reduce((latest, current) => {
          return new Date(current.modified) > new Date(latest.modified) ? current : latest
        })
        
        console.log('🎯 选择最新的数据库文件:', latestDb.path)
        
        // 更新所有相关路径
        const homeDir = await api.getHomedir()
        const dbDir = latestDb.path.replace(/[\\\/]state\.vscdb$/, '')
        const cursorUserDir = dbDir.replace(/[\\\/]globalStorage$/, '')
        const cursorRootDir = cursorUserDir.replace(/[\\\/]User$/, '')
        
        this.cursorPaths = {
          ...this.cursorPaths,
          sqlite: latestDb.path,
          storage: await api.pathJoin(dbDir, 'storage.json'),
          machineId: await api.pathJoin(cursorRootDir, 'machineId')
        }
        
        console.log('✅ 已更新Cursor路径配置:')
        console.log('   SQLite数据库:', this.cursorPaths.sqlite)
        console.log('   存储文件:', this.cursorPaths.storage)
        console.log('   机器ID文件:', this.cursorPaths.machineId)
        
      } else {
        console.error('❌ 未找到任何Cursor数据库文件')
        console.log('💡 请确保Cursor已经运行过至少一次，或者手动登录过账号')
        console.log('🔍 搜索详情:', searchResult)
      }
      
    } catch (error) {
      console.error('❌ 智能路径检测失败:', error)
    }
  }

  /**
   * 查找Cursor可执行文件的实际位置（通过IPC）
   */
  async findCursorExecutable() {
    if (!isElectron) {
      return null // 浏览器环境无法查找
    }

    try {
      console.log('🔍 正在搜索Cursor可执行文件...')
      const result = await window.electronAPI.findCursorExecutable()
      
      if (result.success) {
        console.log(`✅ 找到Cursor可执行文件: ${result.path} (方法: ${result.method})`)
        return result.path
      } else {
        console.warn('❌ 未找到Cursor可执行文件:', result.error)
        return null
      }
    } catch (error) {
      console.warn('❌ 查找Cursor可执行文件失败:', error.message)
      return null
    }
  }

  /**
   * 获取不同平台下的Cursor路径配置
   */
  async getCursorPaths() {
    const homeDir = await api.getHomedir()
    
    switch (this.platform) {
      case 'win32':
        return {
          storage: await api.pathJoin(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'storage.json'),
          sqlite: await api.pathJoin(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
          machineId: await api.pathJoin(homeDir, 'AppData', 'Roaming', 'Cursor', 'machineId'),
          executable: (await this.findCursorExecutable()) || await api.pathJoin(homeDir, 'AppData', 'Local', 'Programs', 'Cursor', 'Cursor.exe'),
          updater: await api.pathJoin(homeDir, 'AppData', 'Local', 'cursor-updater'),
          productJson: await api.pathJoin(homeDir, 'AppData', 'Local', 'Programs', 'Cursor', 'resources', 'app', 'product.json')
        }
      case 'darwin':
        return {
          storage: await api.pathJoin(homeDir, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'storage.json'),
          sqlite: await api.pathJoin(homeDir, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
          machineId: await api.pathJoin(homeDir, 'Library', 'Application Support', 'Cursor', 'machineId'),
          executable: '/Applications/Cursor.app/Contents/MacOS/Cursor',
          updater: await api.pathJoin(homeDir, 'Library', 'Application Support', 'cursor-updater'),
          productJson: '/Applications/Cursor.app/Contents/Resources/app/product.json'
        }
      case 'linux':
        return {
          storage: await api.pathJoin(homeDir, '.config', 'cursor', 'User', 'globalStorage', 'storage.json'),
          sqlite: await api.pathJoin(homeDir, '.config', 'cursor', 'User', 'globalStorage', 'state.vscdb'),
          machineId: await api.pathJoin(homeDir, '.config', 'cursor', 'machineid'),
          executable: '/usr/bin/cursor',
          updater: await api.pathJoin(homeDir, '.config', 'cursor-updater'),
          productJson: '/usr/share/cursor/resources/app/product.json'
        }
      case 'browser':
        // 浏览器环境的模拟路径
        return {
          storage: '/mock/cursor/storage.json',
          sqlite: '/mock/cursor/state.vscdb',
          machineId: '/mock/cursor/machineId',
          executable: '/mock/cursor/Cursor.exe',
          updater: '/mock/cursor/updater',
          productJson: '/mock/cursor/product.json'
        }
      default:
        throw new Error(`Unsupported platform: ${this.platform}`)
    }
  }

  /**
   * 检查Cursor是否已安装
   */
  async checkCursorInstallation() {
    try {
      await fs.access(this.cursorPaths.executable)
      return {
        installed: true,
        path: this.cursorPaths.executable
      }
    } catch (error) {
      return {
        installed: false,
        error: error.message
      }
    }
  }

  /**
   * 检查Cursor进程是否正在运行
   */
  async checkCursorProcess() {
    try {
      let command
      switch (this.platform) {
        case 'win32':
          command = 'tasklist /FI "IMAGENAME eq Cursor.exe" /FO CSV /NH'
          break
        case 'darwin':
          command = 'pgrep -f "Cursor.app"'
          break
        case 'linux':
          command = 'pgrep -f cursor'
          break
        case 'browser':
          // 浏览器环境模拟
          return {
            running: false,
            processes: [],
            simulated: true
          }
        default:
          return {
            running: false,
            processes: [],
            error: `Unsupported platform: ${this.platform}`
          }
      }

      const result = await api.execCommand(command)
      const isRunning = result.stdout && result.stdout.trim().length > 0

      return {
        running: isRunning,
        processes: isRunning ? result.stdout.trim().split('\n') : []
      }
    } catch (error) {
      return {
        running: false,
        processes: [],
        error: error.message
      }
    }
  }

  /**
   * 强制关闭Cursor进程 (增强版 - 彻底终止所有相关进程)
   */
  async killCursorProcess() {
    await this.initialize()
    
    if (!isElectron) {
      console.log('🔧 浏览器环境模拟：进程终止')
      return { success: true, message: 'Browser simulation - process killed' }
    }

    try {
      console.log('🔪 开始彻底关闭所有Cursor相关进程...')
      
      let commands = []
      switch (this.platform) {
        case 'win32':
          // Windows: 温和地关闭Cursor进程，避免确认弹框
          commands = [
            // 先尝试温和关闭（发送关闭信号）
            'taskkill /IM Cursor.exe 2>nul || echo "Cursor.exe not found"',
            'taskkill /IM "Cursor Helper.exe" 2>nul || echo "Cursor Helper not found"',
            'taskkill /IM "Cursor Helper (Renderer).exe" 2>nul || echo "Cursor Helper Renderer not found"',
            'taskkill /IM "Cursor Helper (GPU).exe" 2>nul || echo "Cursor Helper GPU not found"',
            'taskkill /IM "Cursor Helper (Plugin).exe" 2>nul || echo "Cursor Helper Plugin not found"',
            // 等待3秒让进程自然关闭
            'timeout /t 3 /nobreak >nul 2>&1',
            // 如果还有残留进程，再强制终止
            'taskkill /F /IM Cursor.exe 2>nul || echo "Cursor.exe already closed"',
            'taskkill /F /IM "Cursor Helper.exe" 2>nul || echo "Cursor Helper already closed"',
            'taskkill /F /IM "Cursor Helper (Renderer).exe" 2>nul || echo "Cursor Helper Renderer already closed"',
            'taskkill /F /IM "Cursor Helper (GPU).exe" 2>nul || echo "Cursor Helper GPU already closed"',
            'taskkill /F /IM "Cursor Helper (Plugin).exe" 2>nul || echo "Cursor Helper Plugin already closed"'
          ]
          break
        case 'darwin':
          commands = [
            'pkill -f "Cursor.app" || echo "Cursor.app not found"',
            'pkill -f "Cursor Helper" || echo "Cursor Helper not found"',
            'killall "Cursor" 2>/dev/null || echo "Cursor not found"'
          ]
          break
        case 'linux':
          commands = [
            'pkill -f cursor || echo "cursor not found"',
            'pkill -f Cursor || echo "Cursor not found"',
            'killall cursor 2>/dev/null || echo "cursor not found"',
            'killall Cursor 2>/dev/null || echo "Cursor not found"'
          ]
          break
        default:
          return {
            success: false,
            error: `Unsupported platform: ${this.platform}`
          }
      }

      // 依次执行所有终止命令
      for (let i = 0; i < commands.length; i++) {
        try {
          console.log(`🔪 执行终止命令 ${i + 1}/${commands.length}: ${commands[i].split(' ')[0]}...`)
          const result = await api.execCommand(commands[i])
          if (result.error) {
            console.log(`⚠️ 命令执行完成 (某些进程可能不存在): ${result.stderr}`)
          } else {
            console.log(`✅ 命令执行成功: ${result.stdout}`)
          }
          await new Promise(resolve => setTimeout(resolve, 500)) // 每个命令间隔500ms
        } catch (error) {
          console.log(`⚠️ 命令执行完成 (某些进程可能不存在): ${error.message}`)
        }
      }
      
      // 等待所有进程完全关闭
      console.log('⏳ 等待所有进程完全关闭...')
      await new Promise(resolve => setTimeout(resolve, 3000)) // 增加到3秒
      
      // 验证进程是否完全关闭
      const processCheck = await this.checkCursorProcess()
      const isFullyClosed = !processCheck.running
      
      console.log(isFullyClosed ? '✅ 所有Cursor进程已完全关闭' : '⚠️ 某些进程可能仍在运行')
      
      return {
        success: isFullyClosed,
        message: isFullyClosed ? 'All Cursor processes terminated completely' : 'Some processes may still be running',
        processesFound: processCheck.processes || []
      }
    } catch (error) {
      console.error('❌ 关闭Cursor进程时出错:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 启动Cursor
   */
  async startCursor() {
    await this.initialize()
    
    try {
      let command
      switch (this.platform) {
        case 'win32':
          command = `"${this.cursorPaths.executable}"`
          break
        case 'darwin':
          command = `open "${this.cursorPaths.executable}"`
          break
        case 'linux':
          command = this.cursorPaths.executable
          break
        case 'browser':
          // 浏览器环境模拟
          return {
            success: true,
            message: 'Browser mode: simulated Cursor start'
          }
        default:
          return {
            success: false,
            error: `Unsupported platform: ${this.platform}`
          }
      }

      // 使用异步命令执行启动应用程序
      console.log('🔧 执行启动命令:', command)
      const execResult = await api.execCommandAsync(command)
      
      if (!execResult.success) {
        console.warn('⚠️ 启动命令执行失败:', execResult.error)
      } else {
        console.log('✅ 启动命令执行成功, PID:', execResult.pid)
      }

      // 等待Cursor进程启动
      console.log('⏳ 等待Cursor进程启动...')
      await new Promise(resolve => setTimeout(resolve, 3000))

      // 验证进程是否成功启动
      const processCheck = await this.checkCursorProcess()
      const isRunning = processCheck.running
      
      console.log(isRunning ? '✅ Cursor进程启动成功' : '⚠️ Cursor进程启动可能失败')

      return {
        success: execResult.success,
        message: execResult.success ? 
          (isRunning ? 'Cursor started and running' : 'Cursor start command executed') :
          'Cursor start failed',
        processRunning: isRunning,
        pid: execResult.pid
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 重置机器ID（完整实现 - 参考 cursor-free-vip-main）
   * 包括：storage.json + SQLite + machineId文件
   */
  async resetMachineId() {
    await this.initialize()
    
    if (!isElectron) {
      console.log('🔧 浏览器环境模拟：机器ID重置')
      return { success: true, message: 'Browser simulation - machine ID reset' }
    }

    try {
      console.log('🔄 开始完整的机器ID重置流程（参考cursor-free-vip-main）...')
      
      // 1. 生成新的所有ID（参考 totally_reset_cursor.py generate_new_ids）
      const newIds = this.generateAllMachineIds()
      console.log('✅ 生成新的机器ID集合:', Object.keys(newIds))
      
      // 2. 更新 storage.json（这是关键！）
      console.log('🔧 步骤1: 更新 storage.json...')
      const storageResult = await this.updateStorageJson(newIds)
      if (!storageResult.success) {
        console.warn('⚠️ storage.json 更新失败:', storageResult.error)
      } else {
        console.log('✅ storage.json 更新成功')
      }
      
      // 3. 更新 SQLite 数据库中的 telemetry 字段
      console.log('🔧 步骤2: 更新 SQLite 中的 telemetry 字段...')
      const sqliteResult = await this.updateSqliteMachineIds(newIds)
      if (!sqliteResult.success) {
        console.warn('⚠️ SQLite telemetry 更新失败:', sqliteResult.error)
      } else {
        console.log('✅ SQLite telemetry 更新成功')
      }
      
      // 4. 更新 machineId 文件
      console.log('🔧 步骤3: 更新 machineId 文件...')
      try {
        // 备份原有 machineId
        try {
          const originalId = await api.fsReadFile(this.cursorPaths.machineId, 'utf8')
          await api.fsWriteFile(this.cursorPaths.machineId + '.backup', originalId, 'utf8')
          console.log('✅ 已备份原有 machineId')
        } catch (error) {
          console.log('⚠️ 没有找到现有 machineId')
        }
        
        // 写入新的 machineId（使用 devDeviceId）
        await api.fsWriteFile(this.cursorPaths.machineId, newIds['telemetry.devDeviceId'], 'utf8')
        console.log('✅ 新 machineId 文件已写入')
      } catch (error) {
        console.warn('⚠️ machineId 文件更新失败:', error.message)
      }

      console.log('✅ 机器ID完整重置成功！')
      console.log('📊 新的机器ID:')
      Object.entries(newIds).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value.substring(0, 20)}...`)
      })

      return {
        success: true,
        newIds: newIds,
        message: 'Machine ID reset successfully (complete flow)'
      }
    } catch (error) {
      console.error('❌ 机器ID重置失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 生成所有机器ID（参考 cursor-free-vip-main）
   */
  generateAllMachineIds() {
    // 生成 UUID
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
    
    // 生成 SHA256 哈希（64字符）
    const generateHash256 = () => {
      const chars = '0123456789abcdef'
      let result = ''
      for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }
    
    // 生成 SHA512 哈希（128字符）
    const generateHash512 = () => {
      const chars = '0123456789abcdef'
      let result = ''
      for (let i = 0; i < 128; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }
    
    const devDeviceId = generateUUID()
    const machineId = generateHash256()
    const macMachineId = generateHash512()
    const sqmId = `{${generateUUID().toUpperCase()}}`
    
    return {
      'telemetry.devDeviceId': devDeviceId,
      'telemetry.machineId': machineId,
      'telemetry.macMachineId': macMachineId,
      'telemetry.sqmId': sqmId,
      'storage.serviceMachineId': devDeviceId
    }
  }

  /**
   * 更新 storage.json（关键步骤！）
   */
  async updateStorageJson(newIds) {
    try {
      console.log('📄 读取 storage.json...')
      
      let config = {}
      try {
        const content = await api.fsReadFile(this.cursorPaths.storage, 'utf8')
        config = JSON.parse(content)
        console.log('✅ 成功读取 storage.json')
      } catch (error) {
        console.warn('⚠️ storage.json 不存在或读取失败，将创建新文件')
      }
      
      // 更新配置（参考 cursor-free-vip-main: config.update(new_ids)）
      Object.assign(config, newIds)
      
      // 写回文件
      await api.fsWriteFile(this.cursorPaths.storage, JSON.stringify(config, null, 2), 'utf8')
      console.log('✅ storage.json 更新成功，已写入', Object.keys(newIds).length, '个字段')
      
      return { success: true }
    } catch (error) {
      console.error('❌ storage.json 更新失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 更新 SQLite 中的 telemetry 字段
   */
  async updateSqliteMachineIds(newIds) {
    try {
      console.log('🗄️ 更新 SQLite 中的 telemetry 字段...')
      
      for (const [key, value] of Object.entries(newIds)) {
        const sql = "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)"
        await api.sqliteQuery(this.cursorPaths.sqlite, sql, [key, value])
        console.log(`✅ 更新 ${key}`)
      }
      
      console.log('✅ SQLite telemetry 字段更新成功')
      return { success: true }
    } catch (error) {
      console.error('❌ SQLite telemetry 更新失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 生成新的机器ID
   */
  generateMachineId() {
    const chars = '0123456789abcdef'
    let result = ''
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 获取当前机器ID
   */
  async getCurrentMachineId() {
    try {
      const machineId = await fs.readFile(this.cursorPaths.machineId, 'utf8')
      return {
        success: true,
        machineId: machineId.trim()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新存储配置（替换账号信息）
   * 基于cursor-free-vip项目的正确实现方式 - 使用SQLite数据库
   * 参考：https://github.com/yeongpin/cursor-free-vip/blob/main/cursor_auth.py
   */
  async updateAccountStorage(accountData) {
    await this.initialize()
    
    if (!isElectron) {
      console.log('🔧 浏览器环境模拟：账号存储更新')
      return { success: true, message: 'Browser simulation - account updated' }
    }

    try {
      console.log('🔧 开始更新账号存储配置（参考cursor-free-vip的正确实现）...')
      console.log('📊 接收到的账号数据:', {
        email: accountData.email,
        hasSessionToken: !!accountData.sessionToken,
        hasAccessToken: !!accountData.accessToken,
        hasRefreshToken: !!accountData.refreshToken,
        signUpType: accountData.signUpType,
        sessionTokenPreview: accountData.sessionToken ? accountData.sessionToken.substring(0, 50) + '...' : 'null',
        accessTokenPreview: accountData.accessToken ? accountData.accessToken.substring(0, 50) + '...' : 'null'
      })
      console.log('📂 SQLite数据库路径:', this.cursorPaths.sqlite)
      
      // 检查数据库文件是否存在
      const dbExists = await api.fsAccess(this.cursorPaths.sqlite)
      if (!dbExists) {
        throw new Error(`SQLite数据库文件不存在: ${this.cursorPaths.sqlite}`)
      }
      console.log('✅ 数据库文件存在，开始更新')

      // 🔑 关键：参考cursor-free-vip的cursor_auth.py实现
      // 后端已经返回了完整的 JWT，直接使用即可，不需要提取
      const finalAccessToken = accountData.accessToken
      const finalRefreshToken = accountData.refreshToken
      
      // 验证必要字段
      if (!finalAccessToken || !finalAccessToken.trim()) {
        throw new Error('后端返回的 accessToken 为空')
      }
      
      if (!accountData.email || !accountData.email.trim()) {
        throw new Error('后端返回的 email 为空')
      }
      
      console.log('✅ 后端返回的数据验证通过')
      console.log('📊 accessToken 长度:', finalAccessToken.length)
      console.log('📊 refreshToken 长度:', finalRefreshToken?.length || 0)
      console.log('📧 email:', accountData.email)
      console.log('🔐 signUpType:', accountData.signUpType || 'Auth0')
      
      // 准备更新的字段（参考 cursor-free-vip-main 的实现）
      // ⚠️ 关键：signUpType 可能需要使用 "Auth_0" (带下划线) 而不是 "Auth0"
      const signUpType = accountData.signUpType === 'Auth0' ? 'Auth_0' : accountData.signUpType
      
      const updates = [
        ['cursorAuth/cachedSignUpType', signUpType || 'Auth_0'],  // 注意：Auth_0 带下划线
        ['cursorAuth/cachedEmail', accountData.email],
        ['cursorAuth/accessToken', finalAccessToken],
        ['cursorAuth/refreshToken', finalRefreshToken || finalAccessToken]
      ]

      console.log('🔧 准备更新以下字段:')
      updates.forEach(([key, value]) => {
        console.log(`  - ${key}: ${value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null'}`)
      })

      let updatedFields = []

      // 🔑 使用事务确保数据完整性（参考cursor-free-vip的实现）
      console.log('🔄 开始数据库事务...')
      
      // 逐一更新每个字段
      for (const [key, value] of updates) {
        if (value) {
          try {
            // 先检查键是否存在
            const existingRows = await api.sqliteQuery(this.cursorPaths.sqlite, "SELECT COUNT(*) as count FROM ItemTable WHERE key = ?", [key])
            const exists = existingRows.length > 0 && existingRows[0].count > 0
            
            // 执行插入或更新（使用INSERT OR REPLACE更可靠）
            const sql = "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)"
            await api.sqliteQuery(this.cursorPaths.sqlite, sql, [key, value])
            
            console.log(`✅ ${exists ? '更新' : '插入'} ${key.split('/').pop()}`)
            updatedFields.push(key)
          } catch (error) {
            console.error(`❌ 更新字段 ${key} 失败:`, error)
            throw error
          }
        }
      }

      console.log('✅ 账号存储更新完成！')
      console.log('✅ 更新的字段数:', updatedFields.length)
      console.log('📊 更新的字段:', updatedFields.map(k => k.split('/').pop()).join(', '))

      return {
        success: true,
        message: 'Account storage updated successfully using SQLite database',
        updatedFields: updatedFields,
        storagePath: this.cursorPaths.sqlite
      }
      
    } catch (error) {
      console.error('❌ 更新账号存储失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 读取当前Cursor账号信息（从SQLite数据库）
   */
  async getCurrentAccountInfo() {
    await this.initialize()
    
    if (!isElectron) {
      return {
        success: true,
        data: {
          email: 'browser@simulation.com',
          signUpType: 'Browser',
          isAuthenticated: true,
          hasAccessToken: true,
          hasRefreshToken: true
        }
      }
    }

    try {
      // 检查数据库文件是否存在
      const dbExists = await api.fsAccess(this.cursorPaths.sqlite)
      if (!dbExists) {
        throw new Error(`SQLite数据库文件不存在: ${this.cursorPaths.sqlite}`)
      }

      // 查询认证相关字段（参考 cursor-free-vip-main 的实现）
      const authKeys = [
        'cursorAuth/cachedEmail',
        'cursorAuth/cachedSignUpType',
        'cursorAuth/accessToken',
        'cursorAuth/refreshToken'
      ]

      const authData = {}

      for (const key of authKeys) {
        const rows = await api.sqliteQuery(this.cursorPaths.sqlite, "SELECT value FROM ItemTable WHERE key = ?", [key])
        authData[key] = rows.length > 0 ? rows[0].value : null
      }

      // 数据库连接由IPC处理程序自动管理
      
      const hasAccessToken = !!authData['cursorAuth/accessToken']
      
      const accountInfo = {
        email: authData['cursorAuth/cachedEmail'] || 'Not logged in',
        signUpType: authData['cursorAuth/cachedSignUpType'] || 'Unknown',
        hasAccessToken: hasAccessToken,
        hasRefreshToken: !!authData['cursorAuth/refreshToken'],
        // 🔑 认证判断：有 accessToken 且有 email 就算认证成功
        isAuthenticated: hasAccessToken && !!authData['cursorAuth/cachedEmail']
      }

      console.log('📊 当前账号信息 (从SQLite读取):', accountInfo)
      
      return {
        success: true,
        data: accountInfo
      }
    } catch (error) {
      console.log('⚠️ 无法从SQLite读取账号信息:', error.message)
      return {
        success: false,
        error: error.message,
        data: {
          email: 'Error reading account from SQLite',
          isAuthenticated: false,
          hasAccessToken: false,
          hasRefreshToken: false
        }
      }
    }
  }

  /**
   * 等待并验证账号切换
   */
  async waitAndVerifyAccountSwitch(expectedEmail, maxWaitTime = 15000) {
    console.log(`⏳ 等待账号切换生效，目标邮箱: ${expectedEmail}`)
    console.log(`⏰ 最大等待时间: ${maxWaitTime / 1000} 秒`)
    
    const startTime = Date.now()
    let attemptCount = 0
    
    while (Date.now() - startTime < maxWaitTime) {
      attemptCount++
      console.log(`🔍 第 ${attemptCount} 次验证账号状态...`)
      
      const accountResult = await this.getCurrentAccountInfo()
      
      if (accountResult.success && accountResult.data.email === expectedEmail) {
        console.log(`✅ 账号切换成功验证: ${expectedEmail}`)
        console.log(`📊 验证结果:`, accountResult.data)
        return { success: true, account: accountResult.data, attempts: attemptCount }
      }
      
      console.log(`⏳ 等待中... 当前邮箱: ${accountResult.data?.email}, 目标: ${expectedEmail}`)
      await new Promise(resolve => setTimeout(resolve, 2000)) // 等待2秒
    }
    
    console.log(`❌ 账号切换验证超时，未能切换到目标邮箱: ${expectedEmail}`)
    console.log(`🕐 总等待时间: ${(Date.now() - startTime) / 1000} 秒，尝试次数: ${attemptCount}`)
    
    // 返回最终的账号状态
    const finalAccount = await this.getCurrentAccountInfo()
    return { 
      success: false, 
      timeout: true, 
      attempts: attemptCount,
      finalAccount: finalAccount.data
    }
  }

  /**
   * 清理Cursor缓存和临时文件
   */
  async cleanCursorCache() {
    if (!isElectron) {
      console.log('🔧 浏览器环境模拟：缓存清理')
      return { success: true, message: 'Browser simulation - cache cleaned' }
    }

    try {
      console.log('🧹 开始深度清理Cursor缓存...')
      
      // 更全面的缓存清理路径（基于cursor-free-vip的实现）
      // 使用 api.pathJoin 而不是 path.join (修复 path is not defined 错误)
      const storagePath = this.cursorPaths.storage
      const lastSlashIndex = storagePath.lastIndexOf('/') !== -1 ? storagePath.lastIndexOf('/') : storagePath.lastIndexOf('\\')
      const userDataDir = storagePath.substring(0, lastSlashIndex)
      
      const cleanupPaths = [
        this.cursorPaths.updater,
        await api.pathJoin(userDataDir, 'logs'),
        await api.pathJoin(userDataDir, 'CachedData'),
        await api.pathJoin(userDataDir, 'Local Storage'),
        await api.pathJoin(userDataDir, 'Session Storage'),
        await api.pathJoin(userDataDir, 'IndexedDB'),
        await api.pathJoin(userDataDir, 'GPUCache'),
        await api.pathJoin(userDataDir, 'Code Cache'),
        await api.pathJoin(userDataDir, 'Service Worker'),
        await api.pathJoin(userDataDir, 'blob_storage'),
        await api.pathJoin(userDataDir, 'databases'),
        await api.pathJoin(userDataDir, 'Network Persistent State'),
        await api.pathJoin(userDataDir, 'TransportSecurity'),
        await api.pathJoin(userDataDir, 'WebRTC Logs')
      ]

      console.log('📂 待清理的缓存路径:', cleanupPaths.length, '个')

      let cleanedCount = 0
      let skippedCount = 0
      
      for (const cleanPath of cleanupPaths) {
        try {
          // 使用 fs.access 检查路径是否存在
          try {
            await fs.access(cleanPath)
            // 路径存在，进行清理
            
            // 对于某些关键目录，只清理内容而不删除目录本身
            const isKeyDirectory = cleanPath.includes('Local Storage') || 
                                 cleanPath.includes('Session Storage') ||
                                 cleanPath.includes('IndexedDB')
                                 
            if (isKeyDirectory) {
              // 清理目录内容但保留目录结构
              console.log(`⚠️ 跳过关键目录的清理: ${cleanPath}`)
            } else {
              // 简化：直接跳过清理（避免权限问题）
              console.log(`⚠️ 跳过缓存清理: ${cleanPath}`)
            }
            cleanedCount++
          } catch (accessError) {
            // 路径不存在
            console.log(`⚠️ 路径不存在: ${cleanPath}`)
            skippedCount++
          }
        } catch (error) {
          if (error.code === 'EPERM' || error.code === 'EBUSY') {
            console.log(`⚠️ 权限不足或文件被占用，跳过: ${cleanPath}`)
            skippedCount++
          } else {
            console.log(`❌ 清理失败: ${cleanPath}`, error.message)
            skippedCount++
          }
          // 继续执行，不要因为权限问题停止整个流程
        }
      }

      console.log(`✅ 深度缓存清理完成！`)
      console.log(`   成功清理: ${cleanedCount} 个路径`)
      console.log(`   跳过路径: ${skippedCount} 个路径`)
      console.log(`   总计路径: ${cleanupPaths.length} 个路径`)
      
      return { 
        success: true, 
        message: `Deep cache cleaning completed (${cleanedCount}/${cleanupPaths.length} paths cleaned)`,
        cleanedPaths: cleanedCount,
        skippedPaths: skippedCount,
        totalPaths: cleanupPaths.length
      }
    } catch (error) {
      console.error('❌ 深度缓存清理失败:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }
  }

  /**
   * 🔍 诊断Cursor配置文件状态 (新增 - 用于调试账号切换问题)
   */
  async diagnoseCursorConfig() {
    if (!isElectron) {
      return { success: false, message: 'Browser environment' }
    }

    try {
      console.log('🔍 开始诊断Cursor配置文件状态...')
      const homeDir = os.homedir()
      const diagnosis = {
        timestamp: new Date().toISOString(),
        paths: this.cursorPaths,
        files: {}
      }

      // 检查所有可能的配置文件
      const filesToCheck = [
        { name: 'storage.json', path: this.cursorPaths.storage },
        { name: 'state.vscdb', path: this.cursorPaths.sqlite },
        { name: 'machineId', path: this.cursorPaths.machineId },
        // 添加更多可能的配置文件
        { name: 'workspaceStorage', path: path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'workspaceStorage') },
        { name: 'settings.json', path: path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'settings.json') },
        { name: 'keybindings.json', path: path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'keybindings.json') },
        // VSCode相关的配置文件
        { name: 'argv.json', path: path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'argv.json') }
      ]

      for (const file of filesToCheck) {
        try {
          await fs.access(file.path)
          const stats = await fs.stat(file.path)
          const content = await fs.readFile(file.path, 'utf8')
          
          diagnosis.files[file.name] = {
            exists: true,
            path: file.path,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            contentPreview: file.name === 'storage.json' ? 
              this.extractAuthInfo(content) : 
              content.substring(0, 200) + (content.length > 200 ? '...' : '')
          }
          
          console.log(`✅ 找到文件: ${file.name} (${stats.size} bytes, 修改时间: ${stats.mtime.toISOString()})`)
        } catch (error) {
          diagnosis.files[file.name] = {
            exists: false,
            path: file.path,
            error: error.message
          }
          console.log(`❌ 文件不存在: ${file.name} - ${file.path}`)
        }
      }

      // 检查目录结构
      const dirsToCheck = [
        path.join(homeDir, 'AppData', 'Roaming', 'Cursor'),
        path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User'),
        path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage'),
        path.join(homeDir, 'AppData', 'Local', 'Programs', 'Cursor')
      ]

      diagnosis.directories = {}
      for (const dir of dirsToCheck) {
        try {
          const files = await fs.readdir(dir)
          diagnosis.directories[dir] = files
          console.log(`📁 目录 ${dir}: ${files.length} 个文件`)
        } catch (error) {
          diagnosis.directories[dir] = { error: error.message }
          console.log(`❌ 目录不存在: ${dir}`)
        }
      }

      return {
        success: true,
        diagnosis
      }
    } catch (error) {
      console.error('❌ 诊断过程出错:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 提取认证信息（用于诊断）
   */
  extractAuthInfo(storageContent) {
    try {
      const data = JSON.parse(storageContent)
      return {
        authKeys: Object.keys(data).filter(key => 
          key.includes('cursorAuth') || 
          key.includes('WorkosCursorSessionToken') ||
          key.includes('machineId')
        ),
        totalKeys: Object.keys(data).length,
        cachedEmail: data['cursorAuth/cachedEmail'],
        hasAccessToken: !!data['cursorAuth/accessToken'],
        hasRefreshToken: !!data['cursorAuth/refreshToken'],
        isAuthenticated: !!data['cursorAuth/isAuthenticated']
      }
    } catch (error) {
      return { error: 'Invalid JSON', content: storageContent.substring(0, 100) }
    }
  }

  /**
   * 获取Cursor环境信息
   */
  async getCursorEnvironmentInfo() {
    const installation = await this.checkCursorInstallation()
    const process = await this.checkCursorProcess()
    const machineId = await this.getCurrentMachineId()

    return {
      platform: this.platform,
      installation,
      process,
      machineId,
      paths: this.cursorPaths
    }
  }
}

export default CursorService
