import type { Metadata } from "next";
import Link from "next/link";

import { AppCta, GuideSection, GuideShell, JsonLd } from "@/components/GuideShell";
import { TsaCalendar, WeekdayBars } from "@/components/TsaCharts";
import { SITE } from "@/lib/plan-metadata";
import { busiest, daysInYear, fmt, formatDay, total, TSA_SOURCE, tsaDays, weekdayAverages } from "@/lib/tsa-volumes";

const TITLE = "The busiest days to fly in the US";
const DESCRIPTION =
  "Every day of TSA checkpoint numbers since January 2025: the busiest days on record, the busiest day of the week, the quietest days, and how 2026 compares with 2025.";

export const metadata: Metadata = {
  title: `${TITLE}, from TSA's daily numbers · Leave By`,
  description: DESCRIPTION,
  metadataBase: new URL(SITE),
  alternates: { canonical: "/busiest-travel-days" },
  openGraph: { title: TITLE, description: DESCRIPTION, images: ["/api/og?guide=busiest"], type: "article", url: "/busiest-travel-days" },
  twitter: { card: "summary_large_image", images: ["/api/og?guide=busiest"] },
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const millions = (n: number) => `${(n / 1e6).toFixed(2)} million`;

export default function BusiestTravelDays() {
  const days = tsaDays();
  const y25 = daysInYear(2025, days);
  const y26 = daysInYear(2026, days);
  const last = days[days.length - 1];
  const at = (iso: string) => days.find((d) => d.date === iso)!.count;

  const top = busiest(days, 10);
  const over3m = days.filter((d) => d.count >= 3_000_000);
  const top26 = busiest(y26, 1)[0];
  const wk25 = weekdayAverages(y25);
  const wk26 = weekdayAverages(y26);
  const byAvg = (xs: { day: string; avg: number }[]) => [...xs].sort((a, b) => b.avg - a.avg);
  const [bestDay25] = byAvg(wk25);
  const quietDay25 = byAvg(wk25)[6];
  const top3of26 = byAvg(wk26).slice(0, 3);

  const months25 = MONTH_NAMES.map((name, m) => {
    const xs = y25.filter((d) => Number(d.date.slice(5, 7)) === m + 1);
    return { name, avg: Math.round(total(xs) / xs.length) };
  });
  const busiestMonth = months25.reduce((a, b) => (b.avg > a.avg ? b : a));
  const quietestMonth = months25.reduce((a, b) => (b.avg < a.avg ? b : a));

  // Same calendar span in both years, Jan 1 to the latest day TSA has published.
  const ytd26 = total(y26);
  const ytd25 = total(y25.filter((d) => d.date.slice(5) <= last.date.slice(5)));
  const change = ((ytd26 / ytd25 - 1) * 100).toFixed(1);

  const FAQ = [
    {
      q: "What is the busiest day to fly in the US?",
      a: `The busiest day on record is ${formatDay(top[0].date)}, the Sunday after Thanksgiving, when TSA screened ${fmt(top[0].count)} people. In all, ${over3m.length} days have topped 3 million, all of them in 2025${over3m.every((d) => d.weekday === 0 || d.weekday === 5) ? ", and every one fell on a Friday or a Sunday" : ""}.`,
    },
    {
      q: "What day of the week is busiest to fly?",
      a: `In 2025 it was ${bestDay25.day}, with ${millions(bestDay25.avg)} people screened on an average ${bestDay25.day}. In 2026 so far, ${top3of26[0].day}, ${top3of26[1].day} and ${top3of26[2].day} are nearly tied (${top3of26.map((d) => millions(d.avg)).join(", ")} on an average day). ${quietDay25.day} is the quietest day of the week in both years, with about ${millions(quietDay25.avg)}.`,
    },
    {
      q: "What are the quietest days to fly?",
      a: `Tuesdays and Saturdays every week, January and February overall, and the holidays themselves: TSA screened ${fmt(at("2025-11-27"))} people on Thanksgiving Day 2025, ${fmt(at("2025-12-25"))} on Christmas Day 2025 and ${fmt(at("2026-07-04"))} on July 4, 2026.`,
    },
    {
      q: "What is the busiest month to fly?",
      a: `${busiestMonth.name}, with ${millions(busiestMonth.avg)} people a day on average in 2025. June was close behind. ${quietestMonth.name} was the quietest, at ${millions(quietestMonth.avg)} a day.`,
    },
    {
      q: "Is air travel busier in 2026 than in 2025?",
      a: `Slightly less busy so far. From Jan 1 to ${formatDay(last.date, false).replace(/^\w+, /, "")}, TSA screened ${fmt(ytd26)} people in 2026, ${Math.abs(Number(change))}% ${Number(change) < 0 ? "fewer" : "more"} than the ${fmt(ytd25)} over the same dates in 2025. The busiest day of 2026 so far is ${formatDay(top26.date)}, with ${fmt(top26.count)}; no 2026 day has reached 3 million yet.`,
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "TSA checkpoint travel numbers, daily, January 2025 onward",
          description: "People screened at US TSA checkpoints each day, as published by TSA.",
          url: `${SITE}/busiest-travel-days`,
          isBasedOn: TSA_SOURCE,
          temporalCoverage: `${days[0].date}/${last.date}`,
          creator: { "@type": "GovernmentOrganization", name: "Transportation Security Administration", url: "https://www.tsa.gov" },
        }}
      />
      <h1 className="display-soft mt-12 text-[38px] leading-[1.04] md:text-[52px]">
        The <em className="font-normal italic text-coral">busiest days</em> to fly in the US
      </h1>
      <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-ink-2">{DESCRIPTION}</p>

      <section className="card mt-8 !p-5 md:!p-6">
        <h2 className="label !mb-3">The short answer</h2>
        <ul className="space-y-2 text-[15.5px] leading-relaxed">
          <li><strong>Busiest day ever:</strong> {formatDay(top[0].date)}, the Sunday after Thanksgiving: {fmt(top[0].count)} people.</li>
          <li><strong>Busiest days of the week:</strong> Sunday, Friday, Thursday and Monday.</li>
          <li><strong>Quietest:</strong> Tuesday, then Wednesday and Saturday.</li>
          <li><strong>Busiest months:</strong> June and July. Quietest: January.</li>
        </ul>
      </section>

      <GuideSection title="Every day of 2026 so far">
        <p>Darker means more people went through TSA checkpoints that day. The dark first column is Sundays; the pale squares are mostly Tuesdays, Saturdays and holidays.</p>
        <TsaCalendar year={2026} days={y26} />
        <p className="text-[13px] text-ink-3">Through {formatDay(last.date)}, the latest day TSA had published.</p>
      </GuideSection>

      <GuideSection title="Every day of 2025">
        <TsaCalendar year={2025} days={y25} />
        <p>
          TSA screened {fmt(total(y25))} people in 2025, about {millions(Math.round(total(y25) / y25.length))} a day.
        </p>
      </GuideSection>

      <GuideSection title="The 10 busiest days on record">
        <ol className="list-decimal pl-5">
          {top.map((d) => (
            <li key={d.date}>
              <strong>{formatDay(d.date)}:</strong> {fmt(d.count)}
            </li>
          ))}
        </ol>
        <p>
          The Sunday after Thanksgiving holds the record, and summer Sundays take half the list. Two are Fridays before long weekends: Memorial Day and Columbus Day.
        </p>
      </GuideSection>

      <GuideSection title="Busiest day of the week">
        <p>Average people screened per day in 2025:</p>
        <WeekdayBars rows={wk25} />
        <p>
          The pattern holds in 2026: Thursday, Friday, Sunday and Monday are the heavy days, and Tuesday is the lightest, about {Math.round((1 - quietDay25.avg / bestDay25.avg) * 100)}% below Sunday.
        </p>
      </GuideSection>

      <GuideSection title="What this means for your leave time">
        <p>
          A busy day nationally doesn&apos;t mean a long line everywhere, and the hour matters as much as the day: see <Link href="/tsa-busiest-times">what time of day TSA is busiest</Link>. Each of our{" "}
          <Link href="/airports">airport guides</Link> lists that airport&apos;s busiest hours and checkpoints.
        </p>
        <p>
          Leave By works out the time for your flight: live traffic from your starting point, the security line at your terminal and your airline&apos;s cutoffs. For the next big weeks, see{" "}
          <Link href="/thanksgiving-travel-2026">Thanksgiving 2026</Link> and <Link href="/holiday-travel-2026">Christmas and New Year&apos;s 2026</Link>.
        </p>
      </GuideSection>

      <AppCta title="Flying on a busy day?" body="Enter your flight and where you're leaving from. Leave By gives you the exact minute to walk out the door." />

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
          These are TSA&apos;s published counts of people screened at its checkpoints nationwide each day. They count screenings, not airline passengers: a traveler connecting between flights usually isn&apos;t
          screened again, so airline passenger totals run higher. Source:{" "}
          <a href={TSA_SOURCE} target="_blank" rel="noreferrer">TSA checkpoint travel numbers</a> (2026) and{" "}
          <a href={`${TSA_SOURCE}/2025`} target="_blank" rel="noreferrer">2025</a>.
        </p>
      </GuideSection>
      <p className="mt-6 text-[12.5px] text-ink-3">Checked October 25, 2026.</p>
    </GuideShell>
  );
}
