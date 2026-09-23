"use client";

import type { ReactNode } from "react";

/** A phone-shaped stage for the real app components. Ink bezel, ground inside, the app's own paper grain. */
export function Phone({ children, height = 640, className = "" }: { children: ReactNode; height?: number; className?: string }) {
  return (
    <div className={`relative mx-auto w-[332px] max-w-full ${className}`}>
      <div
        className="relative overflow-hidden rounded-[46px] border-[7px] border-ink bg-ground"
        style={{
          height,
          backgroundImage: "radial-gradient(120% 80% at 50% -10%, #faf6ef 0%, var(--ground) 60%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 30px 60px -30px rgba(31,32,48,0.55), 0 70px 120px -60px rgba(31,32,48,0.45)",
        }}
      >
        <span aria-hidden="true" className="absolute left-1/2 top-2.5 z-20 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-ink" />
        <div className="relative h-full overflow-hidden px-4 pb-4 pt-11">{children}</div>
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ground to-transparent" />
      </div>
    </div>
  );
}
