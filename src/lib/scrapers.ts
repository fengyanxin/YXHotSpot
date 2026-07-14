import crypto from "crypto";
import type { HotItem } from "./types";

export const MIN_LIST_SIZE = 20;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const JSON_HEADERS = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
};

const WEB_HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...JSON_HEADERS, ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: { ...WEB_HEADERS, ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function parseRssItems(xml: string): HotItem[] {
  const items: HotItem[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const titleRaw =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const linkRaw = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    if (!titleRaw || !linkRaw) continue;
    items.push({
      id: linkRaw,
      title: decodeXml(titleRaw.trim()),
      url: decodeXml(linkRaw),
    });
  }
  return items;
}

function scrapeIthome(html: string): HotItem[] {
  const titles = [...html.matchAll(/class="plc-title">([^<]+)/g)];
  const links = [...html.matchAll(/class="rank-box[\s\S]*?href="([^"]+)"/g)];
  return titles.map((m, i) => {
    const href = links[i]?.[1] ?? "";
    const url = href.startsWith("http")
      ? href
      : href
        ? `https://m.ithome.com${href}`
        : "#";
    return { id: url, title: m[1].trim(), url };
  });
}

function scrapeSspaiPosts(html: string): HotItem[] {
  const items: HotItem[] = [];
  const seen = new Set<string>();
  const patterns = [
    /href="(?:https:\/\/sspai\.com)?\/post\/(\d+)"[\s\S]*?<img alt="([^"]+)"/g,
    /href="\/post\/(\d+)"[\s\S]*?<div class="post-title"[^>]*>([^<]+)<\/div>/g,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      const id = m[1];
      if (seen.has(id)) continue;
      seen.add(id);
      items.push({
        id,
        title: m[2].trim(),
        url: `https://sspai.com/post/${id}`,
      });
    }
  }
  return items;
}

function mergeUniqueItems(lists: HotItem[][]): HotItem[] {
  const map = new Map<string, HotItem>();
  for (const list of lists) {
    for (const item of list) {
      const key = item.url || item.id;
      if (!map.has(key)) map.set(key, item);
    }
  }
  return [...map.values()];
}

function scrapeGithubTrending(html: string): HotItem[] {
  const blocks = html.match(/<article class="Box-row[\s\S]*?<\/article>/g) ?? [];
  const items: HotItem[] = [];
  for (const block of blocks) {
    const repo = block.match(
      /href="\/(?!sponsors|apps)([\w.-]+\/[\w.-]+)"/
    )?.[1];
    if (!repo) continue;
    const desc = block.match(
      /<p class="[^"]*col-9[^"]*"[^>]*>\s*([^<]+)/
    )?.[1]?.trim();
    items.push({
      id: repo,
      title: desc ? `${repo} — ${desc}` : repo,
      url: `https://github.com/${repo}`,
    });
  }
  return items;
}

async function fetchGithubApiTrending(): Promise<HotItem[]> {
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const json = await fetchJson<{
    items?: Array<{
      id: number;
      full_name: string;
      html_url: string;
      description?: string | null;
      stargazers_count?: number;
      language?: string | null;
    }>;
  }>(
    `https://api.github.com/search/repositories?q=created:>${since}+stars:>10&sort=stars&order=desc&per_page=30`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "YXHotSpot/1.0",
      },
    }
  );
  return (json.items ?? []).map((item) => ({
    id: String(item.id),
    title: item.description
      ? `${item.full_name} — ${item.description}`
      : item.full_name,
    url: item.html_url,
    hot: item.stargazers_count,
    desc: item.language ?? undefined,
  }));
}

async function fetchHelloGithubFeatured(): Promise<HotItem[]> {
  const merged = new Map<string, HotItem>();
  for (let page = 1; page <= 2; page++) {
    const json = await fetchJson<{
      data?: Array<{
        item_id: string;
        full_name: string;
        title: string;
        summary?: string;
        clicks_total?: number;
      }>;
    }>(
      `https://abroad.hellogithub.com/v1/?sort_by=featured&tid=&page=${page}`
    );
    for (const item of json.data ?? []) {
      merged.set(item.full_name, {
        id: item.item_id,
        title: item.title,
        url: `https://github.com/${item.full_name}`,
        hot: item.clicks_total,
        desc: item.summary,
      });
    }
  }
  return [...merged.values()];
}

