import { NextResponse } from "next/server";
import { fetchHotList } from "@/lib/fetchHot";
import { getSource } from "@/lib/sources";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;
  if (!getSource(source)) {
    return NextResponse.json({ error: "未知数据源" }, { status: 404 });
  }

  try {
    const data = await fetchHotList(source);
    return NextResponse.json(data, {
      headers: {
        // ponytail: Netlify CDN 缓存，避免 serverless 实例间内存缓存失效
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
