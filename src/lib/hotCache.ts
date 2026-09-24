import { readFile } from "fs/promises";
import path from "path";
import type { HotListResponse } from "./types";

export const TTL_MS = 5 * 60 * 1000;
const STORE_NAME = "yx-hotspot";
const STATIC_DIR = path.join(process.cwd(), "public/hot-cache");

type Entry = { data: HotListResponse; expires: number };

const MEMORY = new Map<string, Entry>();

async function getBlobStore() {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore(STORE_NAME);
  } catch {
    return null;
  }
}

export async function readCacheEntry(sourceId: string): Promise<Entry | null> {
  const mem = MEMORY.get(sourceId);
  if (mem) return mem;

  const store = await getBlobStore();
  if (store) {
    try {
      const entry = (await store.get(sourceId, { type: "json" })) as Entry | null;
      if (entry?.data?.data) {
        MEMORY.set(sourceId, entry);
        return entry;
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const raw = await readFile(path.join(STATIC_DIR, `${sourceId}.json`), "utf8");
    const data = JSON.parse(raw) as HotListResponse;
    const entry: Entry = { data, expires: 0 };
    MEMORY.set(sourceId, entry);
    return entry;
  } catch {
    return null;
  }
}

export async function writeCacheEntry(
  sourceId: string,
  data: HotListResponse
): Promise<void> {
  const entry: Entry = { data, expires: Date.now() + TTL_MS };
  MEMORY.set(sourceId, entry);
  const store = await getBlobStore();
  if (!store) return;
  try {
    await store.setJSON(sourceId, entry);
  } catch {
    /* ponytail: memory + static build cache still cover cold start */
  }
}

export async function readFresh(
  sourceId: string
): Promise<HotListResponse | null> {
  const entry = await readCacheEntry(sourceId);
  if (entry && entry.expires > Date.now()) {
    return { ...entry.data, fromCache: true };
  }
  return null;
}

/** 任意层级过期数据，Netlify 冷启动 / 抓取失败时统一兜底 */
export async function readStale(
  sourceId: string
): Promise<HotListResponse | null> {
  const entry = await readCacheEntry(sourceId);
  if (!entry) return null;
  return {
    ...entry.data,
    fromCache: true,
    stale: entry.expires <= Date.now(),
  };
}
