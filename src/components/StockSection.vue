<template>
  <div class="section">
    <div class="section-header">
      <h2 class="section-title">{{ section.title }}</h2>
      <div class="section-actions">
        <button class="btn btn-sm" @click="$emit('add')">+ 添加</button>
      </div>
    </div>

    <div v-if="section.items.length === 0" class="empty-state">
      <div>暂无标的</div>
      <div class="hint">点击"+ 添加"按钮添加自选</div>
    </div>

    <div v-else class="stock-grid">
      <StockCard
        v-for="(item, index) in section.items"
        :key="item.code + '-' + index"
        :item="item"
        @click="$emit('showChart', item)"
        @delete="$emit('remove', index)"
      />
    </div>
  </div>
</template>

<script setup>
import StockCard from './StockCard.vue'

defineProps({
  section: { type: Object, required: true }
})

defineEmits(['add', 'remove', 'showChart'])
</script>
