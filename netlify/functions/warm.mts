import type { Config } from "@netlify/functions";

/** 每 4 分钟预热，写入 Netlify Blobs + 刷新 CDN */
export default async function warm() {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (!base) return new Response("missing URL", { status: 500 });

  const res = await fetch(`${base}/api/hot/all?warm=1`, {
    headers: { "x-warm-secret": process.env.WARM_SECRET ?? "" },
  });
  const text = await res.text();
  return new Response(text, { status: res.status });
}

export const config: Config = {
  schedule: "*/4 * * * *",
};
