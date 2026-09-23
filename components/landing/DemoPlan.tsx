"use client";

import { motion } from "framer-motion";
import { BellRing, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Confetti } from "@/components/Confetti";
import { Countdown } from "@/components/Countdown";
import { CarGlyph, PlaneFlight } from "@/components/Glyphs";
import { Geometry } from "@/components/Mark";
import { RollingNumber } from "@/components/RollingNumber";
import { TiltCard } from "@/components/TiltCard";
import { fmtDay, fmtTime, fmtTimeShort } from "@/lib/format";
import { airlineLogoUrl, dropoffLabel, lyftLink, reminderLink, shareText, uberLink } from "@/lib/ride-links";
import type { PlanResult } from "@/types/plan";

/** The big time. The plane takes off once the digits have landed. */
export function DemoHeroCard({ plan, size = 92, play = true }: { plan: PlanResult; size?: number; play?: boolean }) {
  const tz = plan.flight.departureTimezone ?? "America/Los_Angeles";
  const leave = fmtTime(plan.leaveISO, tz);
  const day = fmtDay(plan.leaveISO, tz);
  const [fly, setFly] = useState(false);
  useEffect(() => {
    if (!play) return;
    setFly(false);
    const t = setTimeout(() => setFly(true), 900);
    return () => clearTimeout(t);
  }, [plan.leaveISO, play]);
  return (
    <TiltCard className="relative overflow-hidden rounded-[28px] border border-line bg-paper px-5 pb-6 pt-7 text-center">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[28px]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 18px 36px -20px rgba(31,32,48,0.35), 0 48px 80px -48px rgba(31,32,48,0.35)" }} />
      <Geometry tone="paper" />
      <PlaneFlight play={fly} />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-2">Leave by</p>
        <div className="display-soft mt-2 flex items-baseline justify-center gap-2 font-display font-semibold leading-none tracking-[-0.03em]" style={{ fontSize: size }}>
          <RollingNumber value={leave.hm} />
          <span className="font-sans text-[18px] font-semibold tracking-[0.06em] text-ink-2">{leave.ampm}</span>
        </div>
        <p className="mt-2 text-[14.5px] text-ink-2">
          <b className="font-semibold text-ink">{day.rel ?? day.pretty}</b>
          {day.rel ? ` · ${day.pretty}` : null}
        </p>
        <div className="mt-3">
          <Countdown toISO={plan.leaveISO} />
        </div>
      </div>
    </TiltCard>
  );
}

export function DemoFlightCard({ plan }: { plan: PlanResult }) {
  const f = plan.flight;
  const tz = f.departureTimezone ?? "America/Los_Angeles";
  const [logoOk, setLogoOk] = useState(true);
  return (
    <div className="card flex items-center gap-3.5">
      {logoOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={airlineLogoUrl(f.airlineCode)} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-[14px] border border-line bg-ground object-contain p-1" onError={() => setLogoOk(false)} />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-ink font-display text-[15px] font-semibold text-paper">{f.airlineCode}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-[19px] font-semibold">{f.flightNumber}</span>
          <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-[11px] font-semibold text-ink">On time</span>
        </div>
        <p className="truncate text-[13.5px] text-ink-2">
          <b className="font-semibold text-ink">{f.departureAirport}</b> → <b className="font-semibold text-ink">{f.destinationAirportCode}</b> · departs{" "}
          <b className="font-semibold text-ink">{fmtTimeShort(f.departureTime, tz)}</b> · T{f.terminal} · Gate {f.gate}
        </p>
      </div>
    </div>
  );
}

/** Real deep links to the real terminal pin. Tap one on your phone and Uber opens with Terminal 7 as the drop-off. */
export function DemoRide({ plan, compact = false }: { plan: PlanResult; compact?: boolean }) {
  const tz = plan.flight.departureTimezone ?? "America/Los_Angeles";
  const pickupISO = new Date(new Date(plan.leaveISO).getTime() - 5 * 60_000).toISOString();
  return (
    <div>
      {compact ? null : (
        <p className="mb-2 text-center text-[13px] text-ink-2">
          Book pickup for <b className="font-semibold text-ink">{fmtTimeShort(pickupISO, tz)}</b>
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <motion.a whileTap={{ scale: 0.97 }} href={uberLink(plan)} target="_blank" rel="noreferrer" className="btn-dark">
          <CarGlyph size={18} drive={false} /> Uber
        </motion.a>
        <motion.a whileTap={{ scale: 0.97 }} href={lyftLink(plan)} target="_blank" rel="noreferrer" className="btn-dark">
          <CarGlyph size={18} drive={false} /> Lyft
        </motion.a>
      </div>
      <p className="mt-2 text-center text-[12.5px] text-ink-3">
        Drop-off <b className="font-semibold text-ink-2">{dropoffLabel(plan)}</b>
      </p>
    </div>
  );
}

export function DemoActions({ plan, planUrl }: { plan: PlanResult; planUrl: string }) {
  const tz = plan.flight.departureTimezone ?? "America/Los_Angeles";
  const [burst, setBurst] = useState(0);
  const [copied, setCopied] = useState(false);
  const share = async () => {
    setBurst((b) => b + 1);
    const text = shareText(plan, fmtTimeShort(plan.leaveISO, tz), plan.bufferMinutes, planUrl);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // user cancelled
    }
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      <motion.a whileTap={{ scale: 0.97 }} href={reminderLink(plan, plan.leaveISO, planUrl)} className="btn-secondary">
        <BellRing className="h-4 w-4" /> Set reminder
      </motion.a>
      <motion.button type="button" onClick={share} whileTap={{ scale: 0.97 }} className="btn-secondary relative">
        <Share2 className="h-4 w-4" /> {copied ? "Copied" : "Share"}
        <Confetti burst={burst} />
      </motion.button>
    </div>
  );
}
