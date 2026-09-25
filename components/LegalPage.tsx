import Link from "next/link";

import { Mark } from "@/components/Mark";
import { LEGAL } from "@/lib/legal";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Shared frame for the Terms and Privacy pages: a plain-language summary up top, then the full text. */
export function LegalPage({ title, summary, sections }: { title: string; summary: React.ReactNode; sections: LegalSection[] }) {
  return (
    <main className="relative z-[1] mx-auto w-full max-w-[720px] px-5 pb-20 md:px-8" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-display text-[21px] font-semibold tracking-[-0.01em]">
          <Mark size={22} /> Leave By
        </Link>
        <Link href="/app" className="btn-dark !min-h-[40px] !px-4 !text-[13px]">
          Open the app
        </Link>
      </header>

      <h1 className="display-soft mt-12 text-[40px] leading-[1.02] md:text-[56px]">{title}</h1>
      <p className="mt-3 text-[14px] text-ink-3">Effective {LEGAL.effective}</p>

      <section className="card mt-8 !p-5 md:!p-6">
        <h2 className="label !mb-3">The short version</h2>
        <div className="legal space-y-3 text-[15.5px] leading-relaxed text-ink-2">{summary}</div>
      </section>

      <nav aria-label="Sections" className="mt-8 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip !min-h-[34px] !px-3 !text-[12.5px]">
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-6">
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em]">
              {i + 1}. {s.title}
            </h2>
            <div className="legal mt-3 space-y-3 text-[15.5px] leading-relaxed text-ink-2">{s.body}</div>
          </section>
        ))}
      </div>

      <LegalFooter className="mt-16" />
    </main>
  );
}

export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`flex flex-col items-center gap-2 text-center text-[12.5px] text-ink-3 ${className}`}>
      <p className="max-w-[46ch]">Leave By gives estimates, not guarantees. Always follow your airline’s check-in, bag drop and boarding deadlines.</p>
      <p className="flex items-center gap-3">
        <Link href="/terms" className="underline-offset-2 hover:underline">
          Terms
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy" className="underline-offset-2 hover:underline">
          Privacy
        </Link>
        <span aria-hidden="true">·</span>
        <a href={`mailto:${LEGAL.contactEmail}`} className="underline-offset-2 hover:underline">
          Contact
        </a>
      </p>
      <p>© 2026 {LEGAL.product}</p>
    </footer>
  );
}
