import type { Metadata } from "next";
import Link from "next/link";

import { AppCta, GuideSection, GuideShell, JsonLd } from "@/components/GuideShell";
import { SITE } from "@/lib/plan-metadata";

const TITLE = "When to leave for the airport at Christmas and New Year's 2026";
const DESCRIPTION =
  "Christmas 2026 and New Year's Day 2027 both fall on a Friday. Last season the Sunday after Christmas was TSA's busiest day and Christmas Day its quietest. Here are the days to watch and how to work out your leave time.";

export const metadata: Metadata = {
  title: `${TITLE} · Leave By`,
  description: DESCRIPTION,
  metadataBase: new URL(SITE),
  alternates: { canonical: "/holiday-travel-2026" },
  openGraph: { title: TITLE, description: DESCRIPTION, images: ["/api/og?guide=holidays"], type: "article", url: "/holiday-travel-2026" },
  twitter: { card: "summary_large_image", images: ["/api/og?guide=holidays"] },
};

const TSA_2025 = "https://www.tsa.gov/travel/passenger-volumes/2025";
const TSA_2026 = "https://www.tsa.gov/travel/passenger-volumes";

const FAQ = [
  {
    q: "What is the busiest day to fly over Christmas 2026?",
    a: "No 2026 forecast is out yet. Last season the busiest day was Sunday, Dec 28, 2025, the Sunday after Christmas, when TSA screened 2,924,593 people. On the 2026 calendar that Sunday is Dec 27. Sunday, Jan 3, 2027, the last day before most people go back to work, is likely to be heavy too.",
  },
  {
    q: "Is Christmas Day a good day to fly?",
    a: "It's usually the quietest. TSA screened 2,066,118 people on Christmas Day 2025, the fewest of the holiday period and about 860,000 fewer than the busiest day. Christmas Eve and New Year's Eve were also light. Airline cutoffs still apply, so a quiet airport doesn't mean you can arrive late.",
  },
  {
    q: "How early should I get to the airport over the holidays?",
    a: "Airlines still ask for at least 2 hours before domestic flights and 3 hours before international flights, and their bag-drop and gate cutoffs don't move for crowds. On peak days the extra time goes on traffic to the airport and the security line. Work out your time from your flight, terminal and starting point rather than a blanket rule.",
  },
  {
    q: "What if I don't have a REAL ID?",
    a: "Since February 2026, travelers without a REAL ID or another accepted ID can use TSA ConfirmID: pay $45 at tsa.gov/ConfirmID before the trip, then show the receipt and a government ID at the airport. It covers a 10-day travel period. TSA's advice is to get a REAL ID from your state DMV before you fly.",
  },
];

// TSA checkpoint counts for the 2025–26 season (Dec from the 2025 table, Jan from the 2026 table), picked to show the pattern.
const DAYS_2025: { day: string; count: string; note: string }[] = [
  { day: "Fri Dec 19", count: "2,824,905", note: "start of school break" },
  { day: "Wed Dec 24", count: "2,236,205", note: "Christmas Eve" },
  { day: "Thu Dec 25", count: "2,066,118", note: "quietest day" },
  { day: "Sun Dec 28", count: "2,924,593", note: "busiest day" },
  { day: "Wed Dec 31", count: "2,291,360", note: "New Year's Eve" },
  { day: "Thu Jan 1", count: "2,334,465", note: "New Year's Day" },
  { day: "Sun Jan 4", count: "2,817,509", note: "last return day" },
];

