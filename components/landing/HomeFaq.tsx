import Link from "next/link";

import { HOME_FAQ } from "@/lib/home-faq";

const POPULAR = ["JFK", "LGA", "EWR", "LAX", "ORD", "ATL", "DEN", "SFO"];

/** Plain questions and links, rendered on the server so crawlers that don't run JavaScript still read them. */
export function HomeFaq() {
  return (
    <section className="pt-24 md:pt-36">
      <h2 className="display-soft text-[36px] leading-[1.02] md:text-[54px]">Questions</h2>
      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        {HOME_FAQ.map(({ q, a }) => (
          <details key={q} className="card group !p-5">
            <summary className="cursor-pointer list-none font-display text-[19px] font-semibold tracking-[-0.01em] marker:hidden">{q}</summary>
            <p className="mt-2.5 text-[15.5px] leading-relaxed text-ink-2">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-[15px] leading-relaxed text-ink-2">
        Airport guides:{" "}
        {POPULAR.map((c, i) => (
          <span key={c}>
            <Link href={`/airports/${c.toLowerCase()}`} className="font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-coral">
              {c}
            </Link>
            {i < POPULAR.length - 1 ? " · " : ""}
          </span>
        ))}
        {" · "}
        <Link href="/airports" className="font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-coral">
          all airports
        </Link>
        {" · "}
        <Link href="/thanksgiving-travel-2026" className="font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-coral">
          Thanksgiving 2026
        </Link>
        {" · "}
        <Link href="/holiday-travel-2026" className="font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-coral">
          Christmas and New Year&apos;s
        </Link>
        {" · "}
        <Link href="/busiest-travel-days" className="font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-coral">
          busiest days to fly
        </Link>
        {" · "}
        <Link href="/tsa-busiest-times" className="font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-coral">
          busiest time of day
        </Link>
        {" · "}
        <Link href="/international-flights" className="font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-coral">
          international flights
        </Link>
        {" · "}
        <Link href="/airport-theory" className="font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-coral">
          airport theory
        </Link>
      </p>
    </section>
  );
}
