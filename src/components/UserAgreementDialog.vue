<template>
  <div v-if="visible" class="agreement-overlay">
    <div class="agreement-dialog">
      <!-- 标题 -->
      <div class="agreement-header">
        <span class="header-icon">📋</span>
        <h2>用户协议与免责声明</h2>
      </div>

      <!-- 内容区域 -->
      <div class="agreement-body" ref="scrollContainer" @scroll="handleScroll">
        <!-- 重要提示 -->
        <div class="important-notice">
          <span class="notice-icon">⚠️</span>
          <span>重要提示：请在使用本软件前仔细阅读以下声明</span>
        </div>

        <!-- 协议正文 -->
        <div class="agreement-content">
          <div class="section">
            <h3>1. 软件修改授权与知情同意</h3>
            <p>
              本软件运行时将对您本地安装的 Cursor 编辑器相关文件进行必要的修改，以实现账号切换功能。<span class="highlight">您明确知晓</span>此行为涉及对计算机软件的修改，并<span class="highlight-underline">完全自愿</span>、<span class="highlight-underline">主动授权</span>本软件执行上述修改操作。您确认在安装、激活和使用本软件的全过程中，<span class="highlight-underline">完全知情且自愿</span>，不存在任何欺骗、误导或强迫行为。
            </p>
          </div>

          <div class="section">
            <h3>2. 计算机安全法律合规声明</h3>
            <p>
              您确认已了解《中华人民共和国网络安全法》《计算机信息系统安全保护条例》等相关法律法规，并承诺：
            </p>
            <ul>
              <li>您对本计算机拥有合法的使用权和管理权</li>
              <li>您自愿对本计算机上的软件进行合法修改</li>
              <li>您理解并承担因软件修改可能产生的一切后果</li>
              <li>您不会以"未经授权修改计算机"为由对开发者提起任何法律诉讼或索赔</li>
            </ul>
          </div>

          <div class="section">
            <h3>3. 数据安全承诺</h3>
            <p>
              本软件<span class="highlight-underline">不会收集、读取、上传或以任何方式获取</span>您的项目代码、源文件、个人文档及任何敏感数据。软件仅与授权服务器进行必要的激活验证通信。所有文件修改均在本地进行，不涉及数据传输。
            </p>
          </div>

          <div class="section">
            <h3>4. 使用风险告知</h3>
            <p>使用本软件可能存在以下风险，您明确知晓并自愿承担：</p>
            <ul>
              <li>Cursor 官方更新后可能导致软件功能失效</li>
              <li>修改操作可能影响 Cursor 的正常运行或稳定性</li>
              <li>您的账号可能因违反 Cursor 服务条款而受到限制或封禁</li>
              <li>可能触发系统安全软件的警报或拦截</li>
              <li>可能影响软件的官方技术支持服务</li>
            </ul>
          </div>

          <div class="section">
            <h3>5. 责任限制与免责</h3>
            <p>
              本软件按"现状"和"可用"基础提供，不附带任何明示或暗示的保证。开发者<span class="highlight-red">不对因使用本软件而导致的任何直接、间接、偶然、特殊或后果性损失承担责任</span>，包括但不限于数据丢失、软件故障、账号封禁、业务中断、利润损失、计算机系统损坏等。您同意放弃因使用本软件而对开发者的一切索赔权利。
            </p>
          </div>

          <div class="section">
            <h3>6. 合法使用承诺</h3>
            <p>
              您承诺将本软件仅用于合法、正当用途，不得利用本软件从事任何违法违规活动。因违规使用、滥用或不当使用产生的一切法律责任、经济损失及不利后果均由您本人独立承担。
            </p>
          </div>

          <div class="section">
            <h3>7. 明确授权与弃权声明</h3>
            <p>点击"同意并继续"即表示您已：</p>
            <ul>
              <li>完全阅读、理解并接受本声明的全部内容</li>
              <li>确认在<span class="highlight-underline">完全知情、自愿且主动</span>的情况下使用本软件</li>
              <li>明确授权本软件对您的 Cursor 客户端进行必要的修改操作</li>
              <li>自愿承担所有使用风险和可能的不利后果</li>
              <li>放弃以"未经授权修改"、"不知情"等为由向开发者主张任何权利</li>
              <li>同意本声明作为具有法律效力的协议约束双方</li>
            </ul>
          </div>

          <!-- 底部法律声明 -->
          <div class="legal-footer">
            本声明构成具有法律效力的协议 | 最终解释权归软件开发者所有 | 更新日期：2025年12月05日
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="agreement-footer">
        <!-- 已阅读提示 -->
        <div class="read-hint">
          <span class="hint-icon">ℹ️</span>
          <span>我已仔细阅读并理解<span class="highlight-underline">上述全部内容</span></span>
          <span class="hint-icon">ℹ️</span>
        </div>

        <!-- 勾选框 -->
        <div class="checkbox-wrapper">
          <label class="custom-checkbox" @click.prevent="toggleCheckbox">
            <span :class="['checkbox-box', { checked: isChecked }]">
              <span v-if="isChecked" class="checkmark">✓</span>
            </span>
            <span class="checkbox-label">我已仔细阅读并理解<span class="highlight-underline">上述全部内容</span></span>
          </label>
        </div>

        <!-- 按钮组 -->
        <div class="button-group">
          <button class="btn btn-cancel" @click="handleDisagree">
            不同意并退出
          </button>
          <button
            class="btn btn-confirm"
            :class="{ disabled: !isChecked }"
            :disabled="!isChecked"
            @click="handleAgree"
          >
            同意协议并继续
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserAgreementDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['agree', 'disagree'],
  data() {
    return {
      isChecked: false
    }
  },
  methods: {
    toggleCheckbox() {
      this.isChecked = !this.isChecked
    },
    handleScroll() {
      // 可选：滚动到底部自动提示
    },
    handleAgree() {
      if (!this.isChecked) return
      this.$emit('agree')
    },
    handleDisagree() {
      this.$emit('disagree')
    }
  }
}
</script>

