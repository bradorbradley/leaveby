import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppCta, GuideSection, GuideShell, JsonLd } from "@/components/GuideShell";
import { allGuides, getGuide, guideCodes, isIntl, nearbyGuides, prettyChecked, type AirportGuide } from "@/lib/guides";
import { SITE } from "@/lib/plan-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return guideCodes().map((code) => ({ code: code.toLowerCase() }));
}

function describe(g: AirportGuide): string {
  const advice = [g.officialArrivalAdvice.domestic, g.officialArrivalAdvice.international].filter(Boolean).join(" ");
  const waits = g.securityWaits.summary ?? "";
  return `${advice || `When to arrive at ${g.code}`} ${waits}`.trim().slice(0, 300);
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const g = getGuide(code);
  if (!g) return {};
  const title = isIntl(g) ? `How early to get to ${g.code} (${g.name}) for a flight to the US · 2026 guide` : `How early to get to ${g.code} (${g.name}) · 2026 guide`;
  return {
    title,
    description: describe(g),
    metadataBase: new URL(SITE),
    alternates: { canonical: `/airports/${g.code.toLowerCase()}` },
    openGraph: { title, description: describe(g), images: [`/api/og?airport=${g.code}`], type: "article", url: `/airports/${g.code.toLowerCase()}` },
    twitter: { card: "summary_large_image", images: [`/api/og?airport=${g.code}`] },
  };
}

