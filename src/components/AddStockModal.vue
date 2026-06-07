<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" style="max-width: 440px;">
      <div class="modal-header">
        <h3>添加标的</h3>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>代码</label>
          <input
            ref="codeInput"
            class="form-input"
            v-model="code"
            placeholder="例如: sh000001 / AAPL / GC=F"
            @keyup.enter="handleSubmit"
          />
          <div class="form-hint">
            国内: 输入 6 位数字自动识别<br>
            (6开头→沪 sh, 其他→深 sz) 如 000725<br>
            全球: AAPL / ^DJI / GC=F / BTC-USD
          </div>
          <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px;">
          <button class="btn" @click="$emit('close')">取消</button>
          <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '添加中...' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  onAdd: { type: Function, required: true }
})

const emit = defineEmits(['close'])

const code = ref('')
const errorMsg = ref('')
const submitting = ref(false)
const codeInput = ref(null)

onMounted(() => {
  codeInput.value?.focus()
})

function normalizeCode(val) {
  val = val.trim()
  // 国内代码：6 位数字，自动识别 sh/sz
  if (/^\d{6}$/i.test(val)) {
    const prefix = val.startsWith('6') ? 'sh' : 'sz'
    return prefix + val
  }
  // 已带 sh/sz 前缀
  if (/^(sh|sz)\d{6}$/i.test(val)) {
    return val.toLowerCase()
  }
  // 全球代码大写（Yahoo 符号）
  return val.toUpperCase()
}

async function handleSubmit() {
  if (!code.value.trim()) {
    errorMsg.value = '请输入代码'
    return
  }

  const normalized = normalizeCode(code.value)
  errorMsg.value = ''
  submitting.value = true

  try {
    await props.onAdd(normalized)
    emit('close')
  } catch (e) {
    errorMsg.value = e?.message || '添加失败，请重试'
  } finally {
    submitting.value = false
  }
}
</script>
