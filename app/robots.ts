import type { MetadataRoute } from "next";

import { SITE } from "@/lib/plan-metadata";

/** Open to search engines and AI answer engines, so guides can be found and cited. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/promo"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
