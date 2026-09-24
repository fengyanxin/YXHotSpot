import { NextResponse } from "next/server";
import { countMissing, fetchAllHotLists } from "@/lib/fetchHot";
import { SOURCES } from "@/lib/sources";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const warm = searchParams.get("warm") === "1";
  const force = searchParams.get("force") === "1";

  if (warm) {
    const secret = process.env.WARM_SECRET;
    if (secret && req.headers.get("x-warm-secret") !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const sources = await fetchAllHotLists({
    force: force || warm,
    deadlineMs: warm ? 55_000 : undefined,
  });

  const missing = countMissing(sources);
  const staleCount = Object.values(sources).filter((s) => s.stale).length;

  return NextResponse.json(
    {
      sources,
      total: SOURCES.length,
      loaded: Object.keys(sources).length,
      missing,
      staleCount,
    },
    { headers: CACHE_HEADERS }
  );
}
