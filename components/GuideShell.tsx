import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { LegalFooter } from "@/components/LegalPage";
import { Mark } from "@/components/Mark";

/** Frame for the public guide pages: brand header, readable column, a closing call to the app. */
export function GuideShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative z-[1] mx-auto w-full max-w-[760px] px-5 pb-20 md:px-8" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-display text-[21px] font-semibold tracking-[-0.01em]">
          <Mark size={22} /> Leave By
        </Link>
        <Link href="/app" className="btn-dark !min-h-[40px] !px-4 !text-[13px]">
          Open the app
        </Link>
      </header>
      {children}
      <LegalFooter className="mt-16" />
    </main>
  );
}

/** The point of every guide: general advice is a range; your flight gets an exact time. */
export function AppCta({ title, body }: { title: string; body: string }) {
  return (
    <section className="card mt-10 !p-6 text-center">
      <h2 className="font-display text-[24px] font-semibold tracking-[-0.01em]">{title}</h2>
      <p className="mx-auto mt-2 max-w-[46ch] text-[15.5px] leading-relaxed text-ink-2">{body}</p>
      <Link href="/app" className="btn-primary mx-auto mt-5 !w-auto px-7">
        Find my leave time <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="mt-3 text-[12.5px] text-ink-3">Free. No account.</p>
    </section>
  );
}

export function GuideSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-6">
      <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="legal mt-3 space-y-3 text-[15.5px] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
