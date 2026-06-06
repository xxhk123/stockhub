import { ref, onUnmounted } from 'vue'
import { fetchDomestic, fetchGlobal, fetchStockData } from '../services/api.js'
import { DEFAULT_SECTIONS, REFRESH_INTERVAL } from '../config/defaults.js'
import { useLocalStorage } from './useLocalStorage.js'

const STORAGE_KEY = 'stockhub_sections'

export function useStockData() {
  const sections = ref([])
  const lastUpdate = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const { get, set } = useLocalStorage(STORAGE_KEY, null)

  let timer = null
  let abortController = null

  // 初始化板块数据
  const initSections = () => {
    const saved = get()
    if (saved && Array.isArray(saved) && saved.length === 4) {
      sections.value = saved
    } else {
      sections.value = Object.values(DEFAULT_SECTIONS).map(s => ({
        title: s.title,
        items: s.items.map(item => ({ ...item, price: null, changePercent: null }))
      }))
    }
  }

  // 刷新所有数据
  const refreshAll = async () => {
    if (loading.value) return
    loading.value = true
    error.value = null

    // 取消上一次请求
    if (abortController) abortController.abort()
    abortController = new AbortController()
    const signal = abortController.signal

    try {
      const promises = sections.value.map(async (section) => {
        const codes = section.items
          .map(item => item.code)
          .filter(Boolean)

        if (!codes.length) return section

        // 判断是国内还是全球
        const domesticCodes = codes.filter(c => c.startsWith('sh') || c.startsWith('sz'))
        const globalCodes = codes.filter(c => !c.startsWith('sh') && !c.startsWith('sz'))

        const [domesticData, globalData] = await Promise.all([
          domesticCodes.length ? fetchDomestic(domesticCodes, signal) : Promise.resolve([]),
          globalCodes.length ? fetchGlobal(globalCodes, signal) : Promise.resolve([])
        ])

        const dataMap = {}
        domesticData.forEach(d => { if (d) dataMap[d.code] = d })
        globalData.forEach(d => { if (d) dataMap[d.code] = d })

        return {
          ...section,
          items: section.items.map(item => {
            const data = dataMap[item.code]
            return data
              ? { ...item, price: data.price, changePercent: data.changePercent, change: data.change }
              : item
          })
        }
      })

      sections.value = await Promise.all(promises)
      lastUpdate.value = new Date().toLocaleString()
      saveToStorage()
    } catch (e) {
      if (e.name !== 'AbortError') {
        error.value = '数据加载失败'
      }
    } finally {
      loading.value = false
    }
  }

  // 启动轮询
  const startPolling = () => {
    initSections()
    refreshAll()
    timer = setInterval(refreshAll, REFRESH_INTERVAL)
  }

  // 停止轮询
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  // 保存到 localStorage
  const saveToStorage = () => {
    set(sections.value.map(s => ({
      title: s.title,
      items: s.items.map(({ code, name }) => ({ code, name }))
    })))
  }

  // 添加标的
  const addItem = async (sectionIndex, code, name) => {
    // 去重
    if (sections.value[sectionIndex].items.some(i => i.code === code)) {
      throw new Error('该标的已存在')
    }

    // 获取数据（网络失败时不阻塞添加）
    let data = null
    try {
      data = await fetchStockData(code)
    } catch {
      // 网络或 API 失败，先添加占位，下次轮询会刷新
    }

    const item = {
      code,
      name: name || data?.name || code,
      price: data?.price || null,
      changePercent: data?.changePercent || null
    }

    sections.value[sectionIndex].items.push(item)
    saveToStorage()
    return { success: true }
  }

  // 删除标的
  const removeItem = (sectionIndex, itemIndex) => {
    sections.value[sectionIndex].items.splice(itemIndex, 1)
    saveToStorage()
  }

  onUnmounted(() => {
    stopPolling()
  })

  return {
    sections,
    lastUpdate,
    loading,
    error,
    startPolling,
    stopPolling,
    addItem,
    removeItem
  }
}
