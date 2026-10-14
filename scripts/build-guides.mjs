// Validate researched airport guides and combine them into lib/airports/guides.json.
//   node scripts/build-guides.mjs <dir-with-CODE.json-files>
// Rejects a guide that lacks sources, has malformed URLs, or is missing required fields,
// so a thin or unsourced page never ships.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
const out = {};
const problems = [];
const isUrl = (u) => typeof u === "string" && /^https?:\/\/[^\s]+$/.test(u);
const str = (v) => v === null || typeof v === "string";

for (const file of readdirSync(dir).filter((f) => /^[A-Z]{3}\.json$/.test(f)).sort()) {
  const code = file.slice(0, 3);
  let g;
  try {
    g = JSON.parse(readFileSync(join(dir, file), "utf8"));
  } catch (e) {
    problems.push(`${code}: invalid JSON (${e.message})`);
    continue;
  }
  const errs = [];
  if (g.code !== code) errs.push("code mismatch");
  for (const k of ["name", "city", "state", "checkedOn"]) if (typeof g[k] !== "string" || !g[k]) errs.push(`missing ${k}`);
  if (!Array.isArray(g.sources) || g.sources.length < 3) errs.push("fewer than 3 sources");
  else if (!g.sources.every((s) => isUrl(s.url))) errs.push("bad source URL");
  if (!Array.isArray(g.terminals) || !g.terminals.length) errs.push("no terminals");
  if (!Array.isArray(g.faq) || g.faq.length < 2) errs.push("fewer than 2 FAQs");
  if (!Array.isArray(g.tips) || g.tips.length < 2) errs.push("fewer than 2 tips");
  if (!g.officialArrivalAdvice || !str(g.officialArrivalAdvice.domestic) || !str(g.officialArrivalAdvice.international)) errs.push("bad officialArrivalAdvice");
  if (g.officialArrivalAdvice?.source && !isUrl(g.officialArrivalAdvice.source)) errs.push("bad advice source");
  if (errs.length) {
    problems.push(`${code}: ${errs.join(", ")}`);
    continue;
  }
  // Normalize optional shapes so pages never crash on a missing array or object.
  out[code] = {
    ...g,
    terminals: g.terminals.map((t) => ({ ...t, airlines: t.airlines ?? [], checkpoints: (t.checkpoints ?? []).map((c) => ({ notes: null, precheck: null, clear: null, ...c })), notes: t.notes ?? [] })),
    securityWaits: { summary: null, busiestTimes: [], source: null, ...(g.securityWaits ?? {}) },
    gettingThere: { rideshare: null, transit: null, driving: null, ...(g.gettingThere ?? {}) },
    construction2026: g.construction2026 ?? [],
    connectedAirside: g.connectedAirside ?? null,
    betweenTerminals: g.betweenTerminals ?? null,
    precheckNotes: g.precheckNotes ?? null,
    clearAvailable: g.clearAvailable ?? null,
    touchlessId: g.touchlessId ?? null,
    bagDrop: g.bagDrop ?? null,
  };
}

writeFileSync(new URL("../lib/airports/guides.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`kept ${Object.keys(out).length}: ${Object.keys(out).join(" ")}`);
if (problems.length) console.log(`rejected:\n  ${problems.join("\n  ")}`);