async function fetchGbkText(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: { ...WEB_HEADERS, ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return new TextDecoder("gbk").decode(buf);
}

async function fetchSinaRoll(lid: string): Promise<HotItem[]> {
  const json = await fetchJson<{
    result?: { data?: Array<{ title: string; url: string; media_name?: string }> };
  }>(`https://feed.sina.com.cn/api/roll/get?pageid=153&lid=${lid}&k=&num=30&page=1`);
  return (json.result?.data ?? []).map((item, i) => ({
    id: `sina-${lid}-${i}`,
    title: item.title,
    url: item.url,
    desc: item.media_name,
  }));
}

function wereadBookUrl(bookId: string): string {
  const hash = crypto.createHash("md5").update(bookId).digest("hex");
  let strSub = hash.substring(0, 3);
  let fa: [string, string[]];
  if (/^\d*$/.test(bookId)) {
    const chunks: string[] = [];
    for (let i = 0; i < bookId.length; i += 9) {
      chunks.push(parseInt(bookId.substring(i, i + 9), 10).toString(16));
    }
    fa = ["3", chunks];
  } else {
    let hexStr = "";
    for (let i = 0; i < bookId.length; i++) {
      hexStr += bookId.charCodeAt(i).toString(16);
    }
    fa = ["4", [hexStr]];
  }
  strSub += fa[0] + "2" + hash.substring(hash.length - 2);
  for (let i = 0; i < fa[1].length; i++) {
    const sub = fa[1][i];
    const subLength = sub.length.toString(16);
    const subLengthPadded =
      subLength.length === 1 ? "0" + subLength : subLength;
    strSub += subLengthPadded + sub;
    if (i < fa[1].length - 1) strSub += "g";
  }
  if (strSub.length < 20) strSub += hash.substring(0, 20 - strSub.length);
  strSub += crypto.createHash("md5").update(strSub).digest("hex").substring(0, 3);
  return `https://weread.qq.com/web/bookDetail/${strSub}`;
}

async function fetchHupuTopicThreads(
  topicId: number,
  pages = 2
): Promise<HotItem[]> {
  const all: HotItem[] = [];
  for (let page = 1; page <= pages; page++) {
    const json = await fetchJson<{
      data?: {
        topicThreads?: Array<{
          tid: number;
          title: string;
          replies: number;
          url: string;
        }>;
      };
    }>(`https://m.hupu.com/api/v2/bbs/topicThreads?topicId=${topicId}&page=${page}`);
    for (const item of json.data?.topicThreads ?? []) {
      all.push({
        id: String(item.tid),
        title: item.title,
        url: `https://bbs.hupu.com/${item.tid}.html`,
        mobileUrl: item.url,
        hot: item.replies,
      });
    }
  }
  return all;
}

async function fetchHackerNewsTop(limit = 30): Promise<HotItem[]> {
  const ids = (
    await fetchJson<number[]>(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    )
  ).slice(0, limit);
  const stories = await Promise.all(
    ids.map((id) =>
      fetchJson<{
        id: number;
        title?: string;
        url?: string;
        score?: number;
      }>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
    )
  );
  return stories
    .filter((s) => s?.title)
    .map((s) => ({
      id: String(s.id),
      title: s.title!,
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      hot: s.score,
    }));
}

function isReadableTitle(title: string): boolean {
  const t = title.trim();
  if (t.length < 4 || t.startsWith("/news/")) return false;
  if (/[\uFFFD]/.test(t)) return false;
  const chinese = t.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  if (chinese >= 2) return true;
  return /[A-Za-z0-9].*[A-Za-z0-9]/.test(t);
}

async function fetchSinaHotlist(type: string): Promise<HotItem[]> {
  const urls = [
    `https://newsapp.sina.cn/api/hotlist?newsId=HB-1-snhs%2Ftop_news_list-${type}`,
    `https://newsapp.sina.cn/api/hotlist?newsId=HB-1-snhs/top_news_list-${type}`,
  ];
  for (const url of urls) {
    try {
      const json = await fetchJson<{
        status?: number;
        data?: {
          hotList?: Array<{
            base?: { base?: { uniqueId?: string; url?: string } };
            info?: { title?: string; hotValue?: string };
          }>;
        };
      }>(url, {
        headers: {
          Referer: "https://newsapp.sina.cn/",
          Accept: "application/json, text/plain, */*",
        },
      });
      if (json.status !== undefined && json.status !== 0) continue;
      const items = (json.data?.hotList ?? [])
        .map((item, i) => ({
          id: item.base?.base?.uniqueId ?? `sina-${type}-${i}`,
          title: item.info?.title ?? "",
          url: item.base?.base?.url ?? "",
          hot: item.info?.hotValue,
        }))
        .filter((item) => item.title && item.url && isReadableTitle(item.title));
      if (items.length >= MIN_LIST_SIZE) return items;
    } catch {
      /* try next url */
    }
  }
  throw new Error("新浪汽车热榜获取失败");
}

async function fetchSinaAuto(): Promise<HotItem[]> {
  try {
    return await fetchSinaHotlist("auto");
  } catch {
    /* ponytail: auto 榜偶发为空时，从综合榜筛汽车相关条目兜底 */
  }
  const json = await fetchJson<{
    status?: number;
    data?: {
      hotList?: Array<{
        base?: { base?: { uniqueId?: string; url?: string } };
        info?: { title?: string; hotValue?: string };
      }>;
    };
  }>("https://newsapp.sina.cn/api/hotlist?newsId=HB-1-snhs%2Ftop_news_list-all", {
    headers: { Referer: "https://newsapp.sina.cn/" },
  });
  const autoRe =
    /车|汽|新能源|SUV|奔驰|宝马|奥迪|丰田|本田|大众|比亚迪|特斯拉|智驾|充电|出行|车展|自驾|燃油|纯电|插混|MPV|轿车/;
  return (json.data?.hotList ?? [])
    .map((item, i) => ({
      id: item.base?.base?.uniqueId ?? `sina-auto-${i}`,
      title: item.info?.title ?? "",
      url: item.base?.base?.url ?? "",
      hot: item.info?.hotValue,
    }))
    .filter(
      (item) =>
        item.title &&
        item.url &&
        isReadableTitle(item.title) &&
        autoRe.test(item.title)
    );
}

async function fetchAutohomeArticles(): Promise<HotItem[]> {
  const merged = new Map<string, HotItem>();

  try {
    const newsHtml = await fetchGbkText("https://www.autohome.com.cn/news/");
    for (const item of scrapeAutohomeNewsHtml(newsHtml)) {
      merged.set(item.id, item);
    }
  } catch {
    /* fallback below */
  }

  try {
    const homeHtml = await fetchText("https://www.autohome.com.cn/");
    for (const item of scrapeAutohomeFromNextData(homeHtml)) {
      if (!merged.has(item.id) || !isReadableTitle(merged.get(item.id)!.title)) {
        merged.set(item.id, item);
      }
    }
  } catch {
    /* keep gbk results */
  }

  return [...merged.values()].filter((item) => isReadableTitle(item.title));
}

function scrapeAutohomeFromNextData(html: string): HotItem[] {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];
  const items: HotItem[] = [];
  const seen = new Set<string>();

  function walk(obj: unknown) {
    if (!obj || typeof obj !== "object") return;
    const record = obj as Record<string, unknown>;
    const rawUrl = String(record.url ?? record.pcUrl ?? record.link ?? "");
    const title = typeof record.title === "string" ? record.title : "";
    if (title && rawUrl.includes("/news/") && isReadableTitle(title)) {
      const path = rawUrl.match(/(\/news\/\d+\/\d+\.html)/)?.[1];
      if (path && !seen.has(path)) {
        seen.add(path);
        items.push({
          id: path,
          title,
          url: `https://www.autohome.com.cn${path}`,
        });
      }
    }
    if (Array.isArray(obj)) obj.forEach(walk);
    else Object.values(obj).forEach(walk);
  }

  walk(JSON.parse(match[1]) as unknown);
  return items;
}

