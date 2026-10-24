import type { Metadata } from "next";

import { JsonLd } from "@/components/GuideShell";
import { HomeClient } from "@/components/HomeClient";
import { Landing } from "@/components/landing/Landing";
import { HOME_FAQ } from "@/lib/home-faq";
import { hasPlanParams, landingMetadata, planMetadata, SITE, type SearchParams } from "@/lib/plan-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  return planMetadata(searchParams, landingMetadata);
}

/** The front door. A link that carries a plan opens straight into it. */
export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  if (hasPlanParams(params)) return <HomeClient />;
  return (
    <>
      <JsonLd data={LANDING_LD} />
      <Landing />
    </>
  );
}

const LANDING_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE}/#app`,
      name: "Leave By",
      url: `${SITE}/`,
      description: "A free web app that tells you exactly when to leave for your flight, using live traffic, security waits, airline cutoffs and passport control.",
      applicationCategory: "TravelApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      mainEntity: HOME_FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ],
};
