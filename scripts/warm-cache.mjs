import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { SOURCES } from "../src/lib/sources.ts";
import { scrapeHotList } from "../src/lib/scrapers.ts";

const OUT = path.join(process.cwd(), "public/hot-cache");

await mkdir(OUT, { recursive: true });

let ok = 0;
let fail = 0;

for (const s of SOURCES) {
  try {
    const items = await scrapeHotList(s.id);
    const payload = {
      name: s.name,
      subtitle: s.subtitle,
      updateTime: new Date().toISOString(),
      fromCache: false,
      stale: true,
      data: items,
    };
    await writeFile(
      path.join(OUT, `${s.id}.json`),
      JSON.stringify(payload),
      "utf8"
    );
    ok++;
    console.log(`ok  ${s.id}`);
  } catch (e) {
    fail++;
    console.log(`skip ${s.id}: ${e.message}`);
  }
}

console.log(`\nbuild cache: ${ok} ok, ${fail} skipped`);
if (ok === 0) process.exit(1);
