import type { Metadata } from "next";
import Link from "next/link";

import { AppCta, GuideSection, GuideShell, JsonLd } from "@/components/GuideShell";
import { allGuides } from "@/lib/guides";
import { SITE } from "@/lib/plan-metadata";

const TITLE = "When to leave for the airport at Thanksgiving 2026";
const DESCRIPTION =
  "Thanksgiving 2026 is Thursday, Nov 26. The Sunday after Thanksgiving has set TSA's all-time record three years running. Here are the busiest days and how to work out your leave time.";

export const metadata: Metadata = {
  title: `${TITLE} · Leave By`,
  description: DESCRIPTION,
  metadataBase: new URL(SITE),
  alternates: { canonical: "/thanksgiving-travel-2026" },
  openGraph: { title: TITLE, description: DESCRIPTION, images: ["/api/og?guide=thanksgiving"], type: "article", url: "/thanksgiving-travel-2026" },
  twitter: { card: "summary_large_image", images: ["/api/og?guide=thanksgiving"] },
};

const FAQ = [
  {
    q: "What is the busiest day to fly at Thanksgiving 2026?",
    a: "Expect the Sunday after Thanksgiving, Nov 29, 2026, to be the busiest. That Sunday set TSA's all-time screening record in each of the last three years, most recently about 3.13 million people on Nov 30, 2025. The Tuesday and Wednesday before (Nov 24–25) are the busiest outbound days.",
  },
  {
    q: "How early should I get to the airport at Thanksgiving?",
    a: "Airlines still ask for at least 2 hours before domestic flights and 3 hours before international flights, and their check-in and bag-drop cutoffs don't move for crowds. On peak days the time you lose is in traffic to the airport and in the security line, so work out your time from your actual flight, terminal and starting point rather than a blanket rule.",
  },
  {
    q: "Does TSA PreCheck help at Thanksgiving?",
    a: "Yes, PreCheck lanes are usually shorter, but they get busy at peak hours too, and some PreCheck lanes close in the evening at certain checkpoints. Check your airport's guide for which checkpoints have PreCheck.",
  },
];

export default function Thanksgiving2026() {
  const guides = allGuides();
  return (
    <GuideShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <h1 className="display-soft mt-12 text-[38px] leading-[1.04] md:text-[52px]">
        When to leave for the airport at <em className="font-normal italic text-coral">Thanksgiving</em> 2026
      </h1>
      <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-ink-2">{DESCRIPTION}</p>

      <section className="card mt-8 !p-5 md:!p-6">
        <h2 className="label !mb-3">The days to watch</h2>
        <ul className="space-y-2 text-[15.5px] leading-relaxed">
          <li><strong>Tue Nov 24 and Wed Nov 25:</strong> the outbound rush.</li>
          <li><strong>Thu Nov 26 (Thanksgiving):</strong> usually the quietest day of the week to fly.</li>
          <li><strong>Sun Nov 29:</strong> the return rush, and the likeliest day for a new all-time record.</li>
          <li><strong>Mon Nov 30:</strong> still heavy as late returners head home.</li>
          <li>Every day of TSA numbers since 2025: <Link href="/busiest-travel-days">the busiest days to fly</Link>.</li>
          <li>Flying again in December? See <Link href="/holiday-travel-2026">Christmas and New Year&apos;s 2026</Link>.</li>
        </ul>
      </section>

      <GuideSection title="Record crowds, three years running">
        <p>
          TSA screened <strong>about 3.13 million people</strong> on Sunday, Nov 30, 2025, the busiest day in its history. It was the third year in a row that the Sunday after Thanksgiving set the record, and TSA expected
          more than 17.8 million screenings over that Thanksgiving period. If the pattern holds, Sunday, Nov 29, 2026 will be busier still.
        </p>
        <p className="text-[13px] text-ink-3">
          Sources:{" "}
          <a href="https://www.tsa.gov/news/press/releases/2025/11/21/golden-age-travel-tsa-prepared-screen-more-3-million-thanksgiving" target="_blank" rel="noreferrer">TSA</a>,{" "}
          <a href="https://abcnews.com/US/tsa-sets-time-record-31-million-travelers-screened/story?id=128004157" target="_blank" rel="noreferrer">ABC News</a>,{" "}
          <a href="https://thepointsguy.com/news/thanksgiving-travel-2025-sets-records/" target="_blank" rel="noreferrer">The Points Guy</a>,{" "}
          <a href="https://www.tsa.gov/travel/passenger-volumes/2025" target="_blank" rel="noreferrer">TSA checkpoint numbers</a>.
        </p>
      </GuideSection>

      <GuideSection title="Where the extra time goes">
        <ul>
          <li><strong>The drive.</strong> Holiday traffic and full airport roadways. Pickup and drop-off curbs back up first.</li>
          <li><strong>Bag drop.</strong> Airline cutoffs (often 45–60 minutes before departure) are strict. A long bag-drop line can make you miss one.</li>
          <li><strong>Security.</strong> Peak hours fill every lane, including PreCheck.</li>
          <li><strong>The gate.</strong> Boarding often starts 30–50 minutes before departure and the door closes 10–15 minutes before.</li>
        </ul>
        <p>
          Leave By adds these up for your flight. It checks live traffic from your starting point, security at your terminal and airport alerts, and gives you the time to walk out the door.
        </p>
      </GuideSection>

      <AppCta title="Flying for Thanksgiving?" body="Enter your flight and where you're leaving from. Leave By gives you the exact time to leave, and you can send the plan to whoever is driving you." />

      <GuideSection title="Questions travelers ask">
        {FAQ.map((f) => (
          <div key={f.q}>
            <p className="font-semibold text-ink">{f.q}</p>
            <p>{f.a}</p>
          </div>
        ))}
      </GuideSection>

      {guides.length ? (
        <GuideSection title="Airport guides">
          <p className="flex flex-wrap gap-2">
            {guides.map((g) => (
              <Link key={g.code} href={`/airports/${g.code.toLowerCase()}`} className="chip !min-h-[34px] !px-3 !text-[12.5px] no-underline">
                {g.code}
              </Link>
            ))}
          </p>
        </GuideSection>
      ) : null}
    </GuideShell>
  );
}
