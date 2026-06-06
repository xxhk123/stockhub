# StockHub - 实时股票行情看板

实时查看 A 股、全球股指、商品汇率和自选收藏的行情看板。数据源为新浪财经 + Yahoo Finance。

## 功能

- 国内主要指数（上证、深证、创业板、科创50、沪深300）
- 全球主要指数（道琼斯、纳斯达克、标普500、恒生、日经225）
- 商品汇率（黄金、白银、原油、美元/人民币、比特币）
- 自选收藏板块，自由添加/删除标的
- K 线图（日线/60分/30分/5分）+ 分时图
- A 股 K 线显示 MA5 均线
- 自动轮询刷新（3 秒间隔）
- 浅色/深色主题切换
- Docker 部署

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## Docker 部署

### 构建镜像

```bash
npm run build
docker build -t stockhub .
```

### 运行容器

```bash
docker run -d \
  --name stockhub \
  -p 8080:80 \
  --restart unless-stopped \
  stockhub
```

### Nginx Proxy Manager 反代

| 字段 | 值 |
|------|-----|
| Domain | 你的域名 |
| Scheme | http |
| Forward Hostname | 服务器 IP |
| Forward Port | 8080 |

无需额外配置 Custom Locations，容器内已内置新浪/Yahoo API 代理。

### 更新部署

```bash
git pull
npm install && npm run build
docker build -t stockhub .
docker stop stockhub && docker rm stockhub
docker run -d --name stockhub -p 8080:80 --restart unless-stopped stockhub
```

## API 代理

| 接口 | 上游 |
|------|------|
| `/api/sina/` | 新浪财经实时行情 |
| `/api/sina-kline` | 新浪财经 K 线数据 |
| `/api/yahoo/` | Yahoo Finance 全球数据 |

## 技术栈

- Vue 3 + Vite
- lightweight-charts（K 线/分时图）
- Nginx（静态文件 + API 代理）
