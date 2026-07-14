import type { SourceCategory, SourceConfig } from "./types";

/** 直连各平台 API / RSS / 页面抓取 */
export const SOURCES: SourceConfig[] = [
  // 综合 ×3
  {
    id: "zhihu",
    name: "知乎热榜",
    subtitle: "知乎 · 热榜",
    category: "综合",
    color: "#0066FF",
    icon: "知",
  },
  {
    id: "baidu",
    name: "百度热点",
    subtitle: "百度 · 实时热点",
    category: "综合",
    color: "#2932E1",
    icon: "百",
  },
  {
    id: "toutiao",
    name: "今日头条",
    subtitle: "头条 · 热榜",
    category: "综合",
    color: "#FF0000",
    icon: "头",
  },
  // 新闻 ×3
  {
    id: "thepaper",
    name: "澎湃热榜",
    subtitle: "澎湃新闻 · 热榜",
    category: "新闻",
    color: "#000000",
    icon: "澎",
  },
  {
    id: "qq-news",
    name: "腾讯新闻",
    subtitle: "腾讯新闻 · 热点榜",
    category: "新闻",
    color: "#12B7F5",
    icon: "讯",
  },
  {
    id: "huxiu",
    name: "虎嗅热文",
    subtitle: "虎嗅 · 24小时",
    category: "新闻",
    color: "#FF6600",
    icon: "嗅",
  },
  // 社交 ×3
  {
    id: "weibo",
    name: "微博热搜",
    subtitle: "微博 · 热搜榜",
    category: "社交",
    color: "#FF8200",
    icon: "微",
  },
  {
    id: "tieba",
    name: "贴吧热议",
    subtitle: "百度贴吧 · 热议榜",
    category: "社交",
    color: "#4879BD",
    icon: "吧",
  },
  {
    id: "hupu",
    name: "虎扑热帖",
    subtitle: "虎扑 · 步行街热帖",
    category: "社交",
    color: "#C60100",
    icon: "虎",
  },
  // 科技 ×3
  {
    id: "36kr",
    name: "36氪热榜",
    subtitle: "36氪 · 24小时热榜",
    category: "科技",
    color: "#4285F4",
    icon: "36",
  },
  {
    id: "sspai",
    name: "少数派",
    subtitle: "少数派 · 热门文章",
    category: "科技",
    color: "#D71A1B",
    icon: "派",
  },
  {
    id: "ithome",
    name: "IT之家",
    subtitle: "IT之家 · 热榜",
    category: "科技",
    color: "#D32F2F",
    icon: "IT",
  },
  // 财经 ×3
  {
    id: "sina-finance",
    name: "新浪财经",
    subtitle: "新浪 · 财经滚动",
    category: "财经",
    color: "#E6162D",
    icon: "财",
  },
  {
    id: "eastmoney",
    name: "东方财富",
    subtitle: "东方财富 · 财经要闻",
    category: "财经",
    color: "#FF6600",
    icon: "东",
  },
  {
    id: "wallstreetcn",
    name: "华尔街见闻",
    subtitle: "华尔街见闻 · 热文",
    category: "财经",
    color: "#1478F0",
    icon: "街",
  },
  // 娱乐 ×3
  {
    id: "douyin",
    name: "抖音热榜",
    subtitle: "抖音 · 热点榜",
    category: "娱乐",
    color: "#FE2C55",
    icon: "抖",
  },
  {
    id: "bilibili",
    name: "B站热榜",
    subtitle: "哔哩哔哩 · 全站日榜",
    category: "娱乐",
    color: "#FB7299",
    icon: "B",
  },
  {
    id: "douban-movie",
    name: "豆瓣新片",
    subtitle: "豆瓣电影 · 新片榜",
    category: "娱乐",
    color: "#007722",
    icon: "豆",
  },
  // 开发 ×3
  {
    id: "juejin",
    name: "稀土掘金",
    subtitle: "掘金 · 热榜",
    category: "开发",
    color: "#1E80FF",
    icon: "掘",
  },
  {
    id: "github",
    name: "GitHub Trending",
    subtitle: "GitHub · 趋势仓库",
    category: "开发",
    color: "#24292F",
    icon: "G",
  },
  {
    id: "csdn",
    name: "CSDN 热榜",
    subtitle: "CSDN · 博客热榜",
    category: "开发",
    color: "#FC5531",
    icon: "C",
  },
  // 人工智能 ×3
  {
    id: "ifanr",
    name: "爱范儿",
    subtitle: "爱范儿 · 快讯",
    category: "人工智能",
    color: "#E74B3B",
    icon: "范",
  },
  {
    id: "hackernews",
    name: "Hacker News",
    subtitle: "Hacker News · 热门",
    category: "人工智能",
    color: "#FF6600",
    icon: "HN",
  },
  {
    id: "ithome-ai",
    name: "IT之家 AI",
    subtitle: "IT之家 · AI 资讯",
    category: "人工智能",
    color: "#D32F2F",
    icon: "AI",
  },
  // 阅读 ×3
  {
    id: "weread",
    name: "微信读书",
    subtitle: "微信读书 · 飙升榜",
    category: "阅读",
    color: "#24A148",
    icon: "读",
  },
  {
    id: "qimao",
    name: "七猫小说",
    subtitle: "七猫 · 大热榜",
    category: "阅读",
    color: "#FFD100",
    icon: "七",
  },
  {
    id: "dangdang",
    name: "当当畅销",
    subtitle: "当当 · 图书畅销榜",
    category: "阅读",
    color: "#FF2832",
    icon: "当",
  },
  // 体育 ×3
  {
    id: "dongqiudi",
    name: "懂球帝",
    subtitle: "懂球帝 · 头条",
    category: "体育",
    color: "#16A34A",
    icon: "球",
  },
  {
    id: "hupu-sports",
    name: "虎扑体育",
    subtitle: "虎扑 · 体育区热帖",
    category: "体育",
    color: "#C60100",
    icon: "体",
  },
  {
    id: "sina-sports",
    name: "新浪体育",
    subtitle: "新浪 · 体育滚动",
    category: "体育",
    color: "#E6162D",
    icon: "育",
  },
  // 产品 ×3
  {
    id: "appinn",
    name: "小众软件",
    subtitle: "小众软件 · 最新推荐",
    category: "产品",
    color: "#3B82F6",
    icon: "软",
  },
  {
    id: "leiphone",
    name: "雷峰网",
    subtitle: "雷峰网 · 行业新闻",
    category: "产品",
    color: "#EF4444",
    icon: "雷",
  },
  {
    id: "ghxi",
    name: "果核剥壳",
    subtitle: "果核剥壳 · 软件分享",
    category: "产品",
    color: "#F97316",
    icon: "核",
  },
  // 设计 ×3
  {
    id: "digitaling",
    name: "数英网",
    subtitle: "数英网 · 热门项目",
    category: "设计",
    color: "#6366F1",
    icon: "英",
  },
  {
    id: "sj33",
    name: "设计之家",
    subtitle: "设计之家 · 最新作品",
    category: "设计",
    color: "#8B5CF6",
    icon: "设",
  },
  {
    id: "zcool",
    name: "站酷",
    subtitle: "站酷 · 总榜作品",
    category: "设计",
    color: "#FFF200",
    icon: "酷",
  },
  // 汽车 ×3
  {
    id: "netease-auto",
    name: "网易汽车",
    subtitle: "网易 · 汽车资讯",
    category: "汽车",
    color: "#C20C0C",
    icon: "网",
  },
  {
    id: "sina-auto",
    name: "新浪汽车",
    subtitle: "新浪 · 汽车滚动",
    category: "汽车",
    color: "#E6162D",
    icon: "车",
  },
  {
    id: "autohome",
    name: "汽车之家",
    subtitle: "汽车之家 · 最新资讯",
    category: "汽车",
    color: "#005BAC",
    icon: "家",
  },
];

export const FEATURED_IDS = ["weibo", "douyin", "36kr"] as const;

/** 不含「全部」，按展示顺序排列 */
export const CATEGORY_ORDER: SourceCategory[] = [
  "综合",
  "新闻",
  "社交",
  "科技",
  "财经",
  "娱乐",
  "开发",
  "人工智能",
  "阅读",
  "体育",
  "产品",
  "设计",
  "汽车",
];

export const CATEGORIES = ["全部", ...CATEGORY_ORDER] as const;

export function getSource(id: string) {
  return SOURCES.find((s) => s.id === id);
}

export function getFeaturedSources() {
  return FEATURED_IDS.map((id) => getSource(id)).filter(
    (s): s is SourceConfig => s != null
  );
}

export function getSourcesByCategory(category: SourceCategory) {
  return SOURCES.filter((s) => s.category === category);
}

export function groupSourcesByCategory(
  sources: SourceConfig[]
): { category: SourceCategory; sources: SourceConfig[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    sources: sources.filter((s) => s.category === category),
  })).filter((g) => g.sources.length > 0);
}
