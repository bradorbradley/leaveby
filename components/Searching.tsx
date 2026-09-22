"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Car, Plane, Search } from "lucide-react";

import { Mark } from "@/components/Mark";
import { fmtTimeShort } from "@/lib/format";
import type { Progress } from "@/hooks/usePlan";

export function Searching({ progress, flightNumber, onCancel }: { progress: Progress; flightNumber: string; onCancel: () => void }) {
  const f = progress.flight;
  const tz = f?.departureTimezone ?? "America/New_York";
  const rows: Array<{ key: string; icon: React.ReactNode; text: string; done?: boolean }> = [];
  if (f) {
    rows.push({
      key: "flight",
      icon: <Plane className="h-4 w-4" />,
      text: `${f.flightNumber} · ${f.departureAirport}${f.terminal ? ` Terminal ${f.terminal}` : ""} · ${fmtTimeShort(f.departureTime, tz)}`,
      done: true,
    });
  }
  if (progress.route) {
    const r = progress.route;
    const short = r.originLabel?.split(",")[0]?.trim();
    rows.push({
      key: "route",
      icon: <Car className="h-4 w-4" />,
      text: short ? (r.freeFlowMinutes ? `From ${short} · ${r.freeFlowMinutes} min, no traffic` : `From ${short}`) : "No starting point, using a typical trip",
      done: true,
    });
  }
  for (const [i, q] of progress.searches.slice(-6).entries()) {
    rows.push({ key: `s-${progress.searches.length - 6 + i}-${q}`, icon: <Search className="h-4 w-4" />, text: q });
  }

  return (
    <div className="flex flex-1 flex-col items-center pt-8 text-center">
      <div className="relative mb-6 mt-2">
        <span className="absolute -inset-4 animate-[spin_18s_linear_infinite] rounded-full border-2 border-dashed border-lilac-deep/40" />
        <Mark size={104} className="animate-bob" />
      </div>
      <h2 className="text-[26px] font-black leading-tight">{f ? `Checking ${f.departureAirport} right now` : `Finding ${flightNumber}`}</h2>
      <p className="mt-1 text-[14px] text-ink-2">About a minute. It&apos;s a real search.</p>

      <ul className="mt-6 flex w-full flex-col gap-2 text-left">
        <AnimatePresence initial={false}>
          {rows.map((row, i) => {
            const live = !row.done && i === rows.length - 1;
            return (
              <motion.li
                key={row.key}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className={`card flex items-center gap-2.5 !py-2.5 text-[13.5px] ${row.done ? "" : live ? "" : "opacity-60"}`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${row.done ? "bg-sage text-sage-deep" : "bg-lilac text-lilac-deep"}`}
                >
                  {row.done ? "✓" : row.icon}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{row.text}</span>
                {live ? <span className="h-2 w-2 shrink-0 animate-pulse2 rounded-full bg-lilac-deep" /> : null}
              </motion.li>
            );
          })}
        </AnimatePresence>
        {!rows.length ? (
          <li className="card flex items-center gap-2.5 !py-2.5 text-[13.5px] text-ink-2">
            <span className="h-2 w-2 animate-pulse2 rounded-full bg-lilac-deep" /> Looking up the flight
          </li>
        ) : null}
      </ul>

      <button type="button" onClick={onCancel} className="mt-8 text-[14px] font-semibold text-ink-3">
        Never mind
      </button>
    </div>
  );
}
