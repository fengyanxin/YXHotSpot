import { SOURCES } from "../src/lib/sources.ts";
import { scrapeHotList } from "../src/lib/scrapers.ts";

const fail = [];
for (const s of SOURCES) {
  try {
    const n = (await scrapeHotList(s.id)).length;
    console.log(`ok  ${s.id.padEnd(16)} ${n}`);
  } catch (e) {
    fail.push(s.id);
    console.log(`FAIL ${s.id.padEnd(16)} ${e.message}`);
  }
}
if (fail.length) {
  console.error(`\n${fail.length} source(s) failed:`, fail.join(", "));
  process.exit(1);
}
