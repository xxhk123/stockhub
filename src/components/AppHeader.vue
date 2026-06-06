<template>
  <header class="app-header">
    <div class="logo">
      <span>StockHub</span>
      实时行情
    </div>
    <div class="header-right">
      <span v-if="lastUpdate">最新数据：{{ lastUpdate }}</span>
      <span v-if="error" class="error-badge">⚠ 加载异常</span>
      <button class="theme-toggle" @click="$emit('toggleTheme')">
        {{ isDark ? '☀️' : '🌙' }}
        {{ isDark ? '浅色' : '深色' }}
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  lastUpdate: String,
  error: Boolean,
  isDark: Boolean
})

defineEmits(['toggleTheme'])
</script>
