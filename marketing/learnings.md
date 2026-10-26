# What we've learned (updated weekly from real results)

Format: date · what we tried · result · what we'll do next.

- 2026-10-14 · Founder's X post with the mascot video ad · ~24k views, strong engagement · The mascot and the "when do I need to leave?" question work. Reuse both.
- 2026-10-14 · Generating real example plans for posts surfaced a "leave at 2:15 AM for a 6 AM flight" result · Fixed in PR #33 before posting · Always sanity-check plan numbers before they go in content.
- 2026-10-19 · Week 1 (Oct 12–18) · No posts went out (no brand accounts or Postiz yet) and there's nothing to measure: the Vercel analytics query API returns "not found", PostHog has no key, and Hobby keeps runtime logs for 1 hour. The 7 days had zero runtime errors. · Content isn't the bottleneck: 20 posts are ready. Distribution is. Day 1 of the queue is the day the accounts are connected.
- 2026-10-19 · Week 2 posts built only from facts in the cited /airports guides (gate walks, O'Hare night checkpoints, LAX changes) · New source of true, specific content with no live plan run needed · Write a post from every guide fact that would surprise a regular flyer.
- 2026-10-19 · Rendering: captions on photo slides covered the mascot's face on 2 images · Moved them to the bottom (`"at": "bottom"`) · Check every rendered slide before it's queued.
- 2026-10-26 · Week 2 (Oct 19–25) · Supply grew fast: 57 cited airport guides, 4 data/holiday pages, 26 ready-to-post slideshows, a press kit. But still 0 posts published, no pageview data (the Vercel analytics API returns "not found" even though the tracking script loads; PostHog has no key), and no plan requests in the 30-minute log window I can read. Zero runtime errors in 7 days. · Lesson: content we can't measure and haven't distributed is inventory, not marketing. Next week, every check-in either ships something measurable once the keys arrive, or makes distribution easier for the founder: pre-written posts, pitch emails, one-tap tasks.

