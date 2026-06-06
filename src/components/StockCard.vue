<template>
  <div class="stock-card" @click="$emit('click')">
    <button class="delete-btn btn-icon" @click.stop="$emit('delete')" title="删除">✕</button>
    <div class="card-header">
      <span class="card-name">{{ item.name }}</span>
      <span class="card-code">{{ displayCode }}</span>
    </div>
    <div class="card-price">
      {{ item.price != null ? formatPrice(item.price) : '--' }}
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

function formatPrice(price) {
  const n = parseFloat(price)
  return isNaN(n) ? '--' : n.toFixed(2)
}

function formatPercent(p) {
  const n = parseFloat(p)
  if (isNaN(n)) return '--'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}
</script>
