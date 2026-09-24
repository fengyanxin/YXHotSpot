import { NextResponse } from "next/server";
import { fetchHotList } from "@/lib/fetchHot";
import { getSource } from "@/lib/sources";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;
  if (!getSource(source)) {
    return NextResponse.json({ error: "未知数据源" }, { status: 404 });
  }

  const force = new URL(req.url).searchParams.get("force") === "1";

  try {
    const data = await fetchHotList(source, { force });
    return NextResponse.json(data, {
      headers: force
        ? {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          }
        : { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取失败";
    // ponytail: 仅首次部署、三层缓存皆空时才 500
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
