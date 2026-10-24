import type { Metadata } from "next";
import Link from "next/link";

import { AppCta, FactCards, GuideSection, GuideShell, JsonLd } from "@/components/GuideShell";
import { SITE } from "@/lib/plan-metadata";

const TITLE = "How early to get to the airport for an international flight";
const DESCRIPTION =
  "Airlines recommend 3 hours, but the hard limit is the check-in and bag cutoff, usually 60 minutes before departure. Here's what changes leaving the US, flying home from Europe with the new EU border system, the UK and US preclearance.";

export const metadata: Metadata = {
  title: `${TITLE} (2026) · Leave By`,
  description: DESCRIPTION,
  metadataBase: new URL(SITE),
  alternates: { canonical: "/international-flights" },
  openGraph: { title: TITLE, description: DESCRIPTION, images: ["/api/og"], type: "article", url: "/international-flights" },
  twitter: { card: "summary_large_image", images: ["/api/og"] },
};

const CUTOFFS: Array<{ airline: string; arrive: string; checkin: string; gate: string; source: { title: string; url: string } }> = [
  {
    airline: "Delta",
    arrive: "3 hours",
    checkin: "60 min (75–120 min at some airports, e.g. Dublin, Toronto, Frankfurt, Athens)",
    gate: "At the gate 45 min before (recommended)",
    source: { title: "delta.com", url: "https://www.delta.com/us/en/check-in-security/check-in-time-requirements/international-check-in" },
  },
  {
    airline: "JetBlue",
    arrive: "Varies by airport",
    checkin: "60 min (80 min from Dublin)",
    gate: "On board 20 min before",
    source: { title: "jetblue.com", url: "https://www.jetblue.com/help/checking-in/airport-check-in" },
  },
  {
    airline: "Southwest",
    arrive: "No fixed time",
    checkin: "60 min (75 min at Aruba)",
    gate: "In the gate area 10 min before",
    source: { title: "southwest.com", url: "https://support.southwest.com/helpcenter/article/airport-arrival-recommendation" },
  },
  {
    airline: "United",
    arrive: "Not checked",
    checkin: "60 min",
    gate: "Not checked",
    source: { title: "NBC Chicago", url: "https://www.nbcchicago.com/news/local/united-airlines-check-in-cutoff-time-just-changed-heres-how-early-you-now-need-to-check-in-for-your-flight/3758944/" },
  },
  {
    airline: "American",
    arrive: "Not checked",
    checkin: "60 min",
    gate: "Not checked",
    source: { title: "AP", url: "https://www.clickondetroit.com/business/2025/05/27/united-is-narrowing-its-check-in-window-for-us-flights-heres-how-it-compares-to-other-airlines/" },
  },
];

const FAQ = [
  {
    q: "How early should I get to the airport for an international flight?",
    a: "Delta and most airlines recommend arriving 3 hours before an international departure. The hard limit is the airline's check-in and bag-drop cutoff, which is 60 minutes before departure at Delta, United, American, JetBlue and Southwest, and earlier at some airports (Delta: 75 minutes at Dublin, Toronto and Frankfurt, 120 minutes at Athens). How much time you need before that cutoff depends on traffic, the bag-drop line, security and, leaving Europe, passport control.",
  },
  {
    q: "Is there passport control when leaving the US?",
    a: "No. US airports have no exit passport control. CBP confirms departures by matching faces at the boarding gate at many airports, so leaving the US you only clear TSA security. You do need your passport: a REAL ID can't be used for international travel.",
  },
  {
    q: "How long does passport control take leaving Europe in 2026?",
    a: "Longer than before. The EU's Entry/Exit System (EES), fully operational since April 10, 2026, registers fingerprints and a photo for non-EU travelers at the Schengen border, including on exit. A Financial Times study reported by Euronews put Frankfurt's July 2026 wait at 120 minutes, up from 60 a year earlier, and European airline and airport groups said in October 2026 that peak waits still routinely exceed two hours at the worst-affected airports.",
  },
  {
    q: "Do I need an ETA to fly to the UK from the US?",
    a: "Yes. Since February 25, 2026, US citizens need a UK Electronic Travel Authorisation (£20, valid two years) before travel, and airlines won't board you without one. Leaving the UK there's no passport control; the airline sends your details.",
  },
  {
    q: "What is US preclearance?",
    a: "At 16 airports, including Dublin, Shannon, Toronto, Vancouver, Montreal, Calgary, Nassau, Bermuda, Aruba and Abu Dhabi, you clear US immigration and customs before you board, so you arrive in the US as a domestic passenger. It adds a step before departure, so allow for it: Delta recommends arriving 4 hours early at Dublin.",
  },
];

