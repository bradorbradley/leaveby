# Leave By marketing engine

The plan: `reports/Leave By AI marketing plan.md` (local) and the summary below.

**Goal:** plans made per week (`plan_ready` events). Everything else is a means to that.

## Channels
1. **TikTok + Instagram** (@leaveby brand accounts): 1–2 slideshows a day. Built here, scheduled via Postiz. TikTok goes up as drafts; a human adds a trending sound and publishes.
2. **Search + AI answers:** `/airports/*` guides from cited research, `/thanksgiving-travel-2026`, `sitemap.xml`, `robots.txt`, `llms.txt`.
3. **Launches + community:** Show HN, Product Hunt (Wed Nov 4), Reddit answers (posted by a human).
4. **Paid ($50–100):** only behind a post that already won, Nov 20–26.

## Files
- `brand.md`: voice and hard rules. Read before writing anything.
- `posts/<week>.json`: post specs. Each concept has 2 opening hooks (a/b) on the same slides.
- `queue.md`: posting schedule and captions for the current week.
- `render.mjs`: renders specs to 1080x1920 PNGs in `out/` (gitignored).
  `CHROMIUM=/opt/pw-browsers/chromium node marketing/render.mjs marketing/posts/week1.json`
- `assets/`: mascot stills and cutouts. `fonts/`: brand fonts (OFL).
- `learnings.md`: what worked, updated weekly.
- `launch/`: Show HN, Product Hunt and Reddit drafts.

## Links
Use UTM links so analytics can tell channels apart:
`https://www.leaveby.xyz/?utm_source=tiktok&utm_medium=social&utm_campaign=launch`
(sources: tiktok, instagram, reddit, hackernews, producthunt; medium: social or community; campaign must be on the analytics allowlist.)
