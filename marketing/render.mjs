// Render post specs into 1080x1920 slideshow images for TikTok / Instagram.
//   node marketing/render.mjs marketing/posts/week1.json [post-id ...]
// Output: marketing/out/<post-id>/01.png ... (gitignored). Needs Playwright + Chromium
// (CHROMIUM=/path/to/chromium if Playwright's bundled browser isn't installed).
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const [specPath, ...only] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(resolve(specPath), "utf8"));
// Inline images: a page loaded with setContent can't read local files.
const assetCache = new Map();
const asset = (name) => {
  if (!assetCache.has(name)) assetCache.set(name, `data:image/webp;base64,${readFileSync(join(here, "assets", name)).toString("base64")}`);
  return assetCache.get(name);
};
const font = (file) => readFileSync(join(here, "fonts", file)).toString("base64");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// *word* renders as the coral italic accent used across the brand.
const rich = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, "<br>");

const CSS = `
@font-face { font-family: Fraunces; font-weight: 600; src: url(data:font/ttf;base64,${font("Fraunces-600.ttf")}); }
@font-face { font-family: Fraunces; font-weight: 400; font-style: italic; src: url(data:font/ttf;base64,${font("Fraunces-400i.ttf")}); }
@font-face { font-family: Instrument; font-weight: 500; src: url(data:font/ttf;base64,${font("Instrument-500.ttf")}); }
@font-face { font-family: Instrument; font-weight: 700; src: url(data:font/ttf;base64,${font("Instrument-700.ttf")}); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1080px; height: 1920px; overflow: hidden; }
body { background: #f3eee5; color: #1f2030; font-family: Instrument, sans-serif; position: relative; }
em { font-family: Fraunces; font-style: italic; font-weight: 400; color: #e36f58; }
.safe { position: absolute; left: 84px; right: 140px; top: 230px; bottom: 420px; display: flex; flex-direction: column; }
h1 { font-family: Fraunces; font-weight: 600; font-size: 128px; line-height: 1.02; letter-spacing: -2px; }
h2 { font-family: Fraunces; font-weight: 600; font-size: 104px; line-height: 1.06; letter-spacing: -1px; }
.sub { font-size: 54px; line-height: 1.28; color: #62606f; margin-top: 36px; font-weight: 500; }
.kicker { font-size: 36px; letter-spacing: 6px; text-transform: uppercase; color: #9c99a6; font-weight: 700; margin-bottom: 28px; }
.photo { position: absolute; inset: 0; background-size: cover; background-position: center; }
.shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,20,32,.72) 0%, rgba(20,20,32,.35) 34%, rgba(20,20,32,0) 52%); }
.shade.bottom { background: linear-gradient(0deg, rgba(20,20,32,.78) 0%, rgba(20,20,32,.35) 34%, rgba(20,20,32,0) 55%); }
.caption { position: absolute; left: 84px; right: 140px; color: #fcfaf6; }
.caption h2 { color: #fcfaf6; text-shadow: 0 4px 24px rgba(0,0,0,.35); }
.caption .sub { color: rgba(252,250,246,.9); }
.caption em { color: #f8d9d0; }
.sticker { position: absolute; width: 330px; filter: drop-shadow(0 18px 20px rgba(31,32,48,.22)); }
.card { background: #fcfaf6; border-radius: 48px; border: 2px solid rgba(31,32,48,.08); box-shadow: 0 40px 80px -40px rgba(31,32,48,.45); padding: 56px 56px 44px; }
.big { font-family: Fraunces; font-weight: 600; font-size: 200px; line-height: .9; letter-spacing: -6px; }
.big small { font-family: Instrument; font-size: 60px; letter-spacing: 0; margin-left: 12px; color: #62606f; }
.row { display: flex; justify-content: space-between; align-items: baseline; font-size: 46px; padding: 24px 0; border-top: 2px solid rgba(31,32,48,.08); }
.row b { font-weight: 700; }
.row span { color: #62606f; }
.pill { display: inline-block; background: #1f2030; color: #fcfaf6; border-radius: 999px; padding: 22px 40px; font-size: 42px; font-weight: 700; }
.mark { position: absolute; left: 84px; bottom: 300px; display: flex; align-items: center; gap: 16px; font-family: Fraunces; font-weight: 600; font-size: 40px; opacity: .85; }
.note { font-size: 30px; color: #9c99a6; margin-top: 24px; }
`;

