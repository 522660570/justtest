const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 现有的API
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showErrorBox: (title, content) => ipcRenderer.invoke('show-error-box', title, content),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // 新增的配置文件API
  readConfigFile: () => ipcRenderer.invoke('read-config-file'),
  writeConfigFile: (data) => ipcRenderer.invoke('write-config-file', data),
  deleteConfigFile: () => ipcRenderer.invoke('delete-config-file'),
  getConfigFileInfo: () => ipcRenderer.invoke('get-config-file-info'),

  // CursorService需要的API
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getHomedir: () => ipcRenderer.invoke('get-homedir'),
  pathJoin: (...args) => ipcRenderer.invoke('path-join', ...args),
  fsAccess: (filePath) => ipcRenderer.invoke('fs-access', filePath),
  fsReadFile: (filePath, encoding) => ipcRenderer.invoke('fs-read-file', filePath, encoding),
  fsWriteFile: (filePath, data, encoding) => ipcRenderer.invoke('fs-write-file', filePath, data, encoding),
  sqliteQuery: (dbPath, query, params) => ipcRenderer.invoke('sqlite-query', dbPath, query, params),
  execCommand: (command) => ipcRenderer.invoke('exec-command', command),
  execCommandAsync: (command) => ipcRenderer.invoke('exec-command-async', command),
  spawnDetached: (command, args) => ipcRenderer.invoke('spawn-detached', command, args),
  
  // 调试和路径检测API
  findCursorExecutable: () => ipcRenderer.invoke('find-cursor-executable'),
  findCursorDb: () => ipcRenderer.invoke('find-cursor-db'),
  listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', dirPath),
  
  // 设备信息API
  getMacAddress: () => ipcRenderer.invoke('get-mac-address'),
  
  // 日志相关API
  getLogPath: () => ipcRenderer.invoke('get-log-path'),
  readLogFile: (lines) => ipcRenderer.invoke('read-log-file', lines),
  clearLogFile: () => ipcRenderer.invoke('clear-log-file'),
  
  // 自定义标题栏API
  startDrag: (data) => ipcRenderer.invoke('start-drag', data),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  
  // 管理员权限检查API
  checkAdminRights: () => ipcRenderer.invoke('check-admin-rights'),
  
  // 购买页面API
  openPurchasePage: (url) => ipcRenderer.invoke('open-purchase-page', url),
  
  // 环境检测API
  getAppEnvironment: () => ipcRenderer.invoke('get-app-environment')
})

// 在开发模式下暴露一些调试信息
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDev', {
    platform: process.platform,
    versions: process.versions
  })
}
