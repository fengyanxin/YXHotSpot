import type { HotListResponse } from "./types";
import { getSource } from "./sources";
import { scrapeHotList } from "./scrapers";

const CACHE = new Map<string, { data: HotListResponse; expires: number }>();
const TTL_MS = 5 * 60 * 1000; // ponytail: 5min memory cache

export async function fetchHotList(sourceId: string): Promise<HotListResponse> {
  const source = getSource(sourceId);
  if (!source) throw new Error("未知数据源");

  const cached = CACHE.get(sourceId);
  if (cached && cached.expires > Date.now()) return cached.data;

  const items = await scrapeHotList(sourceId);
  const result: HotListResponse = {
    name: source.name,
    subtitle: source.subtitle,
    updateTime: new Date().toISOString(),
    data: items,
  };

  CACHE.set(sourceId, { data: result, expires: Date.now() + TTL_MS });
  return result;
}
