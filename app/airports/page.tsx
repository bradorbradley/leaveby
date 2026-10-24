import type { Metadata } from "next";
import Link from "next/link";

import { AppCta, GuideShell } from "@/components/GuideShell";
import { allGuides } from "@/lib/guides";
import { SITE } from "@/lib/plan-metadata";

export const metadata: Metadata = {
  title: "How early to get to the airport: guides for the busiest US airports · Leave By",
  description: "Terminals, security checkpoints, PreCheck and CLEAR, construction and official arrival advice for the busiest US airports, with sources. Then get your exact leave time.",
  metadataBase: new URL(SITE),
  alternates: { canonical: "/airports" },
  openGraph: { title: "How early to get to the airport", type: "website", url: "/airports", images: ["/api/og?guide=airports"] },
  twitter: { card: "summary_large_image", images: ["/api/og?guide=airports"] },
};

export default function AirportsIndex() {
  const guides = allGuides();
  return (
    <GuideShell>
      <h1 className="display-soft mt-12 text-[38px] leading-[1.04] md:text-[52px]">
        How early should you get to the <em className="font-normal italic text-coral">airport</em>?
      </h1>
      <p className="mt-4 max-w-[52ch] text-[16.5px] leading-relaxed text-ink-2">
        &ldquo;Two hours domestic, three international&rdquo; is a blanket rule. Here&apos;s what&apos;s actually different at each of the busiest US airports: terminals, checkpoints, PreCheck and CLEAR, construction, and how to get there. Every guide lists its sources.
      </p>
      <p className="mt-3 text-[15px] text-ink-2">
        Flying abroad? See <Link href="/international-flights">international flights</Link>. Tempted by the TikTok trend? <Link href="/airport-theory">Does airport theory work?</Link>
      </p>
      <div className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {guides.map((g) => (
          <Link key={g.code} href={`/airports/${g.code.toLowerCase()}`} className="card flex items-center gap-4 !p-4 transition-transform hover:-translate-y-0.5">
            <span className="font-display text-[26px] font-semibold">{g.code}</span>
            <span className="min-w-0">
              <span className="block truncate text-[14.5px] font-semibold">{g.name}</span>
              <span className="block text-[13px] text-ink-3">{g.city}, {g.state}</span>
            </span>
          </Link>
        ))}
      </div>
      <AppCta title="Want your exact time?" body="Guides give you the range. Leave By takes your flight, your starting point and live traffic and gives you the minute to leave." />
    </GuideShell>
  );
}
