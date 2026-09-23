"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Checks } from "@/components/landing/Checks";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { Rise } from "@/components/landing/Rise";
import { useMounted } from "@/components/landing/useMounted";
import { Mark, STAR } from "@/components/Mark";

function Cta({ className = "" }: { className?: string }) {
  return (
    <Link href="/app" className={`btn-primary !w-auto px-7 ${className}`}>
      Find my time <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function Landing() {
  const reduce = useReducedMotion();
  const mounted = useMounted();
  const { scrollY } = useScroll();
  const [docked, setDocked] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => {
    const nearEnd = v + window.innerHeight > document.documentElement.scrollHeight - 520;
    setDocked(v > 640 && !nearEnd);
  });
  const enter = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 200, damping: 26, delay },
  });

  return (
    <main className="relative z-[1] mx-auto w-full max-w-[1080px] overflow-x-clip px-5 pb-16 md:px-8" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
      <motion.header {...enter(0)} className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-display text-[21px] font-semibold tracking-[-0.01em]">
          <Mark size={22} spin /> Leave By
        </div>
        <Link href="/app" className="btn-dark !min-h-[42px] !px-5 !text-[13.5px]">
          Open the app
        </Link>
      </motion.header>

      <section className="grid grid-cols-1 items-center gap-10 pt-12 md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:pt-20 [&>*]:min-w-0">
        <div>
          <motion.h1 {...enter(0.04)} className="display-soft text-[46px] leading-[0.98] md:text-[72px]">
            Never worry about missing a <em className="font-normal italic text-coral">flight</em> again.
          </motion.h1>
          <motion.p {...enter(0.12)} className="mt-6 max-w-[40ch] text-[17px] leading-relaxed text-ink-2 md:text-[19px]">
            Leave By finds the exact time you need to leave, based on your flight, your preferences, and live data on your commute.
          </motion.p>
          <motion.div {...enter(0.2)} className="mt-8 flex flex-wrap items-center gap-4">
            <Cta />
            <p className="text-[13.5px] font-medium text-ink-3">Free. No account.</p>
          </motion.div>
        </div>
        <motion.div initial={reduce ? false : { opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 160, damping: 24, delay: 0.2 }} className="relative">
          <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute -left-6 top-6 h-24 w-24 text-coral-pale md:-left-10 md:h-32 md:w-32">
            <motion.path d={STAR} fill="currentColor" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} style={{ originX: "50px", originY: "50px" }} />
          </svg>
          <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute -right-4 bottom-10 h-16 w-16 text-mustard-soft md:-right-8 md:h-24 md:w-24">
            <motion.path d={STAR} fill="currentColor" animate={reduce ? undefined : { rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} style={{ originX: "50px", originY: "50px" }} />
          </svg>
          {mounted ? <HeroDemo /> : <div className="mx-auto h-[660px] w-[332px] max-w-full rounded-[46px] border-[7px] border-ink bg-ground" />}
        </motion.div>
      </section>

      <section className="pt-24 md:pt-36">
        <Rise className="mb-8 md:mb-12">
          <h2 className="display-soft text-[36px] leading-[1.02] md:text-[54px]">What we check</h2>
        </Rise>
        {mounted ? <Checks /> : null}
      </section>

      <section className="pt-24 md:pt-36">
        <Rise>
          <div
            className="relative overflow-hidden rounded-[32px] px-6 py-14 text-center text-paper md:py-20"
            style={{ backgroundImage: "linear-gradient(180deg, #2e2f44 0%, var(--ink) 55%, #16172a 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 40px 80px -40px rgba(31,32,48,0.7)" }}
          >
            <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute -left-10 -top-10 h-44 w-44 text-coral opacity-90">
              <motion.path d={STAR} fill="currentColor" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} style={{ originX: "50px", originY: "50px" }} />
            </svg>
            <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute -bottom-12 -right-8 h-40 w-40 text-mustard opacity-90">
              <motion.path d={STAR} fill="currentColor" animate={reduce ? undefined : { rotate: -360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} style={{ originX: "50px", originY: "50px" }} />
            </svg>
            <div className="relative">
              <h2 className="display-soft mx-auto max-w-[14ch] text-[38px] leading-[1.02] text-paper md:text-[60px]">
                Know exactly when to <em className="font-normal italic text-coral-soft">leave.</em>
              </h2>
              <div className="mt-8 flex justify-center">
                <Link href="/app" className="btn-secondary !min-h-[58px] !border-transparent !px-8 !text-[16.5px]">
                  Find my time <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Rise>
        <footer className="mt-10 flex justify-center text-[13px] text-ink-3">
          <span className="flex items-center gap-2">
            <Mark size={16} /> Leave By
          </span>
        </footer>
      </section>

      <AnimatePresence>
        {docked ? (
          <motion.div
            key="dock"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="fixed inset-x-0 z-30 flex justify-center px-5 md:hidden"
            style={{ bottom: "max(env(safe-area-inset-bottom), 16px)" }}
          >
            <Cta className="!min-h-[54px] shadow-cta" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
