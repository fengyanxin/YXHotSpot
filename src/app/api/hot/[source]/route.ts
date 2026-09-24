import { NextResponse } from "next/server";
import { fetchHotList } from "@/lib/fetchHot";
import { getSource } from "@/lib/sources";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

async function handleSource(sourceId: string, force: boolean) {
  if (!getSource(sourceId)) {
    return NextResponse.json({ error: "未知数据源" }, { status: 404 });
  }

  try {
    const data = await fetchHotList(sourceId, { force });
    const body = force
      ? { ...data, updateTime: new Date().toISOString(), fromCache: false, stale: false }
      : data;
    return NextResponse.json(body, {
      headers: force ? NO_CACHE_HEADERS : CACHE_HEADERS,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取失败";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;
  const force = new URL(req.url).searchParams.get("force") === "1";
  return handleSource(source, force);
}

/** ponytail: POST 不会被 CDN 缓存，专用于手动刷新 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;
  return handleSource(source, true);
}