function Badge({ on, label }: { on: boolean | null; label: string }) {
  if (on === null) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${on ? "bg-sage-soft text-ink" : "bg-line/60 text-ink-3 line-through"}`}>
      {label}
    </span>
  );
}

export default async function AirportGuidePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const g = getGuide(code);
  if (!g) notFound();
  const nearby = nearbyGuides(g.code);
  const others = allGuides().filter((o) => o.code !== g.code && !nearby.some((n) => n.guide.code === o.code));
  const url = `${SITE}/airports/${g.code.toLowerCase()}`;

  return (
    <GuideShell>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Airport guides", item: `${SITE}/airports` },
              { "@type": "ListItem", position: 2, name: g.code, item: url },
            ],
          },
        ]}
      />
      <nav className="mt-10 text-[13px] text-ink-3">
        <Link href="/airports" className="underline-offset-2 hover:underline">Airport guides</Link> / {g.code}
      </nav>
      <h1 className="display-soft mt-3 text-[38px] leading-[1.04] md:text-[52px]">
        How early should I get to <em className="font-normal italic text-coral">{g.code}</em>?
      </h1>
      <p className="mt-3 text-[14px] text-ink-3">
        {g.name}, {g.city}, {g.state} · Checked {prettyChecked(g.checkedOn)}
      </p>

      <section className="card mt-8 !p-5 md:!p-6">
        <h2 className="label !mb-3">The short answer</h2>
        <div className="space-y-2 text-[16px] leading-relaxed">
          {g.officialArrivalAdvice.domestic ? <p>{g.officialArrivalAdvice.domestic}</p> : null}
          {g.officialArrivalAdvice.international ? <p>{g.officialArrivalAdvice.international}</p> : null}
          {!g.officialArrivalAdvice.domestic && !g.officialArrivalAdvice.international ? (
            <p>{g.code} doesn&apos;t publish a single rule. Most airlines ask for 2 hours domestic and 3 hours international.</p>
          ) : null}
          <p className="text-ink-2">
            {isIntl(g)
              ? "Those are blanket rules. Your real number depends on your terminal, the time of day, passport control and whether you're checking a bag."
              : "Those are blanket rules. Your real number depends on your terminal, the time of day, traffic from your door, and whether you have PreCheck or a bag."}{" "}
            <Link href="/app" className="font-semibold text-ink underline underline-offset-4">Leave By works out your exact leave time</Link>.
          </p>
          {g.officialArrivalAdvice.source ? (
            <p className="text-[12.5px] text-ink-3">
              Source: <a href={g.officialArrivalAdvice.source} target="_blank" rel="noreferrer" className="underline underline-offset-2">{hostOf(g.officialArrivalAdvice.source)}</a>
            </p>
          ) : null}
        </div>
      </section>

      {g.passportControl ? (
        <GuideSection id="passport" title="Passport control on the way out">
          <p>{g.passportControl}</p>
          <p>
            More on exit checks, the EU&apos;s Entry/Exit System and US preclearance: <Link href="/international-flights">how early for an international flight</Link>.
          </p>
        </GuideSection>
      ) : null}

      {g.securityWaits.summary || g.precheckNotes || g.touchlessId || g.clearAvailable !== null ? (
        <GuideSection id="security" title={`Security lines at ${g.code}`}>
          {g.securityWaits.summary ? <p>{g.securityWaits.summary}</p> : null}
          {g.securityWaits.busiestTimes.length ? <p><strong>Busiest times:</strong> {g.securityWaits.busiestTimes.join(", ")}.</p> : null}
          {!isIntl(g) ? (
            <p>
              Nationally, TSA checkpoints are busiest from 5 to 7 AM local time. See <Link href="/tsa-busiest-times">TSA&apos;s hourly numbers</Link> and{" "}
              <Link href="/busiest-travel-days">the busiest days to fly</Link>.
            </p>
          ) : null}
          {g.precheckNotes ? <p><strong>TSA PreCheck:</strong> {g.precheckNotes}</p> : null}
          {g.clearAvailable !== null ? <p><strong>CLEAR:</strong> {g.clearAvailable ? "Available at this airport (see terminals below for which checkpoints)." : "Not available at this airport."}</p> : null}
          {g.touchlessId ? <p><strong>Touchless ID:</strong> {g.touchlessId}</p> : null}
        </GuideSection>
      ) : null}

      {g.terminals.length ? (
        <GuideSection id="terminals" title="Terminals and checkpoints">
          <div className="not-prose space-y-3">
            {g.terminals.map((t) => (
              <div key={t.id} className="rounded-[18px] border border-line bg-paper p-4">
                <p className="font-semibold text-ink">{t.name}</p>
                {t.airlines.length ? <p className="mt-1 text-[14px]">{t.airlines.join(", ")}</p> : null}
                {t.checkpoints.map((c) => (
                  <div key={c.name} className="mt-2 flex flex-wrap items-center gap-1.5 text-[14px]">
                    <span>{c.name}</span>
                    <Badge on={c.precheck} label="PreCheck" />
                    <Badge on={c.clear} label="CLEAR" />
                    {c.notes ? <span className="w-full text-[13px] text-ink-3">{c.notes}</span> : null}
                  </div>
                ))}
                {t.notes.length ? (
                  <ul className="mt-2 text-[13.5px]">
                    {t.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
          {g.betweenTerminals ? <p><strong>Between terminals:</strong> {g.betweenTerminals}</p> : null}
          {g.connectedAirside !== null ? (
            <p>{g.connectedAirside ? "Terminals are connected after security, so you can walk between them without re-screening." : "Terminals are not connected after security. Go to the right terminal the first time."}</p>
          ) : null}
        </GuideSection>
      ) : null}

      {g.gettingThere.rideshare || g.gettingThere.transit || g.gettingThere.driving ? (
        <GuideSection id="getting-there" title={`Getting to ${g.code}`}>
          {g.gettingThere.rideshare ? <p><strong>Rideshare and taxi:</strong> {g.gettingThere.rideshare}</p> : null}
          {g.gettingThere.transit ? <p><strong>Transit:</strong> {g.gettingThere.transit}</p> : null}
          {g.gettingThere.driving ? <p><strong>Driving and parking:</strong> {g.gettingThere.driving}</p> : null}
        </GuideSection>
      ) : null}

      {g.construction2026.length ? (
        <GuideSection id="construction" title="Construction and changes in 2026">
          <ul>{g.construction2026.map((c) => <li key={c}>{c}</li>)}</ul>
        </GuideSection>
      ) : null}

      {g.bagDrop ? (
        <GuideSection id="bags" title="Checking a bag">
          <p>{g.bagDrop}</p>
        </GuideSection>
      ) : null}

      {g.tips.length ? (
        <GuideSection id="tips" title={`${g.code} tips first-timers miss`}>
          <ul>{g.tips.map((t) => <li key={t}>{t}</li>)}</ul>
        </GuideSection>
      ) : null}

      <AppCta title={`Leaving for ${g.code}?`} body="Pick your flight and where you're starting. Leave By checks live traffic, security lines and your terminal, and tells you the minute to walk out the door." />

      {g.faq.length ? (
        <GuideSection id="faq" title="Questions travelers ask">
          {g.faq.map((f) => (
            <div key={f.q}>
              <p className="font-semibold text-ink">{f.q}</p>
              <p>{f.a}</p>
            </div>
          ))}
        </GuideSection>
      ) : null}

      <GuideSection id="sources" title="Sources">
        <ul className="text-[13.5px]">
          {g.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">{s.title || hostOf(s.url)}</a>
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-ink-3">Airport conditions change. Always follow your airline&apos;s check-in and bag-drop deadlines.</p>
      </GuideSection>

      {nearby.length ? (
        <GuideSection id="nearby" title={`Other airports near ${g.city}`}>
          <div className="not-prose grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {nearby.map(({ guide: n, km }) => (
              <Link key={n.code} href={`/airports/${n.code.toLowerCase()}`} className="card flex items-center gap-4 !p-4 !no-underline transition-transform hover:-translate-y-0.5">
                <span className="font-display text-[24px] font-semibold text-ink">{n.code}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-ink">{n.name}</span>
                  <span className="block text-[12.5px] text-ink-3">{Math.round(km * 0.621)} miles away · how early to get there</span>
                </span>
              </Link>
            ))}
          </div>
        </GuideSection>
      ) : null}

      <GuideSection title="Other airport guides">
        <p className="flex flex-wrap gap-2">
          {others.map((o) => (
            <Link key={o.code} href={`/airports/${o.code.toLowerCase()}`} className="chip !min-h-[34px] !px-3 !text-[12.5px] no-underline">
              {o.code}
            </Link>
          ))}
        </p>
      </GuideSection>
    </GuideShell>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
