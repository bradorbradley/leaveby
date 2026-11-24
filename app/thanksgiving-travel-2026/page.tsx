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

const A4A = "https://www.airlines.org/news-update/u-s-airlines-prepare-for-busy-thanksgiving-travel-period-amid-record-high-jet-fuel-costs/";
const AAA = "https://newsroom.aaa.com/2026/11/aaa-thanksgiving-holiday-travel-forecast/";

// INRIX worst and best times to drive, from AAA's Nov 16, 2026 forecast (local time in each metro).
const DRIVE = [
  { day: "Tue Nov 24", worst: "2–8 PM", best: "Before 1 PM" },
  { day: "Wed Nov 25", worst: "12–7 PM", best: "Before 12 PM" },
  { day: "Thu Nov 26", worst: "Minimal traffic expected", best: "" },
  { day: "Fri Nov 27", worst: "1–7 PM", best: "Before 12 PM" },
  { day: "Sat Nov 28", worst: "12–9 PM", best: "Before 11 AM" },
  { day: "Sun Nov 29", worst: "12–8 PM", best: "Before 11 AM" },
  { day: "Mon Nov 30", worst: "2–7 PM", best: "Before 1 PM" },
];

const FAQ = [
  {
    q: "What is the busiest day to fly at Thanksgiving 2026?",
    a: "Expect the Sunday after Thanksgiving, Nov 29, 2026, to be the busiest. That Sunday set TSA's all-time screening record in each of the last three years, most recently about 3.13 million people on Nov 30, 2025, and TSA projects more than 3 million on Nov 29, 2026, the busiest day of this year's holiday period. Airlines for America also expects Sunday, Nov 29 and Monday, Nov 30 to be the busiest days of the holiday period. The Tuesday and Wednesday before (Nov 24–25) are the busiest outbound days.",
  },
  {
    q: "How early should I get to the airport at Thanksgiving?",
    a: "Airlines still ask for at least 2 hours before domestic flights and 3 hours before international flights, and their check-in and bag-drop cutoffs don't move for crowds. On peak days the time you lose is in traffic to the airport and in the security line, so work out your time from your actual flight, terminal and starting point rather than a blanket rule.",
  },
  {
    q: "How many people will travel for Thanksgiving 2026?",
    a: "AAA projects 81.5 million Americans will travel at least 50 miles from home between Tuesday, Nov 24 and Monday, Nov 30, 2026, about 121,000 fewer than last year's 81.6 million. That includes 72.9 million by car and 5.96 million on domestic flights, 0.2% fewer flyers than last year.",
  },
  {
    q: "What is the best time to drive to the airport at Thanksgiving 2026?",
    a: "In the morning. INRIX, in AAA's forecast, puts the worst traffic on Tuesday, Nov 24 from 2 to 8 PM and on Wednesday, Nov 25 from noon to 7 PM, and the worst return traffic on Sunday, Nov 29 from noon to 8 PM. Thanksgiving Day itself should have minimal traffic.",
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
          <li><strong>Sun Nov 29:</strong> the return rush. The Sunday after Thanksgiving set TSA&apos;s all-time record the last three years.</li>
          <li><strong>Mon Nov 30:</strong> still heavy as late returners head home.</li>
          <li>Every day of TSA numbers since 2025: <Link href="/busiest-travel-days">the busiest days to fly</Link>.</li>
          <li>Flying again in December? See <Link href="/holiday-travel-2026">Christmas and New Year&apos;s 2026</Link>.</li>
        </ul>
      </section>

      <GuideSection title="Record crowds, three years running">
        <p>
          TSA screened <strong>about 3.13 million people</strong> on Sunday, Nov 30, 2025, the busiest day in its history. It was the third year in a row that the Sunday after Thanksgiving set the record, and TSA expected
          more than 17.8 million screenings over that Thanksgiving period. For 2026, TSA projects <strong>about 17.6 million screenings</strong> from Tuesday, Nov 24 through Monday, Nov 30, and <strong>more than 3 million</strong> on Sunday, Nov 29, the busiest day of the period. AAA expects slightly fewer flyers than last year (below), so a new all-time record isn&apos;t certain.
        </p>
        <p className="text-[13px] text-ink-3">
          Sources:{" "}
          <a href="https://www.tsa.gov/news/press/releases/2025/11/21/golden-age-travel-tsa-prepared-screen-more-3-million-thanksgiving" target="_blank" rel="noreferrer">TSA</a>,{" "}
          <a href="https://abcnews.com/US/tsa-sets-time-record-31-million-travelers-screened/story?id=128004157" target="_blank" rel="noreferrer">ABC News</a>,{" "}
          <a href="https://thepointsguy.com/news/thanksgiving-travel-2025-sets-records/" target="_blank" rel="noreferrer">The Points Guy</a>,{" "}
          <a href="https://www.tsa.gov/travel/passenger-volumes/2025" target="_blank" rel="noreferrer">TSA checkpoint numbers</a>,{" "}
          <a href="https://www.tsa.gov/news/press/releases/2026/11/24/tsa-ready-for-thanksgiving-passenger-volumes-urges-travelers-plan" target="_blank" rel="noreferrer">TSA, Nov 24, 2026</a>.
        </p>
      </GuideSection>

      <GuideSection title="AAA's 2026 forecast">
        <p>
          AAA projects <strong>81.5 million</strong> Americans will travel at least 50 miles from home between Tuesday, Nov 24 and Monday, Nov 30: <strong>72.9 million by car</strong> and{" "}
          <strong>5.96 million on domestic flights</strong>. That&apos;s a 0.1% dip from last year&apos;s 81.6 million, and 0.2% fewer flyers. AAA says this ends a three-year streak of record Thanksgiving travel.
        </p>
        <p>The worst and best times to drive, from INRIX, local time in each metro. If you&apos;re driving to the airport, leave in the morning when you can:</p>
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-ground text-[12.5px] text-ink-2">
              <tr>
                <th className="px-3 py-2 font-semibold">Day</th>
                <th className="px-3 py-2 font-semibold">Worst traffic</th>
                <th className="px-3 py-2 font-semibold">Best time</th>
              </tr>
            </thead>
            <tbody>
              {DRIVE.map((d) => (
                <tr key={d.day} className="border-t border-line">
                  <td className="whitespace-nowrap px-3 py-2 font-semibold text-ink">{d.day}</td>
                  <td className="px-3 py-2">{d.worst}</td>
                  <td className="whitespace-nowrap px-3 py-2">{d.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[13px] text-ink-3">
          Source: <a href={AAA} target="_blank" rel="noreferrer">AAA Thanksgiving forecast, Nov 16, 2026</a>, with INRIX. AAA counts trips, not TSA screenings, so its numbers aren&apos;t comparable with TSA&apos;s.
        </p>
      </GuideSection>

      <GuideSection title="Airlines' 2026 forecast">
        <p>
          Airlines for America, the U.S. airline trade group, projects U.S. airlines will carry <strong>nearly 29 million passengers</strong> from Friday, Nov 20 through Monday, Nov 30, about{" "}
          <strong>2.7 million a day</strong>. It expects <strong>Sunday, Nov 29 and Monday, Nov 30</strong> to be the busiest days. Airlines are offering 38,000 more seats a day than in 2025, so flights will be full.
        </p>
        <p className="text-[13px] text-ink-3">
          Source: <a href={A4A} target="_blank" rel="noreferrer">Airlines for America, Nov 10, 2026</a>. Airline passenger counts include connecting passengers, so they run higher than TSA screenings.
        </p>
      </GuideSection>

      <GuideSection title="What TSA expects at big airports">
        <ul>
          <li>
            <strong>Atlanta (ATL):</strong> more than 95,000 people screened on the Sunday after Thanksgiving. The Tuesday and Wednesday before are also peak days.{" "}
            <Link href="/airports/atl">ATL guide</Link>
          </li>
          <li>
            <strong>Boston (BOS):</strong> more than 71,000 a day on the Tuesday and Wednesday before Thanksgiving, then 76,000 to 77,000 a day on Sunday, Nov 29 and Monday, Nov 30.{" "}
            <Link href="/airports/bos">BOS guide</Link>
          </li>
          <li>
            <strong>Denver (DEN):</strong> more than 78,000 on Saturday, Nov 28 and nearly 88,000 on Sunday, Nov 29.{" "}
            <Link href="/airports/den">DEN guide</Link>
          </li>
          <li>
            <strong>Las Vegas (LAS):</strong> busiest on the Tuesday and Wednesday before Thanksgiving and on Sunday, Nov 29 and Monday, Nov 30.{" "}
            <Link href="/airports/las">LAS guide</Link>
          </li>
          <li>
            <strong>Phoenix (PHX):</strong> more than 78,000 on Sunday, Nov 29 and about 71,000 on Monday, Nov 30.{" "}
            <Link href="/airports/phx">PHX guide</Link>
          </li>
          <li>
            <strong>Salt Lake City (SLC):</strong> busy the Tuesday and Wednesday before, and more than 31,000 on Sunday, Nov 29.{" "}
            <Link href="/airports/slc">SLC guide</Link>
          </li>
        </ul>
        <p className="text-[13px] text-ink-3">
          Sources: TSA releases for{" "}
          <a href="https://www.tsa.gov/news/press/releases/2026/11/23/tsa-hartsfield-jackson-atlanta-international-airport-prepared-for" target="_blank" rel="noreferrer">ATL</a>,{" "}
          <a href="https://www.tsa.gov/news/press/releases/2026/11/23/tsa-boston-logan-international-airport-ready-for-busy-thanksgiving" target="_blank" rel="noreferrer">BOS</a>,{" "}
          <a href="https://www.tsa.gov/news/press/releases/2026/11/23/tsa-denver-international-airport-ready-for-busy-thanksgiving-holiday" target="_blank" rel="noreferrer">DEN</a>,{" "}
          <a href="https://www.tsa.gov/news/press/releases/2026/11/23/tsa-phoenix-sky-harbor-international-airport-fully-prepared-for-busy" target="_blank" rel="noreferrer">PHX</a>,{" "}
          <a href="https://www.tsa.gov/news/press/releases/2026/11/23/tsa-salt-lake-city-international-ready-for-thanksgiving-holiday" target="_blank" rel="noreferrer">SLC</a> (Nov 23, 2026) and{" "}
          <a href="https://www.tsa.gov/news/press/releases/2026/11/18/tsa-harry-reid-international-airport-fully-prepared-for-busy" target="_blank" rel="noreferrer">LAS</a> (Nov 18, 2026).
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
      <p className="mt-6 text-[12.5px] text-ink-3">Checked November 24, 2026.</p>
    </GuideShell>
  );
}
