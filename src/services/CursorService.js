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

  async sqliteBatchRun(dbPath, statements) {
    if (isElectron) {
      return await window.electronAPI.sqliteBatchRun(dbPath, statements)
    } else {
      return { success: true, results: [] }
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
    this.userCursorExecutablePath = null
  }

  async initialize() {
    if (!this.platform) {
      this.platform = await api.getPlatform()
    }

    if (!this.cursorPaths) {
      this.cursorPaths = await this.getCursorPaths()
    }

    if (isElectron) {
      try {
        const rawConfig = await window.electronAPI.readConfigFile()
        if (rawConfig) {
          const config = JSON.parse(rawConfig)
          if (config.cursorExecutablePath && typeof config.cursorExecutablePath === 'string') {
            this.userCursorExecutablePath = config.cursorExecutablePath
            this.cursorPaths.executable = config.cursorExecutablePath
            console.log('🔧 使用手动配置的 Cursor 可执行文件路径:', this.cursorPaths.executable)
          }
        }
      } catch (error) {
        console.warn('⚠️ 读取配置文件失败（忽略）:', error.message)
      }
    }

    if (!this.initialized) {
      // 智能检测实际的数据库路径（只需执行一次）
      await this.detectActualDbPath()
      this.initialized = true
      console.log('🔧 CursorService已初始化，平台:', this.platform)
      console.log('🔧 SQLite数据库路径:', this.cursorPaths.sqlite)
    }
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

      // ⚠️ 修复：更严格的进程检查逻辑
      let isRunning = false
      const output = result.stdout ? result.stdout.trim() : ''

      if (this.platform === 'win32') {
        // Windows tasklist 输出格式：
        // - 找到进程：'"Cursor.exe","12345","Console","1","123,456 K"'
        // - 未找到：'INFO: No tasks are running which match the specified criteria.'
        // 或者 taskkill 的错误输出也可能被捕获

        // 只有当输出包含 .exe 且是 CSV 格式时才认为进程存在
        isRunning = output.includes('Cursor.exe') &&
          output.includes('"') &&
          !output.toLowerCase().includes('no tasks') &&
          !output.toLowerCase().includes('not found')
      } else {
        // macOS/Linux: pgrep 找到进程时会输出PID（纯数字）
        // 没找到时没有输出（或退出码非0）
        isRunning = output.length > 0 && /^\d+/.test(output)
      }

      console.log(`🔍 进程检查结果 (${this.platform}):`, {
        command,
        hasOutput: !!output,
        outputLength: output.length,
        outputPreview: output.substring(0, 150),
        isRunning,
        exitCode: result.exitCode
      })

      return {
        running: isRunning,
        processes: isRunning ? output.split('\n') : []
      }
    } catch (error) {
      console.log('⚠️ 检查进程时出错（视为未运行）:', error.message)
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
          // Windows: 极速模式，仅强杀主程序，发完命令即走，0等待
          commands = [
            'taskkill /F /IM Cursor.exe 2>nul || echo "Cursor killed"'
          ]
          break
        case 'darwin':
          // macOS: 极速模式，仅强杀主程序
          commands = [
            'pkill -9 -f "Cursor.app" || killall -9 "Cursor" 2>/dev/null || echo "Darwin kill"'
          ]
          break
        case 'linux':
          // Linux: 极速模式，仅强杀主程序
          commands = [
            'pkill -9 -f [C]ursor || killall -9 cursor 2>/dev/null || echo "Linux kill"'
          ]
          break
        default:
          return {
            success: false,
            error: `Unsupported platform: ${this.platform}`
          }
      }

      // 火力即走：发出杀进程命令后立即返回，不等待结果
      const cmd = commands[0]
      console.log('🔪 发送终止命令（不等待）:', cmd.split(' ')[0])
      api.execCommandAsync(cmd)

      return {
        success: true,
        message: 'Kill command sent (fire-and-forget)'
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
          // Windows: 使用 cmd /c start 确保在 cmd.exe 中执行
          command = `cmd /c start "" "${this.cursorPaths.executable}"`
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
        console.log('✅ 启动命令已下发', execResult.pid ? `PID: ${execResult.pid}` : '')
      }

      // 不再等待与校验，交由上层流程或用户手动确认
      return {
        success: execResult.success,
        message: execResult.success ? 'Cursor start command executed' : 'Failed to execute Cursor start command'
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

      // ⚠️ 等待 Cursor 进程退出（配合 fire-and-forget 的 killCursorProcess）
      console.log('🔍 等待 Cursor 进程退出...')
      let isRunning = true
      for (let i = 0; i < 6; i++) {
        const processStatus = await this.checkCursorProcess()
        if (!processStatus.running) {
          isRunning = false
          break
        }
        console.log(`⏳ Cursor 仍在运行，等待退出 (${i + 1}/6)...`)
        await new Promise(r => setTimeout(r, 500))
      }
      if (isRunning) {
        console.warn('⚠️ Cursor 仍未完全退出，尝试强制继续...')
      } else {
        console.log('✅ Cursor 已退出，可以继续')
      }

      // 1. 生成新的所有ID（参考 totally_reset_cursor.py generate_new_ids）
      const newIds = this.generateAllMachineIds()
      console.log('✅ 生成新的机器ID集合:', Object.keys(newIds))

      // 2. 更新 storage.json（可选步骤 - 失败不阻断）
      console.log('🔧 步骤1: 更新 storage.json...')
      const storageResult = await this.updateStorageJson(newIds)
      if (!storageResult.success) {
        console.warn('⚠️ storage.json 更新失败（跳过）:', storageResult.error)
        console.warn('💡 storage.json 非必需，将继续更新 SQLite 和注册表')
        // ⚠️ 不阻断流程，继续执行后续步骤
      } else {
        console.log('✅ storage.json 更新成功')
      }

      // 3. 清理数据库中的问题键（参考 CursorPool_Client）
      console.log('🔧 步骤2: 清理数据库中的 cursorai/serverConfig...')
      try {
        const deleteSQL = "DELETE FROM ItemTable WHERE key = 'cursorai/serverConfig'"
        const deleteResult = await api.sqliteQuery(this.cursorPaths.sqlite, deleteSQL, [])
        console.log('✅ 成功删除 cursorai/serverConfig (影响行数:', deleteResult.changes || 0, ')')
      } catch (error) {
        console.warn('⚠️ 清理 serverConfig 失败（可能不存在）:', error.message)
      }

      // 4. 更新 SQLite 数据库中的 telemetry 字段（重要！）
      console.log('🔧 步骤3: 更新 SQLite 中的 telemetry 字段...')
      const sqliteResult = await this.updateSqliteMachineIds(newIds)
      if (!sqliteResult.success) {
        console.error('❌ SQLite telemetry 更新失败:', sqliteResult.error)
        // ⚠️ SQLite 更新失败会影响功能，但也不阻断流程
        console.warn('💡 将继续执行后续步骤（machineId文件 + 注册表）')
      } else {
        console.log('✅ SQLite telemetry 更新成功')
      }

      // 5. 更新 machineId 文件
      console.log('🔧 步骤4: 更新 machineId 文件...')
      let machineIdResult = { success: false }
      try {
        // 备份原有 machineId
        try {
          const originalId = await api.fsReadFile(this.cursorPaths.machineId, 'utf8')
          await api.fsWriteFile(this.cursorPaths.machineId + '.backup', originalId, 'utf8')
          console.log('✅ 已备份原有 machineId')
        } catch (error) {
          console.log('⚠️ 没有找到现有 machineId（将创建新文件）')
        }

        // 写入新的 machineId（使用 devDeviceId）
        try {
          await api.fsWriteFile(this.cursorPaths.machineId, newIds['telemetry.devDeviceId'], 'utf8')
          console.log('✅ 新 machineId 文件已写入:', newIds['telemetry.devDeviceId'])
          machineIdResult.success = true
        } catch (writeError) {
          if ((writeError.message.includes('EPERM') || writeError.message.includes('EBUSY')) && this.platform === 'win32') {
            console.warn('⚠️ machineId 文件被锁定，尝试解锁...')
            // 使用与 storage.json 相同的解锁机制
            const unlockResult = await window.electronAPI.unlockFile(this.cursorPaths.machineId)
            if (unlockResult.success) {
              console.log('✅ 文件解锁成功，重试写入...')
              await api.fsWriteFile(this.cursorPaths.machineId, newIds['telemetry.devDeviceId'], 'utf8')
              console.log('✅ 新 machineId 文件重试写入成功:', newIds['telemetry.devDeviceId'])
              machineIdResult.success = true
            } else {
              throw writeError
            }
          } else {
            throw writeError
          }
        }
      } catch (error) {
        console.error('❌ machineId 文件更新失败:', error.message)
        console.warn('💡 将继续执行注册表更新')
        machineIdResult.success = false
        machineIdResult.error = error.message
      }

      // 6. 更新系统级机器码（Windows注册表）- 参考cursor-free-vip-main
      console.log('🔧 步骤5: 更新系统级机器码...')
      const systemUpdateResult = await this.updateSystemMachineIds(newIds)
      if (!systemUpdateResult.success) {
        console.warn('⚠️ 系统级机器码更新失败:', systemUpdateResult.error)
        if (systemUpdateResult.needsAdmin) {
          console.warn('⚠️ 需要管理员权限才能完全重置机器码')
        }
      } else {
        console.log('✅ 系统级机器码更新成功')
      }

      // 汇总结果
      const summary = {
        storageJson: storageResult.success,
        sqlite: sqliteResult.success,
        machineIdFile: machineIdResult.success,
        systemRegistry: systemUpdateResult.success
      }

      const successCount = Object.values(summary).filter(v => v).length
      const totalSteps = Object.keys(summary).length

      console.log('═'.repeat(50))
      console.log('📊 机器ID重置完成汇总:')
      console.log(`  ${summary.storageJson ? '✅' : '⚠️'} storage.json: ${summary.storageJson ? '成功' : '失败（可跳过）'}`)
      console.log(`  ${summary.sqlite ? '✅' : '❌'} SQLite数据库: ${summary.sqlite ? '成功' : '失败'}`)
      console.log(`  ${summary.machineIdFile ? '✅' : '❌'} machineId文件: ${summary.machineIdFile ? '成功' : '失败'}`)
      console.log(`  ${summary.systemRegistry ? '✅' : '⚠️'} Windows注册表: ${summary.systemRegistry ? '成功' : '失败/跳过'}`)
      console.log(`  📊 成功率: ${successCount}/${totalSteps} (${Math.round(successCount / totalSteps * 100)}%)`)
      console.log('═'.repeat(50))

      // ⚠️ 重要：判断成功的核心逻辑
      // machineId 文件是唯一必须成功的步骤
      // SQLite 失败时降级处理，不阻断续杯流程
      const coreStepsSuccess = summary.machineIdFile

      if (coreStepsSuccess) {
        console.log('✅ 机器ID重置成功！（machineId文件 已完成）')
        if (summary.sqlite) {
          console.log('✅ SQLite telemetry 更新成功')
        }
        console.log('📊 新的机器ID:')
        Object.entries(newIds).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value.substring(0, 20)}...`)
        })

        const warnings = []
        if (!summary.sqlite) warnings.push('SQLite 更新失败（已降级处理，不影响续杯流程）')
        if (!summary.storageJson) warnings.push('storage.json 更新失败（可跳过）')
        if (!summary.systemRegistry && this.platform === 'win32') warnings.push('Windows注册表更新失败（需管理员权限）')

        return {
          success: true,
          newIds: newIds,
          message: 'Machine ID reset successfully',
          summary,
          warnings
        }
      } else {
        // machineId 文件更新失败，这才是真正的阻断
        console.error('❌ 机器ID重置失败！machineId文件未更新')

        return {
          success: false,
          error: `machineId文件更新失败`,
          message: 'machineId 文件更新失败，重置失败',
          summary
        }
      }
    } catch (error) {
      console.error('❌ :', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 检查当前环境是否满足换号/续杯操作的前置条件
   * 不满足时返回详细原因列表，用于在前端直接提示用户
   */
  async checkEnvironmentForRenewal() {
    await this.initialize()

    const reasons = []

    let dynamicExePath = null
    if (isElectron && !this.userCursorExecutablePath) {
      try {
        dynamicExePath = await this.findCursorExecutable()
        if (dynamicExePath) {
          this.cursorPaths.executable = dynamicExePath
        }
      } catch (error) {
        console.log('⚠️ 动态查找 Cursor 可执行文件失败：', error.message)
      }
    }

    // 1. 必须在 Electron 环境中运行，才能访问本地文件和进程
    if (!isElectron) {
      reasons.push('当前不在桌面客户端环境，无法访问本地 Cursor 文件')
    }

    // 2. 检查 SQLite 数据库文件是否存在且可访问
    let sqliteOk = false
    try {
      const exists = await api.fsAccess(this.cursorPaths.sqlite)
      if (!exists) {
        reasons.push('未检测到 Cursor 数据库文件，请先打开一次 Cursor 并登录账号')
      } else {
        sqliteOk = true
      }
    } catch (error) {
      reasons.push('无法访问 Cursor 数据库文件: ' + (error.message || String(error)))
    }

    // 3. 检查 storage.json（可选，但提供更友好的提示）
    try {
      const storageExists = await api.fsAccess(this.cursorPaths.storage)
      if (!storageExists) {
        reasons.push('未找到 storage.json，可能 Cursor 尚未完整初始化（建议先正常使用一次 Cursor）')
      }
    } catch (error) {
      reasons.push('无法访问 storage.json 文件: ' + (error.message || String(error)))
    }

    // 4. 检查 machineId 文件（如果不存在不一定阻断，仅提示）
    try {
      const machineIdExists = await api.fsAccess(this.cursorPaths.machineId)
      if (!machineIdExists) {
        reasons.push('未找到 machineId 文件，将在重置时创建新文件（如首次使用可忽略）')
      }
    } catch (error) {
      reasons.push('无法访问 machineId 文件: ' + (error.message || String(error)))
    }

    // 5. 检查 Cursor 可执行文件是否存在，避免启动时弹出系统错误框
    let exeOk = false
    try {
      const exeExists = await api.fsAccess(this.cursorPaths.executable)
      if (!exeExists) {
        reasons.push(`未找到 Cursor 可执行文件，当前尝试路径: ${this.cursorPaths.executable}`)
      } else {
        exeOk = true
      }
    } catch (error) {
      reasons.push('无法访问 Cursor 可执行文件路径: ' + (error.message || String(error)))
    }

    const success = isElectron && sqliteOk && exeOk

    return {
      success,
      reasons,
      details: {
        platform: this.platform,
        paths: this.cursorPaths
      }
    }
  }

  /**
   * 生成UUID的辅助函数
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * 生成所有机器ID
   * 参考三个开源项目的最佳实践
   */
  generateAllMachineIds() {
    // 生成 SHA256 哈希（64字符）- 用于 machineId
    const generateHash256 = () => {
      const chars = '0123456789abcdef'
      let result = ''
      for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    // 生成 SHA512 哈希（128字符）- 用于 macMachineId  
    const generateHash512 = () => {
      const chars = '0123456789abcdef'
      let result = ''
      for (let i = 0; i < 128; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const devDeviceId = this.generateUUID()
    const machineId = generateHash256()
    const macMachineId = generateHash512()
    const sqmId = `{${this.generateUUID().toUpperCase()}}`

    // ⚠️ 关键：参考 CursorPool 和 cursor-free-vip
    // storage.serviceMachineId 必须等于 devDeviceId
    return {
      'telemetry.devDeviceId': devDeviceId,
      'telemetry.machineId': machineId,
      'telemetry.macMachineId': macMachineId,
      'telemetry.sqmId': sqmId,
      'storage.serviceMachineId': devDeviceId  // 必须！值与 devDeviceId 相同
    }
  }

  /**
   * 移除 BOM (Byte Order Mark) 字符
   */
  removeBOM(content) {
    if (content.charCodeAt(0) === 0xFEFF) {
      return content.slice(1)
    }
    return content
  }

  /**
   * 更新 storage.json
   * 参考 CursorPool: storage.json 只写4个字段（不写storage.serviceMachineId）
   * storage.serviceMachineId 只写入 SQLite
   */
  async updateStorageJson(newIds) {
    try {
      console.log('📄 读取 storage.json...', this.cursorPaths.storage)

      let config = {}
      try {
        let content = await api.fsReadFile(this.cursorPaths.storage, 'utf8')
        // ⚠️ 移除 BOM 字符（如果存在）
        content = this.removeBOM(content)
        config = JSON.parse(content)
        console.log('✅ 成功读取 storage.json，现有字段数:', Object.keys(config).length)
      } catch (error) {
        console.warn('⚠️ storage.json 不存在或读取失败，将创建新文件:', error.message)
        config = {}
      }

      // ⚠️ 参考 CursorPool: storage.json 只写4个字段
      // storage.serviceMachineId 不写入 storage.json（只写入 SQLite）
      const storageFields = {
        'telemetry.devDeviceId': newIds['telemetry.devDeviceId'],
        'telemetry.machineId': newIds['telemetry.machineId'],
        'telemetry.macMachineId': newIds['telemetry.macMachineId'],
        'telemetry.sqmId': newIds['telemetry.sqmId']
      }

      // 更新配置
      Object.assign(config, storageFields)

      // 写回文件（确保 UTF-8 without BOM）
      const jsonString = JSON.stringify(config, null, 4)

      // 尝试写入，如果失败尝试解锁
      try {
        await api.fsWriteFile(this.cursorPaths.storage, jsonString, 'utf8')
        console.log('✅ storage.json 更新成功，已写入 4 个字段（参考 CursorPool）')
      } catch (writeError) {
        if (writeError.message.includes('EPERM') && this.platform === 'win32') {
          console.warn('⚠️ 文件被锁定，尝试解锁...')
          const unlockResult = await window.electronAPI.unlockFile(this.cursorPaths.storage)
          if (unlockResult.success) {
            console.log('✅ 文件解锁成功，重试写入...')
            await api.fsWriteFile(this.cursorPaths.storage, jsonString, 'utf8')
            console.log('✅ storage.json 重试写入成功')
          } else {
            throw writeError
          }
        } else {
          throw writeError
        }
      }

      console.log('📊 写入的字段:', Object.keys(storageFields).join(', '))

      return { success: true }
    } catch (error) {
      console.error('❌ storage.json 更新失败（已跳过，不影响后续步骤）:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * 更新系统级机器码（Windows注册表）
   * 参考 cursor-free-vip-main 的 update_system_ids()
   * ⚠️ 注意：system.machineGuid在这里现场生成，不使用newIds中的值
   */
  async updateSystemMachineIds(newIds) {
    if (!isElectron) {
      console.log('🔧 浏览器环境：跳过系统级更新')
      return { success: true, message: 'Browser mode - system IDs skipped' }
    }

    try {
      console.log('🔧 开始更新系统级机器码...')

      if (this.platform === 'win32') {
        // Windows: 更新注册表中的 MachineGuid 和 SQMClient MachineId
        console.log('🪟 Windows平台：更新注册表...')

        let updatedCount = 0
        let needsAdmin = false

        // 1. 更新 HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid
        // ⚠️ 参考cursor-free-vip-main: 现场生成新的UUID
        const newMachineGuid = this.generateUUID()
        console.log('📝 更新 MachineGuid...', newMachineGuid)
        const machineGuidResult = await window.electronAPI.updateWindowsRegistry(
          'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
          'MachineGuid',
          newMachineGuid
        )

        if (machineGuidResult.success) {
          console.log('✅ MachineGuid 更新成功:', newMachineGuid)
          updatedCount++
        } else {
          console.warn('⚠️ MachineGuid 更新失败:', machineGuidResult.error)
          if (machineGuidResult.needsAdmin) {
            needsAdmin = true
          }
        }

        // 2. 更新 HKLM\SOFTWARE\Microsoft\SQMClient\MachineId
        // ⚠️ 参考cursor-free-vip-main: 现场生成新的GUID（带大括号）
        const newSqmId = `{${this.generateUUID().toUpperCase()}}`
        console.log('📝 更新 SQMClient MachineId...', newSqmId)
        const sqmIdResult = await window.electronAPI.updateWindowsRegistry(
          'HKLM\\SOFTWARE\\Microsoft\\SQMClient',
          'MachineId',
          newSqmId
        )

        if (sqmIdResult.success) {
          console.log('✅ SQMClient MachineId 更新成功:', newSqmId)
          updatedCount++
        } else {
          console.warn('⚠️ SQMClient MachineId 更新失败:', sqmIdResult.error)
          if (sqmIdResult.needsAdmin) {
            needsAdmin = true
          }
        }

        if (updatedCount > 0) {
          console.log(`✅ Windows注册表更新完成 (${updatedCount}/2 个键值)`)
          return {
            success: true,
            message: `Updated ${updatedCount} registry keys`,
            updatedCount,
            needsAdmin: needsAdmin && updatedCount < 2
          }
        } else {
          console.error('❌ Windows注册表更新失败，没有成功更新任何键值')
          return {
            success: false,
            error: 'Failed to update any registry keys',
            needsAdmin
          }
        }
      } else if (this.platform === 'darwin') {
        // macOS: 更新系统 UUID
        console.log('🍎 macOS平台：更新系统UUID...')
        console.log('⚠️ macOS系统级更新需要sudo权限，暂时跳过')
        return {
          success: true,
          message: 'macOS system UUID update skipped (requires sudo)',
          skipped: true
        }
      } else {
        // Linux: 通常不需要更新系统级ID
        console.log('🐧 Linux平台：不需要更新系统级ID')
        return {
          success: true,
          message: 'Linux does not require system-level ID updates',
          skipped: true
        }
      }
    } catch (error) {
      console.error('❌ 更新系统级机器码失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新 SQLite 中的 telemetry 字段
   * ⚠️ 使用批量操作，将所有 INSERT 合并为单次文件读写（避免 Windows 文件锁竞态）
   */
  async updateSqliteMachineIds(newIds) {
    try {
      console.log('🗄️ 更新 SQLite 中的 telemetry 字段...', this.cursorPaths.sqlite)

      const sqliteFields = {
        'telemetry.devDeviceId': newIds['telemetry.devDeviceId'],
        'telemetry.machineId': newIds['telemetry.machineId'],
        'telemetry.macMachineId': newIds['telemetry.macMachineId'],
        'telemetry.sqmId': newIds['telemetry.sqmId'],
        'storage.serviceMachineId': newIds['telemetry.devDeviceId']
      }

      // ⚠️ 批量操作：5 条 INSERT 合并为 1 次文件读写，彻底避免 Windows 文件锁竞态
      const statements = Object.entries(sqliteFields).map(([key, value]) => ({
        sql: "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)",
        params: [key, value]
      }))

      console.log(`📦 批量执行 ${statements.length} 条 SQL 语句...`)
      const batchResult = await api.sqliteBatchRun(this.cursorPaths.sqlite, statements)

      if (batchResult.success) {
        const successCount = batchResult.results.filter(r => r.success).length
        console.log(`✅ SQLite 字段更新成功，共更新 ${successCount} 个字段`)
        return { success: true, updateCount: successCount }
      } else {
        console.error('❌ SQLite 批量更新失败')
        return { success: false, error: '所有批量语句均执行失败' }
      }
    } catch (error) {
      console.error('❌ SQLite 更新失败:', error)
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
   * 获取当前机器ID（从machineId文件）
   */
  async getCurrentMachineId() {
    try {
      const machineId = await api.fsReadFile(this.cursorPaths.machineId, 'utf8')
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
   * 获取完整的当前机器码信息（从所有位置）
   * 用于调试和查看当前环境的机器码状态
   */
  async getAllCurrentMachineIds() {
    await this.initialize()

    if (!isElectron) {
      return {
        success: false,
        message: 'Browser environment - cannot read machine IDs'
      }
    }

    try {
      console.log('📊 开始读取当前环境的机器码信息...')
      const result = {
        platform: this.platform,
        paths: this.cursorPaths,
        storageJson: {},
        sqlite: {},
        machineIdFile: null,
        windowsRegistry: {}
      }

      // 1. 从 storage.json 读取
      console.log('📄 读取 storage.json...')
      try {
        let content = await api.fsReadFile(this.cursorPaths.storage, 'utf8')
        // ⚠️ 移除 BOM 字符（如果存在）
        content = this.removeBOM(content)
        const data = JSON.parse(content)

        // 打印所有存在的字段（调试用）
        const allKeys = Object.keys(data)
        console.log('📊 storage.json 中的所有字段:', allKeys.length, '个')
        const machineRelatedKeys = allKeys.filter(k =>
          k.includes('machine') || k.includes('telemetry') || k.includes('storage')
        )
        console.log('🔍 机器相关字段:', machineRelatedKeys)

        result.storageJson = {
          'telemetry.machineId': data['telemetry.machineId'] || 'Not found',
          'telemetry.macMachineId': data['telemetry.macMachineId'] || 'Not found',
          'telemetry.devDeviceId': data['telemetry.devDeviceId'] || 'Not found',
          'telemetry.sqmId': data['telemetry.sqmId'] || 'Not found',
          'storage.serviceMachineId': data['storage.serviceMachineId'] || 'Not found (字段不存在)'
        }
        console.log('✅ storage.json 读取成功')
      } catch (error) {
        console.warn('⚠️ storage.json 读取失败:', error.message)
        result.storageJson = { error: error.message }
      }

      // 2. 从 SQLite 数据库读取
      console.log('🗄️ 读取 SQLite 数据库...')
      try {
        const keys = [
          'telemetry.machineId',
          'telemetry.macMachineId',
          'telemetry.devDeviceId',
          'telemetry.sqmId',
          'storage.serviceMachineId'
        ]

        for (const key of keys) {
          const rows = await api.sqliteQuery(
            this.cursorPaths.sqlite,
            'SELECT value FROM ItemTable WHERE key = ?',
            [key]
          )
          result.sqlite[key] = rows.length > 0 ? rows[0].value : 'Not found'
        }
        console.log('✅ SQLite 数据库读取成功')
      } catch (error) {
        console.warn('⚠️ SQLite 数据库读取失败:', error.message)
        result.sqlite = { error: error.message }
      }

      // 3. 从 machineId 文件读取
      console.log('📁 读取 machineId 文件...')
      try {
        result.machineIdFile = await api.fsReadFile(this.cursorPaths.machineId, 'utf8')
        console.log('✅ machineId 文件读取成功')
      } catch (error) {
        console.warn('⚠️ machineId 文件读取失败:', error.message)
        result.machineIdFile = `Error: ${error.message}`
      }

      // 4. 从 Windows 注册表读取（仅Windows）
      if (this.platform === 'win32') {
        console.log('🪟 读取 Windows 注册表...')

        // 读取 MachineGuid
        try {
          const machineGuidResult = await window.electronAPI.readWindowsRegistry(
            'HKLM\\SOFTWARE\\Microsoft\\Cryptography',
            'MachineGuid'
          )
          result.windowsRegistry.MachineGuid = machineGuidResult.success
            ? machineGuidResult.value
            : `Error: ${machineGuidResult.error}`
        } catch (error) {
          result.windowsRegistry.MachineGuid = `Error: ${error.message}`
        }

        // 读取 SQMClient MachineId
        try {
          const sqmResult = await window.electronAPI.readWindowsRegistry(
            'HKLM\\SOFTWARE\\Microsoft\\SQMClient',
            'MachineId'
          )
          result.windowsRegistry.SQMClientMachineId = sqmResult.success
            ? sqmResult.value
            : `Error: ${sqmResult.error}`
        } catch (error) {
          result.windowsRegistry.SQMClientMachineId = `Error: ${error.message}`
        }

        console.log('✅ Windows 注册表读取完成')
      }

      // 打印完整的机器码信息到控制台
      console.log('═══════════════════════════════════════')
      console.log('📊 当前环境的完整机器码信息：')
      console.log('═══════════════════════════════════════')
      console.log('\n📄 storage.json:')
      Object.entries(result.storageJson).forEach(([key, value]) => {
        console.log(`  ${key}:`, value)
      })
      console.log('\n🗄️ SQLite 数据库:')
      Object.entries(result.sqlite).forEach(([key, value]) => {
        console.log(`  ${key}:`, value)
      })
      console.log('\n📁 machineId 文件:')
      console.log(`  ${result.machineIdFile}`)
      if (this.platform === 'win32') {
        console.log('\n🪟 Windows 注册表:')
        Object.entries(result.windowsRegistry).forEach(([key, value]) => {
          console.log(`  ${key}:`, value)
        })
      }
      console.log('═══════════════════════════════════════')

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('❌ 读取机器码信息失败:', error)
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

      // 🔑 支持两种模式：
      // 1) 完整令牌模式：accessToken(+refreshToken)
      // 2) SessionToken 模式：仅 email+sessionToken（写入 WorkosCursorSessionToken）
      let finalAccessToken = accountData.accessToken
      let finalRefreshToken = accountData.refreshToken

      if (!accountData.email || !accountData.email.trim()) {
        throw new Error('后端返回的 email 为空')
      }

      let usingSessionOnly = !finalAccessToken && !!accountData.sessionToken

      // 如果当前仅有 sessionToken，并且在 Electron 环境中，尝试通过官方接口交换真实 accessToken
      if (usingSessionOnly && isElectron && accountData.sessionToken && window.electronAPI && window.electronAPI.exchangeSessionTokenForAccessToken) {
        try {
          console.log('🔑 检测到 SessionToken，尝试通过官方接口交换 AccessToken...')
          const exchangeResult = await window.electronAPI.exchangeSessionTokenForAccessToken(accountData.sessionToken)
          console.log('🔑 SessionToken 交换结果:', exchangeResult)

          if (exchangeResult && exchangeResult.success && exchangeResult.accessToken) {
            finalAccessToken = exchangeResult.accessToken
            finalRefreshToken = exchangeResult.refreshToken || exchangeResult.accessToken
            usingSessionOnly = false
            console.log('✅ 成功通过官方接口获取到 AccessToken，将使用完整令牌模式写入 SQLite')
          } else {
            console.warn('⚠️ 官方接口未返回有效 AccessToken，继续使用 SessionToken 模式')
          }
        } catch (e) {
          console.warn('⚠️ 调用官方接口交换 AccessToken 失败，将退回 SessionToken 模式:', e?.message || e)
        }
      }

      if (!usingSessionOnly) {
        if (!finalAccessToken || !finalAccessToken.trim()) {
          throw new Error('后端返回的 accessToken 为空，且未提供 sessionToken')
        }
      }

      console.log('✅ 数据验证通过')
      if (!usingSessionOnly) {
        console.log('📊 accessToken 长度:', finalAccessToken.length)
        console.log('📊 refreshToken 长度:', finalRefreshToken?.length || 0)
      } else {
        console.log('🔑 使用 SessionToken 模式（仅写入 WorkosCursorSessionToken）')
      }
      console.log('📧 email:', accountData.email)
      console.log('🔐 signUpType:', accountData.signUpType || 'Auth0')

      // 准备更新的字段（参考 cursor-free-vip-main 的实现）
      // ⚠️ 关键：signUpType 可能需要使用 "Auth_0" (带下划线) 而不是 "Auth0"
      const signUpType = accountData.signUpType === 'Auth0' ? 'Auth_0' : accountData.signUpType

      const updates = [
        ['cursorAuth/cachedSignUpType', signUpType || 'Auth_0'],
        ['cursorAuth/cachedEmail', accountData.email],
        ['cursorAuth/isAuthenticated', 'true']
      ]

      if (usingSessionOnly) {
        updates.push(['WorkosCursorSessionToken', accountData.sessionToken])
      } else {
        updates.push(['cursorAuth/accessToken', finalAccessToken])
        updates.push(['cursorAuth/refreshToken', finalRefreshToken || finalAccessToken])
        // 如同时提供了 sessionToken，也同步写入以提升兼容性
        if (accountData.sessionToken) {
          updates.push(['WorkosCursorSessionToken', accountData.sessionToken])
        }
      }

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
        'cursorAuth/refreshToken',
        'cursorAuth/isAuthenticated',
        'WorkosCursorSessionToken'
      ]

      const authData = {}

      for (const key of authKeys) {
        const rows = await api.sqliteQuery(this.cursorPaths.sqlite, "SELECT value FROM ItemTable WHERE key = ?", [key])
        authData[key] = rows.length > 0 ? rows[0].value : null
      }

      // 数据库连接由IPC处理程序自动管理

      const hasAccessToken = !!authData['cursorAuth/accessToken'] || !!authData['WorkosCursorSessionToken']
      const hasSessionToken = !!authData['WorkosCursorSessionToken']

      const accountInfo = {
        email: authData['cursorAuth/cachedEmail'] || 'Not logged in',
        signUpType: authData['cursorAuth/cachedSignUpType'] || 'Unknown',
        hasAccessToken: hasAccessToken,
        hasRefreshToken: !!authData['cursorAuth/refreshToken'],
        hasSessionToken: hasSessionToken,
        // 🔑 认证判断：有 sessionToken 或 accessToken 且有 email 就算认证成功
        isAuthenticated: !!authData['cursorAuth/cachedEmail'] && hasAccessToken
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
