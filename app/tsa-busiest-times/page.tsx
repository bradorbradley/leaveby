import type { Metadata } from "next";
import Link from "next/link";

import { AppCta, GuideSection, GuideShell, JsonLd } from "@/components/GuideShell";
import { DayHourHeatmap, HourBars } from "@/components/TsaCharts";
import { SITE } from "@/lib/plan-metadata";
import { averageByHour, HOURLY_SOURCE, hourLabel, hourlyGrid, shareOfHours } from "@/lib/tsa-hourly";
import { fmt } from "@/lib/tsa-volumes";

const TITLE = "What time of day is TSA busiest?";
const DESCRIPTION =
  "TSA's hourly counts for every checkpoint in the US, for one full week: the morning rush at 5 and 6 AM, the long midday plateau, quiet evenings, and why Sundays look different.";

export const metadata: Metadata = {
  title: `${TITLE} TSA's hourly numbers · Leave By`,
  description: DESCRIPTION,
  metadataBase: new URL(SITE),
  alternates: { canonical: "/tsa-busiest-times" },
  openGraph: { title: TITLE, description: DESCRIPTION, images: ["/api/og?guide=hours"], type: "article", url: "/tsa-busiest-times" },
  twitter: { card: "summary_large_image", images: ["/api/og?guide=hours"] },
};

const DATES = ["Sep 13", "Sep 14", "Sep 15", "Sep 16", "Sep 17", "Sep 18", "Sep 19"];
const pct = (n: number) => `${Math.round(n)}%`;
// "6am" → "6 AM" for running text; the charts keep the compact form.
const spoken = (h: number) => hourLabel(h).replace(/(am|pm)$/, (m) => ` ${m.toUpperCase()}`);

export default function TsaBusiestTimes() {
  const grid = hourlyGrid();
  const avg = averageByHour(grid);
  const peak = avg.indexOf(Math.max(...avg));
  const rush = shareOfHours([5, 6], grid);
  const beforeNine = shareOfHours([0, 1, 2, 3, 4, 5, 6, 7, 8], grid);
  const evening = shareOfHours([19, 20, 21, 22, 23], grid);
  const midday = Math.round([9, 10, 11, 12, 13].reduce((s, h) => s + avg[h], 0) / 5);
  const sun = grid[0];
  const fri = grid[5];

  const FAQ = [
    {
      q: "What time of day is TSA busiest?",
      a: `Early morning. In TSA's hourly counts for every US checkpoint over the week of Sep 13–19, 2026, the busiest hours were 5 and 6 AM local time on every day of the week. Those two hours carried ${pct(rush)} of the week's screenings, and ${pct(beforeNine)} happened before 9 AM.`,
    },
    {
      q: "What is the least busy time at airport security?",
      a: `Late evening and overnight. Only ${pct(evening)} of screenings happened from 7 PM to midnight. Midday is in between: about ${fmt(midday)} people an hour nationally from 9 AM to 2 PM, against ${fmt(avg[peak])} in the ${spoken(peak)} hour.`,
    },
    {
      q: "Does a busier hour mean a longer TSA line?",
      a: "Not necessarily. These counts show how many people went through, not how long anyone waited. Check your airport's live wait times and your airline's cutoffs, not the hour alone.",
    },
    {
      q: "Are Sundays different?",
      a: `Yes. On Sunday, Sep 13, the 5 AM hour (${fmt(sun[5])}) and the noon hour (${fmt(sun[12])}) were nearly the same, and 4 PM was still ${fmt(sun[16])}. The crowd is spread across the whole day. On weekday mornings the peak is sharper: ${fmt(fri[5])} at 5 AM on Friday.`,
    },
  ];

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
        What time of day is <em className="font-normal italic text-coral">TSA busiest</em>?
      </h1>
      <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-ink-2">{DESCRIPTION}</p>

      <section className="card mt-8 !p-5 md:!p-6">
        <h2 className="label !mb-3">The short answer</h2>
        <ul className="space-y-2 text-[15.5px] leading-relaxed">
          <li><strong>Busiest:</strong> 5 to 7 AM local time, every day of the week. {pct(rush)} of all screenings in just two hours.</li>
          <li><strong>Steady:</strong> 9 AM to 3 PM, a long plateau a little below the morning peak.</li>
          <li><strong>Quietest:</strong> after 7 PM. Only {pct(evening)} of screenings.</li>
          <li><strong>Sundays</strong> stay busy all day, not just in the morning.</li>
        </ul>
      </section>

      <GuideSection title="An average day, hour by hour">
        <HourBars avg={avg} />
        <p>
          Nationally, about {fmt(avg[peak])} people went through TSA checkpoints in the {spoken(peak)} hour on an average day that week, the most of any hour. The 4 AM hour ramps up fast as
          checkpoints open; the overnight hours barely register.
        </p>
      </GuideSection>

      <GuideSection title="Every hour of one week">
        <DayHourHeatmap grid={grid} dates={DATES} />
        <p>
          The darkest squares are weekday mornings, led by Monday, Thursday and Friday. Tuesday and Saturday are lighter all day. Sunday is the odd one: no sharp morning peak, but heavy from early morning
          into the late afternoon.
        </p>
      </GuideSection>

      <GuideSection title="What this means for your leave time">
        <ul>
          <li><strong>Flying at 6 or 7 AM?</strong> You&apos;ll be screened in the busiest hours of the day. Plan for the line your airport shows at that hour, not the one you saw at noon last time.</li>
          <li><strong>Every airport has its own peaks.</strong> Our <Link href="/airports">airport guides</Link> list each airport&apos;s busiest hours and checkpoints.</li>
          <li><strong>Day matters too.</strong> See <Link href="/busiest-travel-days">the busiest days to fly</Link>, from TSA&apos;s daily numbers.</li>
        </ul>
        <p>Leave By puts it together for your flight: live traffic from your door, the security line at your terminal at that hour, and your airline&apos;s cutoffs.</p>
      </GuideSection>

      <AppCta title="Early flight?" body="Enter your flight and where you're leaving from. Leave By gives you the exact minute to walk out the door." />

      <GuideSection title="Questions travelers ask">
        {FAQ.map((f) => (
          <div key={f.q}>
            <p className="font-semibold text-ink">{f.q}</p>
            <p>{f.a}</p>
          </div>
        ))}
      </GuideSection>

      <GuideSection title="About the numbers">
        <p>
          TSA publishes hourly screening counts for every checkpoint in its FOIA reading room. We added up every checkpoint in the country for each hour of the week of Sunday, Sep 13 to Saturday, Sep 19, 2026.
          Hours are local time at each airport, and the counts include Known Crewmember screenings. Our daily totals come within 1.2% of TSA&apos;s published national numbers for the same days. One
          week in mid-September isn&apos;t a holiday week, so holiday peaks will be higher. Source:{" "}
          <a href={HOURLY_SOURCE} target="_blank" rel="noreferrer">TSA throughput data, Sep 13–19, 2026</a>.
        </p>
      </GuideSection>
      <p className="mt-6 text-[12.5px] text-ink-3">Checked October 26, 2026.</p>
    </GuideShell>
  );
}
