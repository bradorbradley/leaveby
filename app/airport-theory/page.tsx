import type { Metadata } from "next";
import Link from "next/link";

import { AppCta, FactCards, GuideSection, GuideShell, JsonLd } from "@/components/GuideShell";
import { SITE } from "@/lib/plan-metadata";

const TITLE = "Does airport theory work?";
const DESCRIPTION =
  "Airport theory, the TikTok trend, says you can show up 15–20 minutes before your flight. Airline cutoffs say otherwise: bags close 45 minutes before a domestic departure and gates close 10–15 minutes before. Here's the real math.";

export const metadata: Metadata = {
  title: `${TITLE} The TikTok trend vs. airline cutoffs · Leave By`,
  description: DESCRIPTION,
  metadataBase: new URL(SITE),
  alternates: { canonical: "/airport-theory" },
  openGraph: { title: TITLE, description: DESCRIPTION, images: ["/api/og?guide=theory"], type: "article", url: "/airport-theory" },
  twitter: { card: "summary_large_image", images: ["/api/og?guide=theory"] },
};

const FAQ = [
  {
    q: "What is airport theory?",
    a: "Airport theory is a TikTok trend that went viral in early 2025, with tens of millions of views. It claims you can arrive at the airport 15–20 minutes before your flight, because airports are usually less crowded than people fear.",
  },
  {
    q: "Does airport theory work?",
    a: "Not as advertised. Most US airlines close bag drop 45 minutes before a domestic departure and require you at the gate 10–15 minutes before (Delta: 15, Southwest: 10). Arriving 15–20 minutes before departure leaves no time for security or the walk to the gate. TSA said in March 2025 that travelers who arrive that late are \"more than likely missing\" their flight.",
  },
  {
    q: "How late can I get to the airport?",
    a: "It depends on your airport, terminal, hour, whether you're checking a bag and how far your gate is. The fixed points are your airline's cutoffs: bags 45 minutes before most domestic flights (60 internationally) and the gate 10–15 minutes before. Leave By works backwards from those for your actual flight.",
  },
  {
    q: "Who started airport theory?",
    a: "The trend is linked to creator Michael DiCostanzo, who told The Points Guy he actually arrives about two hours early and that his posts were misread: \"All I've ever said is that they're usually less crowded than you think.\"",
  },
];

const CUTOFFS = [
  { airline: "Delta", bags: "45 min (60 at JFK)", gate: "At the gate 15 min before", url: "https://www.delta.com/us/en/check-in-security/check-in-time-requirements/domestic-check-in" },
  { airline: "JetBlue", bags: "45 min", gate: "On board 15 min before", url: "https://www.jetblue.com/help/checking-in/airport-check-in" },
  { airline: "Southwest", bags: "45 min", gate: "In the gate area 10 min before", url: "https://support.southwest.com/helpcenter/article/airport-arrival-recommendation" },
  { airline: "United", bags: "45 min (since June 2025)", gate: "Not checked", url: "https://www.nbcchicago.com/news/local/united-airlines-check-in-cutoff-time-just-changed-heres-how-early-you-now-need-to-check-in-for-your-flight/3758944/" },
];

