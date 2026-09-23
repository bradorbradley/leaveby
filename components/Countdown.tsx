"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** "2d 5h 12m", "5h 12m 08s", "42m 08s" — days drop the seconds so it doesn't flicker for no reason. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${pad(m)}m`;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(sec)}s`;
  return `${m}m ${pad(sec)}s`;
}

/** Live countdown to the leave time. Ticks once a second on its own so the rest of the reveal doesn't re-render. */
export function Countdown({ toISO, className = "" }: { toISO: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [toISO]);

  const remaining = (new Date(toISO).getTime() - now) / 1000;
  const past = remaining <= 0;
  const soon = !past && remaining <= 20 * 60;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold tabular-nums ${
        past ? "bg-coral text-paper" : soon ? "bg-ink text-paper" : "border border-line bg-paper/80 text-ink backdrop-blur"
      } ${className}`}
      role="timer"
      aria-live="off"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${past ? "bg-paper" : soon ? "bg-mustard-soft animate-pulse" : "bg-coral"}`} aria-hidden="true" />
      {past ? `Leave now · ${formatCountdown(-remaining)} ago` : `in ${formatCountdown(remaining)}`}
    </div>
  );
}
