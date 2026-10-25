import type { MetadataRoute } from "next";

import { allGuides } from "@/lib/guides";
import { SITE } from "@/lib/plan-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/app`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/airports`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/thanksgiving-travel-2026`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/holiday-travel-2026`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/international-flights`, lastModified: new Date("2026-10-24"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/airport-theory`, lastModified: new Date("2026-10-24"), changeFrequency: "monthly", priority: 0.7 },
    ...allGuides().map((g) => ({ url: `${SITE}/airports/${g.code.toLowerCase()}`, lastModified: new Date(g.checkedOn), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