function scrapeAutohomeNewsHtml(html: string): HotItem[] {
  const items: HotItem[] = [];
  const seen = new Set<string>();

  for (const m of html.matchAll(
    /data-artidanchor="\d+"[\s\S]*?href="(?:https?:)?\/\/www\.autohome\.com\.cn(\/news\/\d+\/\d+\.html)[^"]*"[\s\S]*?<h3>([^<]+)<\/h3>/g
  )) {
    const path = m[1];
    const title = m[2].trim();
    if (seen.has(path) || !isReadableTitle(title)) continue;
    seen.add(path);
    items.push({
      id: path,
      title,
      url: `https://www.autohome.com.cn${path}`,
    });
  }

  for (const m of html.matchAll(
    /href="(?:https?:)?\/\/www\.autohome\.com\.cn(\/news\/\d+\/\d+\.html)[^"]*"[^>]*>([^<]{4,})</g
  )) {
    const path = m[1];
    const title = m[2].trim();
    if (seen.has(path) || !isReadableTitle(title)) continue;
    seen.add(path);
    items.push({
      id: path,
      title,
      url: `https://www.autohome.com.cn${path}`,
    });
  }
  return items;
}

async function fetchDongqiudiArticles(): Promise<HotItem[]> {
  const headers = { Referer: "https://www.dongqiudi.com/" };
  const first = await fetchJson<{
    articles?: Array<{ id: number; title: string; url?: string; share_url?: string }>;
    next?: string;
  }>("https://www.dongqiudi.com/api/app/tabs/web/1.json", { headers });
  const merged = new Map<
    number,
    { id: number; title: string; url?: string; share_url?: string }
  >();
  for (const item of first.articles ?? []) merged.set(item.id, item);
  if (merged.size < MIN_LIST_SIZE && first.next) {
    const nextUrl = first.next.startsWith("http")
      ? first.next
      : `https://api.dongqiudi.com${first.next}`;
    const second = await fetchJson<typeof first>(nextUrl, { headers });
    for (const item of second.articles ?? []) merged.set(item.id, item);
  }
  return [...merged.values()].map((item) => ({
    id: String(item.id),
    title: item.title,
    url: item.url || item.share_url || `https://www.dongqiudi.com/article/${item.id}`,
  }));
}