<style scoped>
.agreement-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.agreement-dialog {
  background: #ffffff;
  border-radius: 16px;
  width: 620px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* 标题 */
.agreement-header {
  background: linear-gradient(135deg, #e8f4fd 0%, #d6ecfa 100%);
  padding: 20px 30px;
  text-align: center;
  border-bottom: 1px solid #d0e8f5;
  flex-shrink: 0;
}

.agreement-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1890ff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 22px;
}

/* 内容区域 */
.agreement-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 30px;
  min-height: 0;
}

/* 重要提示横幅 */
.important-notice {
  background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%);
  border: 1px solid #ffe082;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #856404;
}

.notice-icon {
  font-size: 16px;
  flex-shrink: 0;
}

/* 协议正文 */
.agreement-content {
  font-size: 14px;
  line-height: 1.8;
  color: #333;
}

.section {
  margin-bottom: 20px;
}

.section h3 {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 10px 0;
}

.section p {
  margin: 0 0 8px 0;
  text-align: justify;
}

.section ul {
  margin: 8px 0;
  padding-left: 20px;
}

.section ul li {
  margin-bottom: 6px;
  position: relative;
}

/* 高亮文字 */
.highlight {
  color: #1890ff;
  font-weight: 600;
}

.highlight-underline {
  color: #1890ff;
  font-weight: 600;
  text-decoration: underline;
}

.highlight-red {
  color: #f5222d;
  font-weight: 600;
  text-decoration: underline;
}

/* 底部法律声明 */
.legal-footer {
  margin-top: 24px;
  padding: 12px 16px;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  font-size: 13px;
  color: #888;
  text-align: center;
}

/* 底部操作区 */
.agreement-footer {
  border-top: 1px solid #f0f0f0;
  padding: 16px 30px 20px;
  flex-shrink: 0;
  background: #fafafa;
}

/* 已阅读提示 */
.read-hint {
  text-align: center;
  font-size: 13px;
  color: #1890ff;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.hint-icon {
  font-size: 14px;
}

/* 勾选框 */
.checkbox-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.custom-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: #333;
}

.checkbox-box {
  width: 18px;
  height: 18px;
  border: 2px solid #d9d9d9;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-box.checked {
  background: #1890ff;
  border-color: #1890ff;
}

.checkmark {
  color: white;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
}

.checkbox-label {
  color: #333;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn {
  padding: 10px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  min-width: 160px;
}

.btn-cancel {
  background: #ffffff;
  color: #666;
  border-color: #d9d9d9;
}

.btn-cancel:hover {
  color: #333;
  border-color: #b3b3b3;
  background: #f5f5f5;
}

.btn-confirm {
  background: #1890ff;
  color: #ffffff;
  border-color: #1890ff;
}

.btn-confirm:hover:not(.disabled) {
  background: #40a9ff;
  border-color: #40a9ff;
}

.btn-confirm.disabled {
  background: #d9d9d9;
  border-color: #d9d9d9;
  color: #fff;
  cursor: not-allowed;
}

/* 滚动条样式 */
.agreement-body::-webkit-scrollbar {
  width: 6px;
}

.agreement-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.agreement-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.agreement-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
