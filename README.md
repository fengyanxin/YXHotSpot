# YX HotSpot

全网热点聚合 Web 应用，聚合 39 个平台实时热榜，深色编辑风 UI。

## 功能

- 39 个数据源，覆盖综合、新闻、社交、科技、财经、视频、社区、游戏、音乐、开发、人工智能、阅读、体育、产品、设计、汽车等分类
- 热门精选 + 分类筛选
- 服务端 API 代理抓取，三层缓存（内存 + Netlify Blobs + 构建静态兜底）
- 各数据源独立并行加载，互不影响

## 数据源

服务端直连各平台公开 API / RSS / 页面抓取，不依赖第三方聚合服务。

## 本地开发

```bash
npm install
npm run dev
```

打开 [http://localhost:5180](http://localhost:5180)

## 技术栈

- Next.js 15 + React 19
- Tailwind CSS 4
- TypeScript

## 部署到 Netlify（GitHub）

本项目使用 Next.js App Router 与 API 路由，需 Netlify 的 OpenNext 运行时（连接 GitHub 后自动启用，无需额外插件）。

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 2. 在 Netlify 创建站点

1. 登录 [Netlify](https://app.netlify.com/)
2. **Add new site** → **Import an existing project** → 选择 **GitHub**
3. 授权后选中本仓库
4. 构建设置一般会自动识别；若需手动填写：

| 项 | 值 |
|---|---|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | `20` |

仓库根目录已包含 `netlify.toml` 与 `.nvmrc`，通常无需再改。

5. 点击 **Deploy site**，等待构建完成

构建阶段会自动执行 `scripts/warm-cache.mjs`，将各源热榜写入 `public/hot-cache/`，作为 Netlify 冷启动兜底。

#### 环境变量（推荐）

| 变量 | 说明 |
|---|---|
| `WARM_SECRET` | 定时预热密钥；Netlify 每 4 分钟调用 `/api/hot/all?warm=1` 刷新 Blobs 缓存 |

在 Netlify **Site configuration → Environment variables** 中添加 `WARM_SECRET`（随机字符串即可）。

### 3. 访问站点

部署成功后，Netlify 会分配 `https://<随机名>.netlify.app`。可在 **Domain management** 中绑定自定义域名。

### 4. 后续更新

向 `main` 分支推送代码后，Netlify 会自动重新构建并发布。

```bash
git add .
git commit -m "更新说明"
git push
```

## 项目结构

```
src/
  app/
    api/hot/all/    # 全量热榜（定时预热用）
    api/hot/[source]/  # 单源接口（首页卡片独立请求）
  components/
  lib/
    hotCache.ts     # 三层缓存
    fetchHot.ts     # 抓取 + 批量聚合
    scrapers.ts     # 各平台抓取
    sources.ts      # 数据源配置
public/hot-cache/   # 构建时生成的静态兜底（自动生成）
netlify/functions/warm.mts  # 定时预热
netlify.toml
```

## 说明

- 抓取失败时会依次降级：Netlify Blobs 缓存 → 构建时静态缓存；仅首次部署且无缓存时才可能空白
- 本地快速构建可跳过预热：`npm run build:fast`
- Netlify 免费版函数约 10s 超时；全量接口优先返回缓存，再在 8s 预算内刷新过期源