function scrapeNeteaseAuto(html: string): HotItem[] {
  const map = new Map<string, HotItem>();
  const add = (id: string, title: string, url: string) => {
    const t = title.trim();
    if (!id || !t || t.length < 4 || map.has(id)) return;
    map.set(id, { id, title: t, url });
  };

  for (const m of html.matchAll(
    /data-title="([^"]+)"[^>]*data-url="(https:\/\/www\.163\.com\/auto\/article\/([^"]+)\.html)"/g
  )) {
    add(m[3], m[1], m[2]);
  }
  for (const m of html.matchAll(
    /href="(https:\/\/www\.163\.com\/auto\/article\/([^"]+)\.html)"[^>]*(?:title="([^"]+)"|>([^<]{4,})<)/g
  )) {
    add(m[2], m[3] || m[4] || "", m[1]);
  }
  for (const m of html.matchAll(
    /"docid":"([A-Z0-9]+)"[\s\S]{0,300}?"title":"([^"]+)"/g
  )) {
    add(m[1], m[2], `https://www.163.com/auto/article/${m[1]}.html`);
  }
  for (const id of new Set([...html.matchAll(/auto\/article\/([A-Z0-9]+)\.html/g)].map((m) => m[1]))) {
    if (map.has(id)) continue;
    const re = new RegExp(
      `"docid":"${id}"[^}]*"title":"([^"]+)"|"title":"([^"]+)"[^}]*"docid":"${id}"`
    );
    const hit = html.match(re);
    const title = hit?.[1] || hit?.[2];
    if (title) add(id, title, `https://www.163.com/auto/article/${id}.html`);
  }
  return [...map.values()];
}

async function fetchZcoolTopWorks(): Promise<HotItem[]> {
  const seedHtml = await fetchText(
    "https://www.zcool.com.cn/search/content?&sort=9&type=0&word="
  );
  const buildId = seedHtml.match(/"buildId":"([^"]+)"/)?.[1];
  if (!buildId) throw new Error("未获取到站酷 buildId");
  const json = await fetchJson<{
    pageProps?: {
      listResult?: {
        data?: Array<{
          objectId: number;
          rankingTitle?: string;
          pageUrl?: string;
          view?: number;
        }>;
      };
    };
  }>(`https://www.zcool.com.cn/_next/data/${buildId}/top/index.do.json`, {
    headers: { "x-nextjs-data": "1" },
  });
  return (json.pageProps?.listResult?.data ?? []).map((item) => ({
    id: String(item.objectId),
    title: item.rankingTitle ?? "无标题",
    url: item.pageUrl ?? `https://www.zcool.com.cn/work/${item.objectId}.html`,
    hot: item.view,
  }));
}

async function fetchHupuThreads(pages = 2): Promise<HotItem[]> {
  const all: HotItem[] = [];
  for (let page = 1; page <= pages; page++) {
    const json = await fetchJson<{
      data?: {
        topicThreads?: Array<{
          tid: number;
          title: string;
          replies: number;
          url: string;
        }>;
      };
    }>(`https://m.hupu.com/api/v2/bbs/topicThreads?topicId=1&page=${page}`);
    for (const item of json.data?.topicThreads ?? []) {
      all.push({
        id: String(item.tid),
        title: item.title,
        url: `https://bbs.hupu.com/${item.tid}.html`,
        mobileUrl: item.url,
        hot: item.replies,
      });
    }
  }
  return all;
}

type Scraper = () => Promise<HotItem[]>;

