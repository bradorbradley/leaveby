// Product Hunt gallery images (1270x760) from real app screenshots.
//   node marketing/launch/gallery.mjs <dir with plan.png picked.png guide.png intl.png>
// Screenshots come from scripts/e2e-picker.mjs (OUT=<dir>) and 390px-wide page captures.
// Output: marketing/out/gallery/01.png ... (gitignored).
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const shots = resolve(process.argv[2] ?? ".");
const out = join(here, "..", "out", "gallery");
mkdirSync(out, { recursive: true });
const font = (f) => readFileSync(join(here, "..", "fonts", f)).toString("base64");
const png = (f) => `data:image/png;base64,${readFileSync(join(shots, f)).toString("base64")}`;
const sticker = (f) => `data:image/webp;base64,${readFileSync(join(here, "..", "assets", f)).toString("base64")}`;
const rich = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*(.+?)\*/g, "<em>$1</em>");

// Each frame: a headline and a phone showing a real screen, cropped from `y` (in screenshot pixels).
const FRAMES = [
  { shot: "plan.png", y: 0, kicker: "Leave By", title: "Know the exact minute to *leave* for your flight", sub: "Free. No account. Live traffic, security, boarding.", sticker: "wow.webp" },
  { shot: "picked.png", y: 380, kicker: "Step 1", title: "Type your flight. *Pick your departure.*", sub: "Every leg of that flight number is listed, so it never guesses the wrong airport." },
  { shot: "plan.png", y: 640, kicker: "Step 2", title: "Every step, *counted*", sub: "The drive with live traffic, curb to security, the line at your terminal, the walk, boarding." },
  { shot: "guide.png", y: 0, kicker: "Free guides", title: "How early for *35* US airports", sub: "Terminals, checkpoints, PreCheck and CLEAR, bag cutoffs. Every fact sourced." },
  { shot: "intl.png", y: 0, kicker: "International", title: "Flying abroad? *Passport control* included.", sub: "Including the EU's new Entry/Exit System on the way home from Europe.", sticker: "thumb.webp" },
];

const css = `
@font-face { font-family: Fraunces; font-weight: 600; src: url(data:font/ttf;base64,${font("Fraunces-600.ttf")}); }
@font-face { font-family: Fraunces; font-weight: 400; font-style: italic; src: url(data:font/ttf;base64,${font("Fraunces-400i.ttf")}); }
@font-face { font-family: Instrument; font-weight: 500; src: url(data:font/ttf;base64,${font("Instrument-500.ttf")}); }
@font-face { font-family: Instrument; font-weight: 700; src: url(data:font/ttf;base64,${font("Instrument-700.ttf")}); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1270px; height: 760px; overflow: hidden; }
body { background: #f3eee5; color: #1f2030; font-family: Instrument, sans-serif; position: relative; }
.blob { position: absolute; border-radius: 50%; }
.text { position: absolute; left: 88px; top: 0; bottom: 0; width: 560px; display: flex; flex-direction: column; justify-content: center; }
.kicker { font-size: 20px; letter-spacing: 5px; text-transform: uppercase; color: #9c99a6; font-weight: 700; margin-bottom: 22px; }
h1 { font-family: Fraunces; font-weight: 600; font-size: 64px; line-height: 1.04; letter-spacing: -1.5px; }
em { font-family: Fraunces; font-style: italic; font-weight: 400; color: #e36f58; }
.sub { font-size: 24px; line-height: 1.4; color: #62606f; margin-top: 26px; font-weight: 500; max-width: 500px; }
.url { margin-top: 34px; display: inline-block; background: #1f2030; color: #fcfaf6; border-radius: 999px; padding: 14px 26px; font-size: 20px; font-weight: 700; align-self: flex-start; }
.phone { position: absolute; right: 150px; top: 60px; width: 340px; height: 700px; border-radius: 52px; border: 10px solid #1f2030; background: #f3eee5; overflow: hidden; box-shadow: 0 40px 80px -30px rgba(31,32,48,.5); }
.phone img { width: 100%; display: block; }
.sticker { position: absolute; right: 40px; bottom: -6px; width: 170px; filter: drop-shadow(0 16px 18px rgba(31,32,48,.25)); }
`;

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1270, height: 760 } });
for (const [i, f] of FRAMES.entries()) {
  // Screenshots are 780px wide (390 @2x); the phone shows them at 320px, so scale the crop offset.
  const offset = Math.round((f.y * 320) / 780);
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
      <div class="blob" style="width:520px;height:520px;right:60px;top:120px;background:#f8d9d0"></div>
      <div class="blob" style="width:160px;height:160px;right:520px;top:40px;background:#f4d48b;opacity:.8"></div>
      <div class="text"><div class="kicker">${rich(f.kicker)}</div><h1>${rich(f.title)}</h1><div class="sub">${rich(f.sub)}</div><div class="url">leaveby.xyz</div></div>
      <div class="phone"><img src="${png(f.shot)}" style="margin-top:-${offset}px"></div>
      ${f.sticker ? `<img class="sticker" src="${sticker(f.sticker)}">` : ""}
    </body></html>`,
    { waitUntil: "load" },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, `${String(i + 1).padStart(2, "0")}.png`) });
}
await browser.close();
console.log(`${FRAMES.length} gallery images in ${out}`);
