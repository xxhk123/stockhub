/**
 * 行情数据 API 适配层
 * 国内：新浪财经（实时行情）
 * 全球：Yahoo Finance（通过代理）
 */

// 解析新浪 CSV 数据
// 格式: var hq_str_sh000001="上证指数,3200.12,3175.30,3220.45,3225.50,3175.10,...";
function parseSinaData(code, str) {
  try {
    const parts = str.split('"')[1].split(',')
    return {
      code,
      name: parts[0],
      price: parseFloat(parts[3]) || parseFloat(parts[1]),
      change: parseFloat(parts[3]) - parseFloat(parts[2]),
      changePercent: parseFloat(parts[3])
        ? ((parseFloat(parts[3]) - parseFloat(parts[2])) / parseFloat(parts[2]) * 100).toFixed(2)
        : '0.00',
      time: `${parts[30]} ${parts[31]}`
    }
  } catch {
    return null
  }
}

// 批量获取国内行情
export async function fetchDomestic(codes, signal) {
  if (!codes.length) return []
  const list = codes.join(',')
  const url = `/api/sina/list=${list}`

  const res = await fetch(url, { signal })
  const buffer = await res.arrayBuffer()
  // 新浪 API 返回 GBK 编码，需正确解码避免中文乱码
  const text = new TextDecoder('gbk').decode(buffer)

  return codes.map(code => {
    const match = text.match(new RegExp(`var hq_str_${code}="([^"]+)"`))
    if (!match) return null
    return parseSinaData(code, `"${match[1]}"`)
  }).filter(Boolean)
}

// 解析 Yahoo Finance JSON 数据
function parseYahooData(code, data) {
  try {
    const result = data.chart?.result?.[0]
    if (!result) return null
    const meta = result.meta
    const quote = result.indicators?.quote?.[0]
    if (!meta || !quote) return null

    const prices = quote.close || quote.open
    const currentPrice = prices?.[prices.length - 1]
    const prevClose = meta.previousClose || meta.chartPreviousClose || currentPrice
    const change = currentPrice - prevClose
    const changePercent = ((change / prevClose) * 100).toFixed(2)

    return {
      code,
      name: meta.shortName || code,
      price: currentPrice,
      change,
      changePercent,
      time: new Date().toLocaleString()
    }
  } catch {
    return null
  }
}

// Yahoo Finance 域名列表（轮流尝试）
const YAHOO_DOMAINS = [
  'query1.finance.yahoo.com',
  'query2.finance.yahoo.com',
]

async function fetchYahooJson(path, signal, retries = 2) {
  let lastErr
  for (const domain of YAHOO_DOMAINS) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = `/api/yahoo/${path}`
        const res = await fetch(url, {
          signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
          }
        })
        if (res.status === 429) {
          // 限流，等一会重试（仅限非首次）
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
            continue
          }
          return null
        }
        if (!res.ok) return null
        // 代理会将实际域名覆盖，但响应来自 Yahoo
        return await res.json()
      } catch (e) {
        if (e.name === 'AbortError') throw e
        lastErr = e
        await new Promise(r => setTimeout(r, 500))
      }
    }
  }
  return null
}

// 批量获取全球行情
export async function fetchGlobal(codes, signal) {
  if (!codes.length) return []

  const results = await Promise.allSettled(
    codes.map(async code => {
      const symbol = encodeURIComponent(code)
      const data = await fetchYahooJson(`v8/finance/chart/${symbol}?range=1d&interval=1d`, signal)
      if (!data) return null
      return parseYahooData(code, data)
    })
  )

  return results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)
}

// 通用获取（自动识别类型）
export async function fetchStockData(code, signal) {
  // 国内代码特征：sh/sz 开头
  if (code.startsWith('sh') || code.startsWith('sz')) {
    const list = await fetchDomestic([code], signal)
    return list[0] || null
  }
  // 其他走 Yahoo
  const data = await fetchYahooJson(`v8/finance/chart/${encodeURIComponent(code)}?range=1d&interval=1d`, signal)
  if (!data) return null
  return parseYahooData(code, data)
}
