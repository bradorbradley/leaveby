// Tell IndexNow search engines (Bing, which feeds ChatGPT search and Copilot, plus Yandex, Seznam and Naver)
// that our pages changed. Run after a deploy that adds or edits pages:
//   node scripts/indexnow.mjs            (every URL in the live sitemap)
//   node scripts/indexnow.mjs /airports/jfk /thanksgiving-travel-2026
// The key is public by design: IndexNow verifies it at https://www.leaveby.xyz/<key>.txt.
const SITE = "https://www.leaveby.xyz";
const KEY = "b40e5fbcc2594774b47730ef81c1ba83";

const paths = process.argv.slice(2);
const urlList = paths.length
  ? paths.map((p) => new URL(p, SITE).href)
  : [...(await (await fetch(`${SITE}/sitemap.xml`)).text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urlList.length} URLs`);
if (res.status >= 400) process.exit(1);
