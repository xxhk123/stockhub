<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ item.name }} <span style="font-weight:400;color:var(--text-muted);font-size:13px;">{{ item.code }}</span></h3>
        <button class="modal-close" @click="handleClose">&times;</button>
      </div>
      <div class="modal-body">
        <div class="chart-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="chart-tab"
            :class="{ active: activeTab === tab.id }"
            @click="switchTab(tab.id)"
          >{{ tab.label }}</button>
        </div>
        <div class="period-bar" v-if="activeTab === 'kline'">
          <button
            v-for="p in periods"
            :key="p.value"
            class="period-btn"
            :class="{ active: activePeriod === p.value }"
            @click="switchPeriod(p.value)"
          >{{ p.label }}</button>
        </div>
        <div ref="chartContainer" class="chart-container"></div>
        <div v-if="chartError" class="chart-error">{{ chartError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { createChart, LineSeries, CandlestickSeries } from 'lightweight-charts'

const props = defineProps({
  item: { type: Object, required: true }
})

const emit = defineEmits(['close'])

function handleClose() { emit('close') }

const chartContainer = ref(null)
const activeTab = ref('intraday')
const activePeriod = ref('1d')
const chartError = ref('')
let chart = null

const tabs = [
  { id: 'intraday', label: '分时图' },
  { id: 'kline', label: 'K 线图' },
]

const periods = [
  { label: '日线', value: '1d' },
  { label: '60分', value: '60m' },
  { label: '30分', value: '30m' },
  { label: '5分', value: '5m' },
]

function getChartOptions() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  return {
    width: chartContainer.value?.clientWidth || 780,
    height: 400,
    layout: {
      background: { color: isDark ? '#1E1E1E' : '#FFFFFF' },
      textColor: isDark ? '#AAAAAA' : '#666666',
    },
    grid: {
      vertLines: { color: isDark ? '#2A2A2A' : '#E8E8E8' },
      horzLines: { color: isDark ? '#2A2A2A' : '#E8E8E8' },
    },
    crosshair: { mode: 0 },
    rightPriceScale: { borderColor: isDark ? '#333' : '#DDD' },
    timeScale: { borderColor: isDark ? '#333' : '#DDD', timeVisible: true },
    localization: {
      locale: 'zh-CN',
      dateFormat: 'yyyy-MM-dd',
    },
  }
}

// 北京时间偏移（新浪返回的是北京时间，图表按 UTC 显示需修正）
const TZ_OFFSET = 8 * 60 * 60

// === 国内数据（新浪财经）===
const SINA_SCALE = { '1d': 240, '60m': 60, '30m': 30, '5m': 5 }
const SINA_LEN = { '1d': 320, '60m': 320, '30m': 200, '5m': 200 }

async function loadSinaKLine(code) {
  const scale = SINA_SCALE[activePeriod.value] || 240
  const datalen = SINA_LEN[activePeriod.value] || 320
  const res = await fetch(`/api/sina-kline?symbol=${code}&scale=${scale}&ma=5&datalen=${datalen}`)
  if (!res.ok) return null
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null
  const isDaily = activePeriod.value === '1d'
  return {
    candles: data.map(item => {
      // 日线用日期字符串（图表自动按本地时区显示），分钟线加北京时间偏移
      const t = item.day.includes(' ')
        ? Math.floor(new Date(item.day.replace(/-/g, '/')).getTime() / 1000) + TZ_OFFSET
        : item.day
      return { time: t, open: parseFloat(item.open), high: parseFloat(item.high), low: parseFloat(item.low), close: parseFloat(item.close) }
    }).filter(d => d.close > 0),
    ma5: isDaily ? data.map(d => ({ time: d.day, value: d.ma_price5 })).filter(d => d.value != null) : null,
  }
}

// 国内分时图（5 分钟线）
async function loadSinaIntraday(code) {
  const res = await fetch(`/api/sina-kline?symbol=${code}&scale=5&ma=5&datalen=100`)
  if (!res.ok) return null
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null
  return data.map(item => {
    const ts = Math.floor(new Date(item.day.replace(/-/g, '/')).getTime() / 1000) + TZ_OFFSET
    return { time: ts, value: parseFloat(item.close) }
  }).filter(d => d.value > 0)
}

// === 全球数据（Yahoo Finance）===
const YAHOO_PERIOD = { '1d': ['3mo', '1d'], '60m': ['1mo', '60m'], '30m': ['14d', '30m'], '5m': ['2d', '5m'] }

async function fetchYahooJson(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`/api/yahoo/${path}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
      if (res.status === 429) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue }
      return res.ok ? await res.json() : null
    } catch { await new Promise(r => setTimeout(r, 500)) }
  }
  return null
}

async function loadYahooKLine(code) {
  const [range, interval] = YAHOO_PERIOD[activePeriod.value] || YAHOO_PERIOD['1d']
  const json = await fetchYahooJson(`v8/finance/chart/${encodeURIComponent(code)}?range=${range}&interval=${interval}`)
  const result = json?.chart?.result?.[0]
  if (!result) return null
  const timestamps = result.timestamp
  const quote = result.indicators?.quote?.[0]
  if (!timestamps || !quote) return null
  const candles = timestamps.map((t, i) => ({
    time: t,
    open: quote.open?.[i] ?? quote.close?.[i],
    high: quote.high?.[i] ?? quote.close?.[i],
    low: quote.low?.[i] ?? quote.close?.[i],
    close: quote.close?.[i],
  })).filter(d => d.close != null && d.close > 0)
  return candles.length ? { candles } : null
}

async function loadYahooIntraday(code) {
  const json = await fetchYahooJson(`v8/finance/chart/${encodeURIComponent(code)}?range=5d&interval=15m`)
  const result = json?.chart?.result?.[0]
  if (!result) return null
  const timestamps = result.timestamp
  const closes = result.indicators?.quote?.[0]?.close
  if (!timestamps || !closes) return null
  return timestamps.map((t, i) => ({ time: t, value: closes[i] })).filter(d => d.value != null)
}

// === 主渲染 ===
async function renderChart() {
  chartError.value = ''
  if (!chartContainer.value) return
  if (chart) chart.remove()
  chart = createChart(chartContainer.value, getChartOptions())

  const code = props.item.code
  const isGlobal = !code.startsWith('sh') && !code.startsWith('sz')

  try {
    if (activeTab.value === 'intraday') {
      const data = isGlobal ? await loadYahooIntraday(code) : await loadSinaIntraday(code)
      if (!data?.length) { chartError.value = '暂无分时数据'; return }
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      const p = parseFloat(props.item.changePercent) || 0
      const lineColor = p >= 0 ? (isDark ? '#FF5252' : '#E53935') : (isDark ? '#69F0AE' : '#2E7D32')
      chart.addSeries(LineSeries, { color: lineColor, lineWidth: 2 }).setData(data)
    } else {
      const data = isGlobal ? await loadYahooKLine(code) : await loadSinaKLine(code)
      if (!data?.candles?.length) { chartError.value = '暂无K线数据'; return }
      chart.addSeries(CandlestickSeries, {
        upColor: '#E53935', downColor: '#2E7D32',
        borderUpColor: '#E53935', borderDownColor: '#2E7D32',
        wickUpColor: '#E53935', wickDownColor: '#2E7D32',
      }).setData(data.candles)
      if (!isGlobal && data.ma5?.length) {
        chart.addSeries(LineSeries, {
          color: '#F59E0B', lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
        }).setData(data.ma5)
      }
    }
    chart.timeScale().fitContent()
  } catch (e) {
    console.error('Chart error:', e)
    chartError.value = '数据加载失败，请稍后重试'
  }
}

function switchTab(tab) {
  activeTab.value = tab
  renderChart()
}

function switchPeriod(period) {
  activePeriod.value = period
  renderChart()
}

let escHandler = null

onMounted(() => {
  nextTick(() => renderChart())
  escHandler = (e) => { if (e.key === 'Escape') handleClose() }
  window.addEventListener('keydown', escHandler)
})

onUnmounted(() => {
  window.removeEventListener('keydown', escHandler)
  if (chart) { chart.remove(); chart = null }
})
</script>