export default function InternationalFlights() {
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
        How early to get to the airport for an <em className="font-normal italic text-coral">international</em> flight
      </h1>
      <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-ink-2">{DESCRIPTION}</p>

      <section className="card mt-8 !p-5 md:!p-6">
        <h2 className="label !mb-3">The short answer</h2>
        <ul className="space-y-2 text-[15.5px] leading-relaxed">
          <li><strong>Plan on 3 hours</strong> before departure. That's Delta's recommendation and the usual airline advice.</li>
          <li><strong>Never miss the cutoff:</strong> most US airlines close international check-in and bag drop <strong>60 minutes</strong> before departure, and some airports close earlier.</li>
          <li><strong>Leaving the Schengen area</strong> (most of Europe), add passport control. The EU&apos;s new border system has made it much slower at some airports.</li>
          <li><strong>Leaving the US or the UK</strong> there&apos;s no passport control, just security.</li>
        </ul>
      </section>

      <GuideSection title="Airline cutoffs for international flights">
        <FactCards
          items={CUTOFFS.map((c) => ({
            title: c.airline,
            href: c.source.url,
            source: c.source.title,
            rows: [["Recommended arrival", c.arrive], ["Check-in and bags close", c.checkin], ["Gate", c.gate]],
          }))}
        />
        <p className="text-[13px] text-ink-3">
          &ldquo;Not checked&rdquo; means we couldn&apos;t verify it on the airline&apos;s own site. United and American figures are from news coverage of their May 2025 policy. Always check your airline&apos;s page for your
          airport.
        </p>
      </GuideSection>

      <GuideSection title="Leaving the US">
        <p>
          There&apos;s no exit passport control at US airports. CBP says airports &ldquo;were not designed or built to control exit&rdquo;; instead, departures are confirmed by face matching at the boarding gate at
          many airports. So the steps are the same as a domestic trip: check in and drop bags before the 60-minute cutoff, clear TSA, and get to the gate early: Delta asks international travelers to be at the gate 45 minutes before departure.
        </p>
        <p>
          Bring your passport. TSA says a REAL ID can&apos;t be used for international travel.
        </p>
        <p className="text-[13px] text-ink-3">
          Sources:{" "}
          <a href="https://www.cbp.gov/sites/default/files/assets/documents/2018-Jan/fieldops-entry-exit-fact-sheet-201404.pdf" target="_blank" rel="noreferrer">CBP entry/exit fact sheet</a>,{" "}
          <a href="https://www.cbp.gov/travel/biometrics/environments/airports" target="_blank" rel="noreferrer">CBP biometrics</a>,{" "}
          <a href="https://www.tsa.gov/real-id/real-id-faqs" target="_blank" rel="noreferrer">TSA REAL ID FAQ</a>.
        </p>
      </GuideSection>

      <GuideSection id="europe" title="Flying home from Europe: the Entry/Exit System">
        <p>
          The EU&apos;s <strong>Entry/Exit System (EES)</strong> started on October 12, 2025 and became fully operational on April 10, 2026. It replaces passport stamps: non-EU travelers, including Americans, have
          their fingerprints and a photo taken at the Schengen border, and every entry and exit is logged. That means passport control on the way out of the Schengen area now takes longer.
        </p>
        <ul>
          <li>
            A Financial Times study reported by Euronews put July 2026 waits at <strong>120 minutes in Frankfurt</strong> (up from 60), 120 in Amsterdam (up from 80) and 60 in Munich (up from 31). The European Commission
            says a registration takes 70 seconds on average.
          </li>
          <li>
            On October 12, 2026, European airline and airport groups said waits were &ldquo;still routinely exceeding two hours&rdquo; and up to five hours at peak in the most extreme cases. The EU says long queues are
            limited to about 20 difficult spots.
          </li>
          <li>The EU&apos;s separate travel authorisation, ETIAS, is not operating yet and has no announced start date.</li>
        </ul>
        <p>
          Passport control sits between check-in and your gate, so a long line there can cost you the flight. If you&apos;re flying home from Frankfurt, Amsterdam or another big hub, give it real time.
        </p>
        <p className="text-[13px] text-ink-3">
          Sources:{" "}
          <a href="https://home-affairs.ec.europa.eu/news/entryexit-system-will-become-fully-operational-10-april-2026-2026-03-30_en" target="_blank" rel="noreferrer">European Commission</a>,{" "}
          <a href="https://home-affairs.ec.europa.eu/policies/schengen/smart-borders/entry-exit-system_en" target="_blank" rel="noreferrer">EES</a>,{" "}
          <a href="https://www.euronews.com/travel/2026/08/12/europes-new-border-system-is-causing-huge-airport-queues-as-ees-wait-times-double" target="_blank" rel="noreferrer">Euronews</a>,{" "}
          <a href="https://www.a4e.eu/news/no-end-to-schengen-ees-disruption-unless-the-commission-and-members-states-fix-structural-issues" target="_blank" rel="noreferrer">A4E and ACI Europe</a>,{" "}
          <a href="https://www.iamexpat.de/expat-info/germany-news/aviation-groups-say-ees-still-causing-chaos-and-5-hour-delays" target="_blank" rel="noreferrer">IamExpat</a>,{" "}
          <a href="https://home-affairs.ec.europa.eu/policies/schengen/smart-borders_en" target="_blank" rel="noreferrer">ETIAS status</a>.
        </p>
      </GuideSection>

      <GuideSection title="The UK">
        <p>
          Leaving the UK there&apos;s no passport desk: the airline collects your details and sends them to the Home Office. Flying <em>to</em> the UK, US citizens have needed an <strong>Electronic Travel
          Authorisation</strong> since February 25, 2026. It costs £20, lasts two years, and without it you can&apos;t board.
        </p>
        <p className="text-[13px] text-ink-3">
          Sources:{" "}
          <a href="https://www.gov.uk/government/publications/exit-checks-on-passengers-leaving-the-uk/exit-checks-fact-sheet" target="_blank" rel="noreferrer">GOV.UK exit checks</a>,{" "}
          <a href="https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta" target="_blank" rel="noreferrer">GOV.UK ETA</a>.
        </p>
      </GuideSection>

      <GuideSection title="US preclearance: customs before you fly">
        <p>
          At 16 airports you clear US immigration and customs before you board and land in the US as a domestic passenger: Toronto Pearson, Toronto Billy Bishop, Montreal, Ottawa, Vancouver, Victoria, Calgary,
          Edmonton, Winnipeg, Halifax, Dublin, Shannon, Nassau, Bermuda, Aruba and Abu Dhabi. It&apos;s an extra step on departure day, and airlines set earlier cutoffs there: Delta closes check-in 75 minutes before
          departure at Dublin and Toronto and recommends arriving 4 hours early at Dublin.
        </p>
        <p className="text-[13px] text-ink-3">
          Sources: <a href="https://www.cbp.gov/travel/preclearance" target="_blank" rel="noreferrer">CBP preclearance</a>,{" "}
          <a href="https://www.delta.com/us/en/check-in-security/check-in-time-requirements/international-check-in" target="_blank" rel="noreferrer">Delta</a>.
        </p>
      </GuideSection>

      <GuideSection title="Landing back in the US">
        <p>
          <strong>Global Entry</strong> ($120 for five years, includes TSA PreCheck) speeds up arrival for approved travelers. <strong>Mobile Passport Control</strong> is a free CBP app for US citizens and some
          others: submit your details up to four hours before landing and use the dedicated line at 63 locations.
        </p>
        <p className="text-[13px] text-ink-3">
          Sources: <a href="https://www.cbp.gov/travel/trusted-traveler-programs/global-entry" target="_blank" rel="noreferrer">CBP Global Entry</a>,{" "}
          <a href="https://www.cbp.gov/travel/us-citizens/mobile-passport-control" target="_blank" rel="noreferrer">CBP Mobile Passport Control</a>.
        </p>
      </GuideSection>

      <AppCta
        title="Get the time for your international flight"
        body="Enter your flight number and where you're leaving from. Leave By adds passport control when your route needs it, including EES leaving Europe and US preclearance, and gives you the minute to leave."
      />

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
          <Link href="/airports">How early to get to the airport: US airport guides</Link> · <Link href="/airport-theory">Does airport theory work?</Link> ·{" "}
          <Link href="/thanksgiving-travel-2026">Thanksgiving 2026</Link>
        </p>
      </GuideSection>
      <p className="mt-6 text-[12.5px] text-ink-3">Checked October 24, 2026. Rules change; always confirm with your airline.</p>
    </GuideShell>
  );
}
