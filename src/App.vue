<template>
  <div class="app-container">
    <AppHeader
      :lastUpdate="lastUpdate"
      :error="!!error"
      :isDark="isDark"
      @toggleTheme="toggleTheme"
    />

    <StockSection
      v-for="(section, index) in sections"
      :key="section.title + '-' + index"
      :section="section"
      @add="openAddModal(index)"
      @remove="removeItem(index, $event)"
      @showChart="openChart"
    />

    <div class="update-time">
      数据来源：新浪财经 / Yahoo Finance | 刷新频率：{{ refreshInterval / 1000 }} 秒
      | 共 {{ totalItems }} 个标的
    </div>
  </div>

  <!-- 添加弹窗 -->
  <AddStockModal
    v-if="showAddModal"
    :onAdd="handleAdd"
    @close="showAddModal = false"
  />

  <!-- 图表弹窗 -->
  <ChartModal
    v-if="showChartModal"
    :item="chartItem"
    @close="showChartModal = false"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import StockSection from './components/StockSection.vue'
import AddStockModal from './components/AddStockModal.vue'
import ChartModal from './components/ChartModal.vue'
import { useTheme } from './composables/useTheme.js'
import { useStockData } from './composables/useStockData.js'
import { REFRESH_INTERVAL } from './config/defaults.js'

const { isDark, toggleTheme } = useTheme()

const {
  sections,
  lastUpdate,
  error,
  startPolling,
  stopPolling,
  addItem,
  removeItem
} = useStockData()

const refreshInterval = REFRESH_INTERVAL
const showAddModal = ref(false)
const addSectionIndex = ref(0)
const showChartModal = ref(false)
const chartItem = ref(null)

const totalItems = computed(() => {
  return sections.value.reduce((sum, s) => sum + s.items.length, 0)
})

function openAddModal(index) {
  addSectionIndex.value = index
  showAddModal.value = true
}

async function handleAdd(code) {
  return addItem(addSectionIndex.value, code)
}

function openChart(item) {
  chartItem.value = item
  showChartModal.value = true
}

onMounted(() => {
  startPolling()
})
</script>