export const SCRAPERS: Record<string, Scraper> = {
  async weibo() {
    const json = await fetchJson<{
      data?: { realtime?: Array<{ word: string; num: number; url?: string }> };
    }>("https://weibo.com/ajax/side/hotSearch", {
      headers: { Referer: "https://weibo.com" },
    });
    return (json.data?.realtime ?? []).map((item, i) => ({
      id: `weibo-${i}`,
      title: item.word,
      url: item.url ?? `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
      hot: item.num,
    }));
  },

  async zhihu() {
    const json = await fetchJson<{
      data?: Array<{
        target?: {
          title_area?: { text: string };
          link?: { url: string };
          metrics_area?: { text: string };
        };
      }>;
    }>(
      "https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=50&offset=0",
      {
        headers: {
          Referer: "https://www.zhihu.com/hot",
          "x-api-version": "3.0.91",
        },
      }
    );
    return (json.data ?? []).map((item, i) => ({
      id: `zhihu-${i}`,
      title: item.target?.title_area?.text ?? "无标题",
      url: item.target?.link?.url ?? `https://www.zhihu.com/hot#${i}`,
      hot: item.target?.metrics_area?.text,
    }));
  },

  async baidu() {
    const json = await fetchJson<{
      data?: {
        cards?: Array<{
          content?: Array<{
            content?: Array<{
              word: string;
              url: string;
              index?: number;
              hotScore?: number;
            }>;
          }>;
        }>;
      };
    }>("https://top.baidu.com/api/board?platform=wise&tab=realtime");
    const list = json.data?.cards?.[0]?.content?.[0]?.content ?? [];
    return list.map((item) => ({
      id: `baidu-${item.index ?? item.word}`,
      title: item.word,
      url: item.url,
      hot: item.hotScore,
    }));
  },

  async douyin() {
    const json = await fetchJson<{
      data?: { word_list?: Array<{ word: string; hot_value: number }> };
    }>(
      "https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1",
      { headers: { Referer: "https://www.douyin.com/hot" } }
    );
    return (json.data?.word_list ?? []).map((item, i) => ({
      id: `douyin-${i}`,
      title: item.word,
      url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
      hot: item.hot_value,
    }));
  },

  async bilibili() {
    const json = await fetchJson<{
      data?: { list?: Array<{ aid: number; title: string; bvid: string; stat?: { view: number } }> };
    }>(
      "https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all",
      { headers: { Referer: "https://www.bilibili.com" } }
    );
    return (json.data?.list ?? []).map((item) => ({
      id: String(item.aid),
      title: item.title,
      url: `https://www.bilibili.com/video/${item.bvid}`,
      hot: item.stat?.view,
    }));
  },

  async "36kr"() {
    const json = await fetchJson<{
      data?: {
        hotRankList?: Array<{
          templateMaterial?: {
            widgetTitle?: string;
            statRead?: number;
            statPraise?: number;
          };
          route?: string;
        }>;
      };
    }>("https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://36kr.com",
      },
      body: JSON.stringify({
        partner_id: "wap",
        param: { siteId: 1, platformId: 2 },
      }),
    });
    return (json.data?.hotRankList ?? []).map((item, i) => {
      const m = item.templateMaterial;
      const itemId = item.route?.match(/itemId=(\d+)/)?.[1];
      return {
        id: itemId ?? `36kr-${i}`,
        title: m?.widgetTitle ?? "无标题",
        url: itemId
          ? `https://36kr.com/p/${itemId}`
          : "https://36kr.com/hot-list/catalog",
        hot: m?.statRead ?? m?.statPraise,
      };
    });
  },

  async "qq-news"() {
    const json = await fetchJson<{
      idlist?: Array<{
        newslist?: Array<{ id: string; title: string; url: string }>;
      }>;
    }>(
      "https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=30",
      { headers: { Referer: "https://news.qq.com" } }
    );
    const list = json.idlist?.[0]?.newslist ?? [];
    return list
      .filter(
        (item) =>
          item.title &&
          item.url &&
          !item.title.includes("每10分钟") &&
          !item.title.includes("用户最关注")
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
      }));
  },

  async thepaper() {
    const json = await fetchJson<{
      data?: {
        hotNews?: Array<{ contId: string; name: string; praiseTimes?: string }>;
      };
    }>("https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar");
    return (json.data?.hotNews ?? []).map((item) => ({
      id: item.contId,
      title: item.name,
      url: `https://www.thepaper.cn/newsDetail_forward_${item.contId}`,
      hot: item.praiseTimes ? Number(item.praiseTimes) : undefined,
    }));
  },

  async toutiao() {
    const json = await fetchJson<{
      data?: Array<{ Title: string; Url: string; HotValue?: number }>;
    }>("https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc");
    return (json.data ?? []).map((item, i) => ({
      id: `toutiao-${i}`,
      title: item.Title,
      url: item.Url,
      hot: item.HotValue,
    }));
  },

  async sspai() {
    const [feedXml, homeHtml, matrixHtml] = await Promise.all([
      fetchText("https://sspai.com/feed"),
      fetchText("https://sspai.com/"),
      fetchText("https://sspai.com/matrix"),
    ]);
    return mergeUniqueItems([
      parseRssItems(feedXml),
      scrapeSspaiPosts(homeHtml),
      scrapeSspaiPosts(matrixHtml),
    ]);
  },

  async hupu() {
    return fetchHupuThreads(2);
  },

  async tieba() {
    const json = await fetchJson<{
      data?: {
        bang_topic?: {
          topic_list?: Array<{
            topic_id: number;
            topic_name: string;
            topic_url: string;
            discuss_num?: number;
          }>;
        };
      };
    }>("https://tieba.baidu.com/hottopic/browse/topicList");
    return (json.data?.bang_topic?.topic_list ?? []).map((item) => ({
      id: String(item.topic_id),
      title: item.topic_name,
      url: item.topic_url,
      hot: item.discuss_num,
    }));
  },

  async juejin() {
    const json = await fetchJson<{
      data?: Array<{
        content?: { content_id?: string; title?: string };
        content_counter?: { hot_rank?: number; view?: number };
      }>;
    }>(
      "https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&spider=0"
    );
    return (json.data ?? []).map((item, i) => ({
      id: item.content?.content_id ?? `juejin-${i}`,
      title: item.content?.title ?? "无标题",
      url: item.content?.content_id
        ? `https://juejin.cn/post/${item.content.content_id}`
        : "https://juejin.cn/hot",
      hot: item.content_counter?.view ?? item.content_counter?.hot_rank,
    }));
  },

  async ithome() {
    const html = await fetchText("https://m.ithome.com/rankm/");
    return scrapeIthome(html);
  },

  async huxiu() {
    const json = await fetchJson<{
      data?: {
        dataList?: Array<{ aid: string; title: string }>;
      };
    }>(
      "https://api-article.huxiu.com/web/article/articleList?page=1&pagesize=30&platform=www",
      { headers: { Referer: "https://www.huxiu.com" } }
    );
    return (json.data?.dataList ?? []).map((item) => ({
      id: item.aid,
      title: item.title,
      url: `https://www.huxiu.com/article/${item.aid}.html`,
    }));
  },

  async "douban-movie"() {
    const json = await fetchJson<{
      subjects?: Array<{ id: string; title: string; url: string; rate: string }>;
    }>(
      "https://movie.douban.com/j/search_subjects?type=movie&tag=%E6%9C%80%E6%96%B0&page_limit=30&page_start=0"
    );
    return (json.subjects ?? []).map((item) => ({
      id: item.id,
      title: `${item.title} ${item.rate ? `(${item.rate}分)` : ""}`.trim(),
      url: item.url,
    }));
  },

  async github() {
    // ponytail: github.com 页面在国内常超时，优先走 api.github.com
    try {
      const items = await fetchGithubApiTrending();
      if (items.length >= MIN_LIST_SIZE) return items;
    } catch {
      /* try fallbacks */
    }

    try {
      const merged = new Map<string, HotItem>();
      for (const since of ["daily", "weekly"] as const) {
        const html = await fetchText(
          `https://github.com/trending?since=${since}`,
          { headers: { Accept: "text/html" } }
        );
        for (const item of scrapeGithubTrending(html)) {
          merged.set(item.id, item);
        }
        if (merged.size >= MIN_LIST_SIZE) break;
      }
      if (merged.size >= MIN_LIST_SIZE) return [...merged.values()];
    } catch {
      /* try hellogithub */
    }

    return fetchHelloGithubFeatured();
  },

  async csdn() {
    const json = await fetchJson<{
      data?: Array<{
        productId: string;
        articleTitle: string;
        articleDetailUrl: string;
        viewCount?: string;
      }>;
    }>(
      "https://blog.csdn.net/phoenix/web/blog/hot-rank?page=0&size=25",
      { headers: { Referer: "https://blog.csdn.net" } }
    );
    return (json.data ?? []).map((item) => ({
      id: item.productId,
      title: item.articleTitle,
      url: item.articleDetailUrl,
      hot: item.viewCount,
    }));
  },

  async "sina-finance"() {
    const json = await fetchJson<{
      result?: { data?: Array<{ title: string; url: string; media_name?: string }> };
    }>(
      "https://feed.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=&num=30&page=1"
    );
    return (json.result?.data ?? []).map((item, i) => ({
      id: `sina-finance-${i}`,
      title: item.title,
      url: item.url,
      desc: item.media_name,
    }));
  },

  async eastmoney() {
    const json = await fetchJson<{
      data?: {
        list?: Array<{ title: string; code: string; showTime?: string }>;
      };
    }>(
      "https://np-listapi.eastmoney.com/comm/web/getNewsByColumns?client=web&biz=web_news_col&column=350&order=1&page_index=1&page_size=30&req_trace=1"
    );
    return (json.data?.list ?? []).map((item) => ({
      id: item.code,
      title: item.title,
      url: `https://finance.eastmoney.com/a/${item.code}.html`,
      desc: item.showTime,
    }));
  },

  async wallstreetcn() {
    const hotUrl =
      "https://api-prod.wallstreetcn.com/apiv1/content/articles/hot?period=all";
    const flowUrl =
      "https://api-prod.wallstreetcn.com/apiv1/content/information-flow?channel=global-channel&accept=article&limit=30";

    try {
      const json = await fetchJson<{
        data?: {
          day_items?: Array<{
            id: number;
            title: string;
            pageviews: number;
            uri: string;
          }>;
        };
      }>(hotUrl, { headers: { Referer: "https://wallstreetcn.com" } });
      const items = json.data?.day_items ?? [];
      if (items.length >= MIN_LIST_SIZE) {
        return items.map((item) => ({
          id: String(item.id),
          title: item.title,
          url: item.uri.startsWith("http")
            ? item.uri
            : `https://wallstreetcn.com${item.uri}`,
          hot: item.pageviews,
        }));
      }
    } catch {
      /* fallback below */
    }

    const flow = await fetchJson<{
      data?: {
        items?: Array<{
          resource?: {
            title?: string;
            content_text?: string;
            uri?: string;
            id?: number;
            comment_count?: number;
            article?: { title?: string; uri?: string; id?: number };
          };
        }>;
      };
    }>(flowUrl, { headers: { Referer: "https://wallstreetcn.com" } });
    const list = flow.data?.items ?? [];
    const items: HotItem[] = [];
    for (const [i, entry] of list.entries()) {
      const r = entry.resource;
      const article = r?.article;
      const title =
        r?.title ?? article?.title ?? r?.content_text?.replace(/<[^>]+>/g, "").slice(0, 80);
      if (!title) continue;
      const id = article?.id ?? r?.id ?? i;
      const uri = article?.uri ?? r?.uri;
      items.push({
        id: String(id),
        title,
        url: uri?.startsWith("http")
          ? uri
          : `https://wallstreetcn.com/articles/${id}`,
        hot: r?.comment_count,
      });
    }
    return items;
  },

  async ifanr() {
    const json = await fetchJson<{
      objects?: Array<{
        id: string;
        post_title: string;
        post_id: string;
        buzz_original_url?: string;
        like_count?: number;
        comment_count?: number;
      }>;
    }>("https://sso.ifanr.com/api/v5/wp/buzz/?limit=30&offset=0");
    return (json.objects ?? []).map((item) => ({
      id: item.id,
      title: item.post_title,
      url: item.buzz_original_url || `https://www.ifanr.com/${item.post_id}`,
      hot: item.like_count || item.comment_count,
    }));
  },

  async hackernews() {
    return fetchHackerNewsTop(30);
  },

  async "ithome-ai"() {
    const json = await fetchJson<{
      newslist?: Array<{
        newsid: number;
        title: string;
        url: string;
        hitcount?: number;
        commentcount?: number;
      }>;
    }>("https://api.ithome.com/json/newslist/news?n=30&tag=ai");
    return (json.newslist ?? []).map((item) => ({
      id: String(item.newsid),
      title: item.title,
      url: item.url,
      hot: item.hitcount ?? item.commentcount,
    }));
  },

  async weread() {
    const json = await fetchJson<{
      books?: Array<{
        readingCount?: number;
        bookInfo?: { bookId: string; title: string; author?: string };
      }>;
    }>("https://weread.qq.com/web/bookListInCategory/rising?rank=1");
    return (json.books ?? []).map((item) => ({
      id: item.bookInfo?.bookId ?? item.bookInfo?.title ?? "",
      title: item.bookInfo?.author
        ? `${item.bookInfo.title} — ${item.bookInfo.author}`
        : (item.bookInfo?.title ?? "无标题"),
      url: item.bookInfo?.bookId
        ? wereadBookUrl(item.bookInfo.bookId)
        : "https://weread.qq.com/",
      hot: item.readingCount,
    }));
  },

  async qimao() {
    const month = new Date().toISOString().slice(0, 7).replace("-", "");
    const json = await fetchJson<{
      data?: {
        table_data?: Array<{
          book_id: string;
          title: string;
          book_url: string;
          author?: string;
          number?: string;
          unit?: string;
        }>;
      };
    }>(
      `https://www.qimao.com/api/rank/book-list?is_girl=0&rank_type=1&date_type=1&date=${month}&page=1`,
      { headers: { Referer: "https://www.qimao.com/paihang/" } }
    );
    return (json.data?.table_data ?? []).map((item) => ({
      id: item.book_id,
      title: item.author ? `${item.title} — ${item.author}` : item.title,
      url: item.book_url,
      hot: item.number && item.unit ? `${item.number}${item.unit}` : undefined,
    }));
  },

  async dangdang() {
    const html = await fetchGbkText("http://bang.dangdang.com/books/bestsellers");
    const items: HotItem[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(
      /class="name"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)/g
    )) {
      const url = m[1];
      const title = m[2].trim();
      if (!title || seen.has(url)) continue;
      seen.add(url);
      items.push({
        id: url,
        title,
        url: url.startsWith("http") ? url : `http:${url}`,
      });
    }
    return items;
  },

  async dongqiudi() {
    return fetchDongqiudiArticles();
  },

  async "hupu-sports"() {
    return fetchHupuTopicThreads(59, 2);
  },

  async "sina-sports"() {
    return fetchSinaRoll("2518");
  },

  async appinn() {
    const html = await fetchText("https://www.appinn.com/");
    const skip = new Set(["category", "tag", "page", "feed", "about", "contact"]);
    const items: HotItem[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(
      /href="(https:\/\/www\.appinn\.com\/([^/"]+)\/)"[^>]*title="([^"]+)"/g
    )) {
      const slug = m[2];
      if (skip.has(slug) || seen.has(slug)) continue;
      seen.add(slug);
      items.push({
        id: slug,
        title: m[3].trim(),
        url: m[1],
      });
    }
    return items;
  },

  async leiphone() {
    const html = await fetchText("https://www.leiphone.com/category/industrynews");
    const items: HotItem[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(
      /href="(https:\/\/www\.leiphone\.com\/category\/industrynews\/[\w-]+\.html)"[^>]*title="([^"]+)"/g
    )) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      items.push({ id: m[1], title: m[2], url: m[1] });
    }
    return items;
  },

  async ghxi() {
    const html = await fetchText("https://www.ghxi.com/category/all");
    const items: HotItem[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(
      /href="(https:\/\/www\.ghxi\.com\/[^"]+\.html)"[^>]*title="([^"]+)"/g
    )) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      items.push({ id: m[1], title: m[2], url: m[1] });
    }
    return items;
  },

  async digitaling() {
    const html = await fetchText("https://www.digitaling.com/");
    const items: HotItem[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(
      /href="(https:\/\/www\.digitaling\.com\/projects\/(\d+)\.html)"[^>]*title="([^"]+)"/g
    )) {
      if (seen.has(m[2])) continue;
      seen.add(m[2]);
      items.push({ id: m[2], title: m[3], url: m[1] });
    }
    return items;
  },

  async sj33() {
    const html = await fetchText("https://www.sj33.cn/");
    const items: HotItem[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(
      /href="(https:\/\/www\.sj33\.cn\/[^"]+\.html)"[^>]*>([^<]{4,})</g
    )) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      items.push({ id: m[1], title: m[2].trim(), url: m[1] });
    }
    return items;
  },

  async zcool() {
    return fetchZcoolTopWorks();
  },

  async "netease-auto"() {
    const merged = new Map<string, HotItem>();
    for (const url of ["https://auto.163.com/", "https://www.163.com/auto/"]) {
      const html = await fetchText(url, { headers: { Referer: "https://auto.163.com/" } });
      for (const item of scrapeNeteaseAuto(html)) merged.set(item.id, item);
    }
    return [...merged.values()];
  },

  async "sina-auto"() {
    return fetchSinaAuto();
  },

  async autohome() {
    return fetchAutohomeArticles();
  },
};

export async function scrapeHotList(sourceId: string): Promise<HotItem[]> {
  const scraper = SCRAPERS[sourceId];
  if (!scraper) throw new Error(`未实现数据源: ${sourceId}`);
  const items = await scraper();
  if (items.length < MIN_LIST_SIZE) {
    throw new Error(`数据不足 ${MIN_LIST_SIZE} 条（当前 ${items.length} 条）`);
  }
  return items;
}