export default function Holidays2026() {
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
        When to leave for the airport at <em className="font-normal italic text-coral">Christmas</em> and New Year&apos;s 2026
      </h1>
      <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-ink-2">{DESCRIPTION}</p>

      <section className="card mt-8 !p-5 md:!p-6">
        <h2 className="label !mb-3">The days to watch</h2>
        <ul className="space-y-2 text-[15.5px] leading-relaxed">
          <li><strong>Fri Dec 18 to Wed Dec 23:</strong> the outbound rush as schools let out.</li>
          <li><strong>Thu Dec 24 and Fri Dec 25:</strong> usually the quietest days of the season to fly.</li>
          <li><strong>Sun Dec 27:</strong> the Sunday after Christmas, last season&apos;s busiest day.</li>
          <li><strong>Thu Dec 31 and Fri Jan 1:</strong> light again.</li>
          <li><strong>Sun Jan 3:</strong> the final return rush before work and school restart.</li>
        </ul>
        <p className="mt-3 text-[13px] text-ink-3">
          These dates map last season&apos;s pattern onto the 2026 calendar. They aren&apos;t a forecast; TSA and AAA usually publish theirs in mid-December, and we&apos;ll update this page when they do.
        </p>
      </section>

      <GuideSection title="What happened last season">
        <p>
          TSA expected to screen <strong>44.3 million people</strong> from Friday, Dec 19, 2025 to Sunday, Jan 4, 2026, and named Sunday, Dec 28 as the likely busiest day. It was: 2,924,593 people went through
          checkpoints that day. Airlines for America projected a record 52.6 million passengers on US airlines over a slightly longer window (Dec 19 – Jan 5).
        </p>
        <ul>
          {DAYS_2025.map((d) => (
            <li key={d.day}>
              <strong>{d.day}:</strong> {d.count} screened <span className="text-ink-3">({d.note})</span>
            </li>
          ))}
        </ul>
        <p>
          Even the busiest holiday day stayed below TSA&apos;s all-time record of about 3.13 million, set on the Sunday after Thanksgiving 2025. Holiday travel is spread over two weeks, so each day is a little less
          extreme, but the peaks are still close to 3 million.
        </p>
        <p className="text-[13px] text-ink-3">
          Sources:{" "}
          <a href="https://www.tsa.gov/news/press/releases/2025/12/22/tsa-prepares-for-holiday-travel-season-cap-record-year" target="_blank" rel="noreferrer">TSA forecast</a>,{" "}
          <a href={TSA_2025} target="_blank" rel="noreferrer">TSA 2025 checkpoint numbers</a>,{" "}
          <a href={TSA_2026} target="_blank" rel="noreferrer">TSA 2026 checkpoint numbers</a>,{" "}
          <a href="https://www.airlines.org/news-update/u-s-airlines-expecting-record-number-of-passengers-over-the-winter-holidays/" target="_blank" rel="noreferrer">Airlines for America</a>.
        </p>
      </GuideSection>

      <GuideSection title="The drive is part of it">
        <p>
          AAA counted 122.4 million Americans traveling at least 50 miles from Dec 20, 2025 to Jan 1, 2026, including a record 8.03 million flying and 109.5 million driving. INRIX, which forecasts traffic for AAA,
          flagged the worst times on the road as the afternoons of Dec 20–23 and late morning to evening on Dec 26–28. Christmas Eve, Christmas Day, New Year&apos;s Eve and New Year&apos;s Day were expected to be light.
        </p>
        <p className="text-[13px] text-ink-3">
          Source: <a href="https://newsroom.aaa.com/2025/12/aaa-year-end-holiday-travel-forecast/" target="_blank" rel="noreferrer">AAA year-end holiday forecast</a>.
        </p>
      </GuideSection>

      <GuideSection title="Winter weather and delays">
        <p>
          Winter is when weather matters most. In December 2025, 71.7% of US airline flights arrived on time, and weather caused 46.7% of delays attributed to the national airspace system, up from 30.8% in October.
          A delayed inbound plane can still leave on time, so plan to be at the airport for the scheduled departure and check your flight&apos;s status before you leave.
        </p>
        <p className="text-[13px] text-ink-3">
          Sources: <a href="https://www.bts.gov/newsroom/airline-service-quality-performance-data-december-2025" target="_blank" rel="noreferrer">Bureau of Transportation Statistics</a>,{" "}
          <a href="https://www.bts.gov/topics/airlines-and-airports/understanding-reporting-causes-flight-delays-and-cancellations" target="_blank" rel="noreferrer">BTS delay causes</a>.
        </p>
      </GuideSection>

      <GuideSection title="New this year">
        <ul>
          <li>
            <strong>No REAL ID?</strong> TSA ConfirmID costs $45 for a 10-day travel period. Pay online before the trip and bring the receipt with a government ID (
            <a href="https://www.tsa.gov/news/press/releases/2026/02/05/tsa-successfully-rolls-out-tsa-confirmid-0" target="_blank" rel="noreferrer">TSA</a>).
          </li>
          <li>
            <strong>Flying from Newark?</strong> The FAA&apos;s limits on flights at EWR are extended through Oct 30, 2027 (
            <a href="https://www.federalregister.gov/documents/2026/06/23/2026-12589/operating-limitations-at-newark-liberty-international-airport" target="_blank" rel="noreferrer">Federal Register</a>). See the{" "}
            <Link href="/airports/ewr">Newark guide</Link>.
          </li>
          <li>
            <strong>Flying abroad?</strong> Europe&apos;s Entry/Exit System adds a passport step on the way home. See <Link href="/international-flights">international flights</Link>.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Where the extra time goes">
        <ul>
          <li><strong>The drive.</strong> Holiday traffic and full airport roads. Drop-off curbs back up first.</li>
          <li><strong>Bag drop.</strong> Airline cutoffs (often 45–60 minutes before departure) are strict, and holiday bags mean longer lines.</li>
          <li><strong>Security.</strong> Peak hours fill every lane, including PreCheck.</li>
          <li><strong>The gate.</strong> Boarding often starts 30–50 minutes before departure and the door closes 10–15 minutes before.</li>
        </ul>
        <p>
          Leave By adds these up for your flight. It checks live traffic from your starting point, security at your terminal and airport alerts, and gives you the time to walk out the door.
        </p>
      </GuideSection>

      <AppCta title="Flying for the holidays?" body="Enter your flight and where you're leaving from. Leave By gives you the exact time to leave, and you can send the plan to whoever is driving you." />

      <GuideSection title="Questions travelers ask">
        {FAQ.map((f) => (
          <div key={f.q}>
            <p className="font-semibold text-ink">{f.q}</p>
            <p>{f.a}</p>
          </div>
        ))}
      </GuideSection>

      <GuideSection title="More guides">
        <p>
          <Link href="/airports">Airport guides</Link> · <Link href="/thanksgiving-travel-2026">Thanksgiving 2026</Link> · <Link href="/international-flights">International flights</Link> ·{" "}
          <Link href="/airport-theory">Airport theory</Link>
        </p>
      </GuideSection>
      <p className="mt-6 text-[12.5px] text-ink-3">Checked October 25, 2026.</p>
    </GuideShell>
  );
}