export default function AirportTheory() {
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
        Does <em className="font-normal italic text-coral">airport theory</em> work?
      </h1>
      <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-ink-2">{DESCRIPTION}</p>

      <section className="card mt-8 !p-5 md:!p-6">
        <h2 className="label !mb-3">The short answer</h2>
        <ul className="space-y-2 text-[15.5px] leading-relaxed">
          <li><strong>No, not at 15–20 minutes.</strong> The gate door closes 10–15 minutes before departure, so you&apos;d have 5–10 minutes for security and the walk.</li>
          <li><strong>The part it gets right:</strong> the blanket &ldquo;2 hours early&rdquo; is often more than you need.</li>
          <li><strong>The fix:</strong> work backwards from your airline&apos;s cutoffs, your terminal and your hour instead of a rule of thumb.</li>
        </ul>
      </section>

      <GuideSection title="What the trend says">
        <p>
          Airport theory spread on TikTok in early 2025 with tens of millions of views. The claim: show up 15–20 minutes before your flight and you&apos;ll be fine, because airports are rarely as crowded as you fear.
          Interest hasn&apos;t faded: in March 2026, Fox News reported a figure from Holafly showing searches for &ldquo;airport theory&rdquo; up more than 11,000% in a year.
        </p>
        <p>
          The creator most linked to it, Michael DiCostanzo, told The Points Guy he arrives about two hours early himself: &ldquo;All I&apos;ve ever said is that they&apos;re usually less crowded than you think.&rdquo;
        </p>
        <p className="text-[13px] text-ink-3">
          Sources: <a href="https://thepointsguy.com/news/airport-theory-tiktok-trend" target="_blank" rel="noreferrer">The Points Guy</a>,{" "}
          <a href="https://www.newsweek.com/experts-warn-against-viral-tiktok-airport-theory-last-minute-travel-2040282" target="_blank" rel="noreferrer">Newsweek</a>,{" "}
          <a href="https://www.foxnews.com/travel/risky-airport-theory-has-travelers-cutting-arrival-time-flights-way-too-close-says-expert" target="_blank" rel="noreferrer">Fox News</a>.
        </p>
      </GuideSection>

      <GuideSection title="The cutoffs it ignores">
        <FactCards items={CUTOFFS.map((c) => ({ title: c.airline, href: c.url, source: "source", rows: [["Bags close (domestic)", c.bags], ["Gate", c.gate]] }))} />
        <p>
          Security is the variable. TSA says wait times &ldquo;vary depending on the airport and date of travel,&rdquo; and the same checkpoint can be empty at 2 PM and full at 6 AM. Some gates are a 10–14 minute
          walk past security (JFK Terminal 4&apos;s B42–B55, for example; see the <Link href="/airports/jfk">JFK guide</Link>).
        </p>
        <p className="text-[13px] text-ink-3">
          Sources: airline pages linked above; <a href="https://www.tsa.gov/travel/frequently-asked-questions" target="_blank" rel="noreferrer">TSA FAQ</a>.
        </p>
      </GuideSection>

      <GuideSection title="What airlines and experts say">
        <ul>
          <li>TSA, responding to the trend on Instagram in March 2025, said arriving 15–20 minutes before departure means you&apos;re &ldquo;more than likely missing&rdquo; your flight (as reported by Newsweek).</li>
          <li>Air New Zealand&apos;s general manager of airports, Kate Boyer, called it &ldquo;a risky travel &lsquo;hack&rsquo;&rdquo; (The Points Guy).</li>
          <li>Katy Nastro of Going: &ldquo;it can&apos;t hurt to be too early, but it can definitely hurt to be too late&rdquo; (TODAY).</li>
          <li>Gary Leff of View from the Wing: 15 minutes is &ldquo;cutting it way too close,&rdquo; even though he finds airline advice too conservative (Fox News).</li>
        </ul>
        <p className="text-[13px] text-ink-3">
          Sources: <a href="https://www.newsweek.com/experts-warn-against-viral-tiktok-airport-theory-last-minute-travel-2040282" target="_blank" rel="noreferrer">Newsweek</a>,{" "}
          <a href="https://thepointsguy.com/news/airport-theory-tiktok-trend" target="_blank" rel="noreferrer">The Points Guy</a>,{" "}
          <a href="https://www.today.com/life/travel/airport-theory-rcna196235" target="_blank" rel="noreferrer">TODAY</a>,{" "}
          <a href="https://www.foxnews.com/travel/risky-airport-theory-has-travelers-cutting-arrival-time-flights-way-too-close-says-expert" target="_blank" rel="noreferrer">Fox News</a>.
        </p>
      </GuideSection>

      <GuideSection title="A real example">
        <p>
          We ran JetBlue 123, a 6:00 AM flight from JFK Terminal 5 to LAX on Friday, Oct 16, 2026, through Leave By, starting from Williamsburg in Brooklyn. Airport theory says be at the curb by 5:40. Boarding started
          at 5:30. Leave By&apos;s plan said <strong>leave at 3:45 AM</strong>: a 46-minute drive in the rain, 5 minutes from curb to security, about 30 minutes in the security line and a 7-minute walk to the gate,
          plus spare time before boarding. Yours will differ.
        </p>
      </GuideSection>

      <AppCta title="Find your real number" body="Enter your flight and where you're starting. Leave By works backwards from your airline's cutoffs, live traffic and your terminal's security line, and gives you the minute to leave." />

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
          <Link href="/airports">How early to get to the airport: US airport guides</Link> · <Link href="/international-flights">International flights</Link> ·{" "}
          <Link href="/thanksgiving-travel-2026">Thanksgiving 2026</Link> · <Link href="/holiday-travel-2026">Christmas and New Year&apos;s 2026</Link>
        </p>
      </GuideSection>
      <p className="mt-6 text-[12.5px] text-ink-3">Checked October 24, 2026.</p>
    </GuideShell>
  );
}
