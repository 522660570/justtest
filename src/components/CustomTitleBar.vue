<template>
  <div class="custom-title-bar" data-tauri-drag-region>
    <div class="title-bar-content">
      <div class="app-title">
        <img src="/icon.ico" alt="Cursor Manager" class="app-icon">
        Cursor无限试用工具
      </div>
      <div class="window-controls">
        <button class="control-btn minimize-btn" @click="minimizeWindow" title="最小化">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="0" y="4" width="10" height="2" fill="currentColor"/>
          </svg>
        </button>
        <button class="control-btn close-btn" @click="closeWindow" title="关闭">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0,0 L10,10 M10,0 L0,10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getCurrentWindow } from '@tauri-apps/api/window'

export default {
  name: 'CustomTitleBar',
  methods: {
    minimizeWindow() {
      getCurrentWindow().minimize()
    },
    closeWindow() {
      getCurrentWindow().close()
    }
  }
}
</script>

<style scoped>
.custom-title-bar {
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  user-select: none;
  -webkit-app-region: drag;
  position: relative;
  z-index: 1000;
}

.title-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 12px;
}

.app-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  gap: 8px;
}

.app-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.window-controls {
  display: flex;
  gap: 2px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 32px;
  height: 24px;
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.control-btn:active {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn:hover {
  background: #e81123;
}

.close-btn:active {
  background: #c50e1f;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .custom-title-bar {
    background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  }
}
</style>


