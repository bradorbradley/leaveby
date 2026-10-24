import type { MetadataRoute } from "next";

import { SITE } from "@/lib/plan-metadata";

/** Open to search engines and AI answer engines, so guides can be found and cited. */
export default function robots(): MetadataRoute.Robots {
  return {
    // /api/og stays open: link-preview bots (X, Slack, LinkedIn) obey robots.txt when fetching share images.
    rules: [{ userAgent: "*", allow: ["/", "/api/og"], disallow: ["/api/", "/promo"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
