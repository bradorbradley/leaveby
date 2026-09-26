// End-to-end check of the flight picker against a running server:
//   BASE=http://localhost:3000 node scripts/e2e-picker.mjs
// Types a multi-leg flight number, checks every departure is listed and none is pre-picked,
// picks one, plans it, and checks the plan is for the picked airport.
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? ".";
const FLIGHT = process.env.FLIGHT ?? "UA1564";
const PICK = process.env.PICK ?? "ORD";
const ORIGIN = process.env.ORIGIN ?? "60614";

const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });

await page.fill("#flight", FLIGHT);
const radios = page.getByRole("radio");
await radios.first().waitFor({ timeout: 20000 });
const count = await radios.count();
const labels = await radios.allInnerTexts();
console.log(`${count} departures:`, labels.map((l) => l.replace(/\s+/g, " ")).join(" | "));
await page.screenshot({ path: `${OUT}/picker.png`, fullPage: true });

if (count > 1) {
  const checked = await page.locator('[role="radio"][aria-checked="true"]').count();
  if (checked !== 0) fail("a departure was pre-selected when there are several");
  if (!(await page.getByRole("button", { name: /pick your departure/i }).isDisabled())) fail("submit enabled before picking");
}

const target = radios.filter({ hasText: new RegExp(`[AP]M\\s*${PICK}\\s*(→|$)`) });
if ((await target.count()) === 0) fail(`no ${PICK} departure listed`);
await target.first().click();
if ((await target.first().getAttribute("aria-checked")) !== "true") fail("pick didn't register");

await page.fill("#origin", ORIGIN);
await page.waitForTimeout(1200);
await page.keyboard.press("Escape").catch(() => {});
await page.screenshot({ path: `${OUT}/picked.png`, fullPage: true });

const submit = page.getByRole("button", { name: /when should i leave/i });
if (await submit.isDisabled()) fail("submit still disabled after picking");
const planBody = page.waitForRequest((r) => r.url().endsWith("/api/plan")).then((r) => r.postDataJSON());
await submit.click();
const body = await planBody;
console.log("plan request leg:", JSON.stringify(body.leg));
if (body.leg?.airport !== PICK) fail(`plan requested ${body.leg?.airport}, not ${PICK}`);

await page.waitForFunction(() => / · departs /.test(document.body.innerText), null, { timeout: 90000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/plan.png`, fullPage: true });
const text = await page.locator("main").innerText();
const line = text.split("\n").find((l) => l.includes(" · departs ")) ?? "";
console.log("plan flight line:", line);
if (!line.startsWith(PICK)) fail(`plan is for ${line.slice(0, 3)}, not ${PICK}`);
console.log("PASS");
await browser.close();
