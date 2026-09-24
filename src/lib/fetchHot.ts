import type { HotListResponse } from "./types";
import { SOURCES, getSource } from "./sources";
import { scrapeHotList } from "./scrapers";
import {
  readFresh,
  readStale,
  writeCacheEntry,
} from "./hotCache";

const FETCH_CONCURRENCY = 4;
/** Netlify 免费函数约 10s，批量刷新留 8s 预算 */
const ALL_DEADLINE_MS = 8_000;

async function mapPool<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

function buildResult(sourceId: string, items: Awaited<ReturnType<typeof scrapeHotList>>) {
  const source = getSource(sourceId)!;
  return {
    name: source.name,
    subtitle: source.subtitle,
    updateTime: new Date().toISOString(),
    fromCache: false,
    data: items,
  } satisfies HotListResponse;
}

/** 单源：三层缓存 + 失败永不抛（有 stale 就返回 200） */
export async function fetchHotList(
  sourceId: string,
  opts?: { force?: boolean }
): Promise<HotListResponse> {
  const source = getSource(sourceId);
  if (!source) throw new Error("未知数据源");

  if (!opts?.force) {
    const fresh = await readFresh(sourceId);
    if (fresh) return fresh;
  }

  try {
    const items = await scrapeHotList(sourceId);
    const result = buildResult(sourceId, items);
    await writeCacheEntry(sourceId, result);
    return result;
  } catch {
    const stale = await readStale(sourceId);
    if (stale) return stale;
    throw new Error("获取失败");
  }
}

/**
 * 全量：先秒回缓存，再在时间预算内刷新过期源（Netlify 统一入口）
 */
export async function fetchAllHotLists(opts?: {
  force?: boolean;
  deadlineMs?: number;
}): Promise<Record<string, HotListResponse>> {
  const results: Record<string, HotListResponse> = {};
  const toRefresh: string[] = [];
  const deadline = Date.now() + (opts?.deadlineMs ?? ALL_DEADLINE_MS);

  for (const { id } of SOURCES) {
    if (!opts?.force) {
      const fresh = await readFresh(id);
      if (fresh) {
        results[id] = fresh;
        continue;
      }
    }
    const stale = await readStale(id);
    if (stale) results[id] = stale;
    toRefresh.push(id);
  }

  await mapPool(toRefresh, FETCH_CONCURRENCY, async (id) => {
    if (Date.now() >= deadline) return;
    try {
      results[id] = await fetchHotList(id, { force: true });
    } catch {
      if (!results[id]) {
        const stale = await readStale(id);
        if (stale) results[id] = stale;
      }
    }
  });

  return results;
}

export function countMissing(results: Record<string, HotListResponse>) {
  return SOURCES.length - Object.keys(results).length;
}
