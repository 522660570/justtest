import { invoke } from '@tauri-apps/api/core'
import { getVersion } from '@tauri-apps/api/app'
import { homeDir } from '@tauri-apps/api/path'

// Tauri v2 检测：__TAURI_INTERNALS__ 由 Tauri webview 自动注入
const isTauri = typeof window !== 'undefined' && (
  window.__TAURI_INTERNALS__ ||
  window.__TAURI__ ||
  (window.ipc && typeof window.ipc.postMessage === 'function')
)

const tauriAPI = {
  async getPlatform() {
    return await invoke('get_platform')
  },

  async getHomedir() {
    return await homeDir()
  },

  async pathJoin(...args) {
    return await invoke('path_join', { args })
  },

  async fsAccess(filePath) {
    return await invoke('fs_access', { path: filePath })
  },

  async fsReadFile(filePath, encoding = 'utf8') {
    return await invoke('fs_read_file', { path: filePath })
  },

  async fsWriteFile(filePath, data, encoding = 'utf8') {
    return await invoke('fs_write_file', { path: filePath, data })
  },

  async sqliteQuery(dbPath, query, params = []) {
    return await invoke('sqlite_query', { dbPath, query, params })
  },

  async sqliteBatchRun(dbPath, statements) {
    return await invoke('sqlite_batch_run', { dbPath, statements })
  },

  async execCommand(command) {
    return await invoke('exec_command', { command })
  },

  async execCommandAsync(command) {
    return await invoke('exec_command_async', { command })
  },

  async spawnDetached(command, args = []) {
    return await invoke('spawn_detached', { command, args })
  },

  async readConfigFile() {
    return await invoke('read_config_file')
  },

  async writeConfigFile(data) {
    return await invoke('write_config_file', { data })
  },

  async deleteConfigFile() {
    return await invoke('delete_config_file')
  },

  async getConfigFileInfo() {
    return await invoke('get_config_file_info')
  },

  async getAppVersion() {
    return await getVersion()
  },

  async getAppPath() {
    return await invoke('get_homedir')
  },

  async findCursorExecutable() {
    return await invoke('find_cursor_executable_cmd')
  },

  async findCursorDb() {
    return await invoke('find_cursor_db_cmd')
  },

  async checkCursorProcess() {
    return await invoke('check_cursor_process')
  },

  async killCursorProcess() {
    return await invoke('kill_cursor_process')
  },

  async startCursor() {
    return await invoke('start_cursor')
  },

  async getMacAddress() {
    return await invoke('get_mac_address')
  },

  async updateWindowsRegistry(keyPath, valueName, value) {
    return await invoke('update_windows_registry', { keyPath, valueName, value })
  },

  async readWindowsRegistry(keyPath, valueName) {
    return await invoke('read_windows_registry', { keyPath, valueName })
  },

  async unlockFile(filePath) {
    return await invoke('unlock_file', { path: filePath })
  },

  async exchangeSessionTokenForAccessToken(sessionToken) {
    return await invoke('exchange_session_token_for_access_token', { sessionToken })
  },

  async checkAdminRights() {
    return await invoke('check_admin_rights')
  },

  async getLogPath() {
    return await invoke('get_log_path')
  },

  async readLogFile(lines = 100) {
    return await invoke('read_log_file', { lines })
  },

  async clearLogFile() {
    return await invoke('clear_log_file')
  },

  async getCursorVersion() {
    return await invoke('get_cursor_version')
  },

  async getAppEnvironment() {
    return await invoke('get_app_environment')
  },

  async getDebugMode() {
    return await invoke('get_debug_mode')
  },

  onToggleDebugPanel(callback) {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault()
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  },

  async showMessageBox(options) {
    const { message } = await import('@tauri-apps/plugin-dialog')
    return await message(options.message, { title: options.title, kind: options.type || 'info' })
  },

  async showErrorBox(title, content) {
    const { message } = await import('@tauri-apps/plugin-dialog')
    return await message(content, { title, kind: 'error' })
  },

  async openPurchasePage(url) {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(url)
  },

  async openExternal(url) {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(url)
  },

  async openFileDialog(options = {}) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    let defaultFilters
    try {
      const platform = await this.getPlatform()
      if (platform === 'win32') {
        defaultFilters = [{ name: '可执行文件 (*.exe, *.lnk)', extensions: ['exe', 'lnk'] }]
      } else if (platform === 'darwin') {
        defaultFilters = [
          { name: '应用程序 (*.app)', extensions: ['app'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      } else {
        defaultFilters = [{ name: '所有文件', extensions: ['*'] }]
      }
    } catch (_) {
      defaultFilters = [{ name: '所有文件', extensions: ['*'] }]
    }

    const result = await open({
      multiple: false,
      title: options.title,
      filters: options.filters || defaultFilters
    })
    return { success: !!result, filePath: result }
  },

  async minimizeWindow() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().minimize()
  },

  async maximizeWindow() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const win = getCurrentWindow()
    if (await win.isMaximized()) {
      await win.unmaximize()
    } else {
      await win.maximize()
    }
  },

  async closeWindow() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().close()
  },

  async getWindowState() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const win = getCurrentWindow()
    return {
      isMaximized: await win.isMaximized(),
      isMinimized: await win.isMinimized(),
      isFullScreen: await win.isFullscreen()
    }
  },

  async startDrag(data) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().startDragging()
  },

  async injectWorkbench() {
    return await invoke('inject_workbench')
  },

  async restoreWorkbench() {
    return await invoke('restore_workbench')
  },

  async getSeamlessStatus() {
    return await invoke('get_seamless_status')
  },

  async startHttpServer(port) {
    return await invoke('start_http_server', { port: port || 36529 })
  },

  async stopHttpServer() {
    return await invoke('stop_http_server')
  },

  async pushPendingSwitch(token, refreshToken, email, sessionToken) {
    return await invoke('push_pending_switch', { token, refreshToken, email, sessionToken: sessionToken || null })

  },

  async fetchAccountEncrypted(url) {
    return await invoke('fetch_account_encrypted', { url })
  },

  async getQuotaStatus() {
    return await invoke('get_quota_status')
  },

  async reloadCursorWindow() {
    return await invoke('reload_cursor_window')
  },

  async debugQuotaCheck() {
    return await invoke('debug_quota_check')
  },

  async quitApp() {
    const { exit } = await import('@tauri-apps/plugin-process')
    await exit(0)
  }
}

export { isTauri, tauriAPI }

export function initTauriBridge() {
  if (window.electronAPI) return
  if (isTauri) {
    window.electronAPI = tauriAPI
    console.log('🔧 Tauri bridge initialized (__TAURI_INTERNALS__ detected)')
    return
  }
  // 兜底：尝试调用 invoke 检测是否在 Tauri 环境
  invoke('get_platform').then((platform) => {
    window.electronAPI = tauriAPI
    console.log('🔧 Tauri bridge initialized (invoke probe: ' + platform + ')')
  }).catch(() => {
    console.log('⚠️ Not in Tauri environment, electronAPI not set')
  })
}
