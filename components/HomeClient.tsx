"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Mark } from "@/components/Mark";
import { PlanForm, initialValues, isReady, toRequest, type FormValues, valuesFromRequest } from "@/components/PlanForm";
import { ProfileSheet } from "@/components/ProfileSheet";
import { Reveal } from "@/components/Reveal";
import { Searching } from "@/components/Searching";
import { usePlan } from "@/hooks/usePlan";
import { clearProfile, defaultProfile, loadProfile, profileIsEmpty, rememberOrigin, saveProfile, type Profile } from "@/lib/profile";
import { parsePlanQuery, planQuery } from "@/lib/ride-links";
import { decodeSharedPlanClient, encodeSharedPlan, slimForShare } from "@/lib/share-payload";
import type { PlanRequest, PlanResult } from "@/types/plan";

export function HomeClient() {
  const { state, run, cancel, reset, hydrate } = usePlan();
  const [sharedAt, setSharedAt] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [values, setValues] = useState<FormValues>(() => initialValues(defaultProfile));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastRequest, setLastRequest] = useState<PlanRequest | null>(null);
  const booted = useRef(false);

  const updateProfile = useCallback((p: Profile) => {
    setProfile(p);
    saveProfile(p);
  }, []);

  const launch = useCallback(
    (request: PlanRequest, current: Profile) => {
      let next: Profile = { ...current, perks: request.perks, bufferMinutes: request.bufferMinutes, mode: request.mode ?? current.mode };
      const o = request.origin;
      if (o && typeof o.lat === "number" && typeof o.lon === "number" && o.label) next = rememberOrigin(next, { label: o.label, lat: o.lat, lon: o.lon });
      updateProfile(next);
      setLastRequest(request);
      setSharedAt(null);
      void run(request);
    },
    [run, updateProfile],
  );

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const p = loadProfile();
    setProfile(p);
    // A shared link carries the finished plan (instant) and the inputs (fallback: re-run).
    const search = typeof window !== "undefined" ? window.location.search : "";
    const fromUrl = parsePlanQuery(search);
    const payload = new URLSearchParams(search).get("p");
    const boot = async () => {
      if (payload) {
        const shared = await decodeSharedPlanClient(payload);
        if (shared) {
          setValues(valuesFromRequest(shared.request, p));
          setLastRequest(shared.request);
          setSharedAt(shared.result.generatedAt);
          hydrate(shared.result);
          setLoaded(true);
          return;
        }
      }
      if (fromUrl) {
        setValues(valuesFromRequest(fromUrl, p));
        launch(fromUrl, p);
      } else {
        setValues(initialValues(p));
      }
      setLoaded(true);
    };
    void boot();
  }, [launch, hydrate]);

  // Keep the address bar in sync so the page itself is the shareable link,
  // carrying the finished plan so whoever opens it sees it instantly.
  const [planUrl, setPlanUrl] = useState("");
  useEffect(() => {
    if (state.phase !== "done" || !lastRequest || !state.result) return;
    let cancelled = false;
    const result: PlanResult = state.result;
    (async () => {
      const payload = await encodeSharedPlan(slimForShare(lastRequest, result));
      if (cancelled) return;
      const url = `${window.location.pathname}?${planQuery(lastRequest, payload)}`;
      try {
        window.history.replaceState(null, "", url);
        setPlanUrl(`${window.location.origin}${url}`);
      } catch {
        setPlanUrl("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.phase, state.result, lastRequest]);

  const patch = (partial: Partial<FormValues>) => {
    setValues((v) => ({ ...v, ...partial }));
    if (typeof partial.bufferMinutes === "number") {
      const b = partial.bufferMinutes;
      setLastRequest((r) => (r ? { ...r, bufferMinutes: b } : r));
      setProfile((p) => {
        const next = { ...p, bufferMinutes: b };
        saveProfile(next);
        return next;
      });
    }
  };

  const submit = () => launch(toRequest(values, state.phase === "notfound"), profile);

  const startOver = () => {
    reset();
    setLastRequest(null);
    setSharedAt(null);
    setValues((v) => ({ ...initialValues(profile), origin: v.origin }));
    try {
      window.history.replaceState(null, "", window.location.pathname);
    } catch {
      // ignore
    }
  };

  const phase = state.phase;
  const showForm = phase === "idle" || phase === "notfound" || phase === "error";

  return (
    <main className="shell">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        className="mb-4 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2.5 font-display text-[21px] font-semibold tracking-[-0.01em]">
          <Mark size={22} spin /> Leave By
        </Link>
        <button
          type="button"
          aria-label="Saved on this phone"
          onClick={() => setSheetOpen(true)}
          className={`grid h-10 w-10 place-items-center rounded-full border border-line shadow-card ${loaded && !profileIsEmpty(profile) ? "bg-coral-pale" : "bg-paper"}`}
        >
          <UserRound className="h-4 w-4" />
        </button>
      </motion.header>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div key="form" className="flex flex-1 flex-col" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
            {phase === "error" && state.error ? (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-[18px] bg-coral-pale px-4 py-3 text-[14px] font-medium">
                <span>{state.error}</span>
                {isReady(values, null) ? (
                  <button type="button" onClick={submit} className="shrink-0 rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper">
                    Try again
                  </button>
                ) : null}
              </div>
            ) : null}
            <PlanForm values={values} onChange={patch} onSubmit={submit} profile={profile} notFound={phase === "notfound" ? state.error : null} />
          </motion.div>
        ) : null}
        {phase === "searching" ? (
          <motion.div key="searching" className="flex flex-1 flex-col" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }}>
            <Searching progress={state.progress} flightNumber={values.flightNumber} onCancel={cancel} />
          </motion.div>
        ) : null}
        {phase === "done" && state.result && lastRequest ? (
          <motion.div key="done" className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3 }}>
            <Reveal
              result={state.result}
              request={lastRequest}
              values={values}
              onChange={patch}
              onUpdate={submit}
              profile={profile}
              onReset={startOver}
              planUrl={planUrl}
              sharedAt={sharedAt}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ProfileSheet
        open={sheetOpen}
        profile={profile}
        onChange={(p) => {
          updateProfile(p);
          setValues((v) => ({ ...v, perks: p.perks, mode: p.mode, bufferMinutes: p.bufferMinutes, origin: v.origin ?? (p.home ? { ...p.home } : null) }));
        }}
        onForget={() => {
          clearProfile();
          setProfile(defaultProfile);
          setValues(initialValues(defaultProfile));
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </main>
  );
}
