import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api/sina-kline': {
        target: 'https://money.finance.sina.com.cn',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/sina-kline/, '/quotes_service/api/json_v2.php/CN_MarketData.getKLineData')
      },
      '/api/sina': {
        target: 'https://hq.sinajs.cn',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/sina/, ''),
        headers: { 'Referer': 'https://finance.sina.com.cn' }
      },
      '/api/tencent': {
        target: 'https://web.ifzq.gtimg.cn',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/tencent/, '')
      },
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/yahoo/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
      }
    }
  }
})