const STAR = "M50 0A50 50 0 0 0 100 50A50 50 0 0 0 50 100A50 50 0 0 0 0 50A50 50 0 0 0 50 0Z";
const mark = (light = false) =>
  `<div class="mark" style="color:${light ? "#fcfaf6" : "#1f2030"}"><svg width="40" height="40" viewBox="0 0 100 100"><path d="${STAR}" fill="${light ? "#fcfaf6" : "#1f2030"}"/><circle cx="50" cy="50" r="9" fill="#e36f58"/></svg>Leave By</div>`;

function slideHtml(s) {
  switch (s.type) {
    case "photo": {
      const top = s.at !== "bottom";
      return `<div class="photo" style="background-image:url('${asset(s.image)}')"></div><div class="shade ${top ? "" : "bottom"}"></div>
        <div class="caption" style="${top ? "top:230px" : "bottom:440px"}">${s.kicker ? `<div class="kicker" style="color:rgba(252,250,246,.75)">${esc(s.kicker)}</div>` : ""}<h2>${rich(s.title)}</h2>${s.sub ? `<div class="sub">${rich(s.sub)}</div>` : ""}</div>`;
    }
    case "text":
      // With a mascot sticker, text sits at the top and the subtitle stays clear of the sticker.
      return `<div class="safe" style="justify-content:${s.align ?? (s.sticker ? "flex-start" : "center")};${s.sticker ? "padding-top:60px" : ""}">${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ""}<h1 style="font-size:${s.size ?? 128}px">${rich(s.title)}</h1>${s.sub ? `<div class="sub" style="${s.sticker ? "max-width:620px" : ""}">${rich(s.sub)}</div>` : ""}${s.note ? `<div class="note">${esc(s.note)}</div>` : ""}</div>
        ${s.sticker ? `<img class="sticker" src="${asset(s.sticker)}" style="right:60px;bottom:330px;width:300px">` : ""}${mark()}`;
    case "plan":
      return `<div class="safe" style="justify-content:center">${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ""}
        <div class="card"><div class="kicker" style="margin-bottom:10px">Leave by</div><div class="big">${esc(s.time)}<small>${esc(s.ampm)}</small></div>
        <div style="font-size:34px;color:#62606f;margin:18px 0 26px">${esc(s.trip)}</div>
        ${s.rows.map(([a, b]) => `<div class="row"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>
        ${s.note ? `<div class="note">${esc(s.note)}</div>` : ""}</div>${mark()}`;
    case "cta":
      return `<div class="safe" style="justify-content:center;align-items:flex-start"><h1 style="font-size:${s.size ?? 120}px">${rich(s.title)}</h1>
        <div class="sub">${rich(s.sub ?? "Pick your flight. Get the minute to leave.")}</div>
        <div style="margin-top:56px" class="pill">leaveby.xyz</div><div class="note" style="font-size:32px">Free · No account · Link in bio</div></div>
        <img class="sticker" src="${asset(s.sticker ?? "thumb.webp")}" style="right:70px;bottom:340px;width:340px">`;
    default:
      throw new Error(`unknown slide type ${s.type}`);
  }
}

// A concept tests several opening hooks on the same slides: each hook becomes its own post.
export function expand(spec) {
  return (spec.concepts ?? []).flatMap((c) =>
    c.hooks.map((h) => ({ id: `${c.id}-${h.id}`, concept: c.id, hook: h.id, caption: h.caption ?? c.caption, hashtags: c.hashtags, slides: [h.slide, ...c.slides] })),
  );
}
spec.posts = [...(spec.posts ?? []), ...expand(spec)];

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const post of spec.posts) {
  if (only.length && !only.includes(post.id)) continue;
  const dir = join(here, "out", post.id);
  mkdirSync(dir, { recursive: true });
  for (const [i, slide] of post.slides.entries()) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${slideHtml(slide)}</body></html>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(dir, `${String(i + 1).padStart(2, "0")}.png`) });
  }
  console.log(`${post.id}: ${post.slides.length} slides`);
}
await browser.close();
