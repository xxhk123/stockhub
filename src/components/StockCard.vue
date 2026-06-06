<template>
  <div class="stock-card" @click="$emit('click')">
    <button class="delete-btn btn-icon" @click.stop="$emit('delete')" title="删除">✕</button>
    <div class="card-header">
      <span class="card-name">{{ item.name }}</span>
      <span class="card-code">{{ displayCode }}</span>
    </div>
    <div class="card-price">
      <span v-if="unit" class="price-unit">{{ unit }}</span>{{ item.price != null ? formatPrice(item.price) : '--' }}
    </div>
    <div class="card-change" :class="changeClass">
      {{ item.changePercent != null ? formatPercent(item.changePercent) : '--' }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true }
})

defineEmits(['click', 'delete'])

const changeClass = computed(() => {
  const p = parseFloat(props.item.changePercent)
  if (isNaN(p)) return 'neutral'
  return p > 0 ? 'up' : p < 0 ? 'down' : 'neutral'
})

const displayCode = computed(() => {
  return props.item.code ? props.item.code.replace(/^\^/, '') : ''
})

const unit = computed(() => {
  const code = props.item.code || ''
  if (code.startsWith('sh') || code.startsWith('sz')) return ''
  if (code.endsWith('=X')) return ''
  return '$'
})

function formatPrice(price) {
  const n = parseFloat(price)
  if (isNaN(n)) return '--'
  const code = props.item.code || ''
  // 汇率显示4位小数
  if (code.endsWith('=X')) return n.toFixed(4)
  // 商品/加密货币格式
  if (['GC=F','SI=F','CL=F','BTC-USD'].some(s => code.includes(s))) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  // 指数用2位小数
  if (n > 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n.toFixed(2)
}

function formatPercent(p) {
  const n = parseFloat(p)
  if (isNaN(n)) return '--'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}
</script>
