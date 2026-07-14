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
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "获取失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
