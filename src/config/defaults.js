export const REFRESH_INTERVAL = 3000 // 默认轮询间隔(ms)
export const DATA_SOURCE = '新浪财经 / Yahoo Finance'

export const DEFAULT_SECTIONS = {
  domestic: {
    title: '国内主要指数',
    items: [
      { name: '上证指数', code: 'sh000001' },
      { name: '深证成指', code: 'sz399001' },
      { name: '创业板指', code: 'sz399006' },
      { name: '科创50', code: 'sh000688' },
      { name: '沪深300', code: 'sh000300' }
    ]
  },
  global: {
    title: '全球主要指数',
    items: [
      { name: '道琼斯', code: '^DJI' },
      { name: '纳斯达克', code: '^IXIC' },
      { name: '标普500', code: '^GSPC' },
      { name: '恒生指数', code: '^HSI' },
      { name: '日经225', code: '^N225' }
    ]
  },
  commodity_forex: {
    title: '商品汇率',
    items: [
      { name: '黄金', code: 'GC=F' },
      { name: '白银', code: 'SI=F' },
      { name: '原油', code: 'CL=F' },
      { name: '美元/人民币', code: 'CNY=X' },
      { name: '比特币', code: 'BTC-USD' }
    ]
  },
  favorite: {
    title: '收藏',
    items: []
  }
}
