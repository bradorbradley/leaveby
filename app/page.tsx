"use client";

import { AnimatePresence, motion } from "framer-motion";
import { UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Mark } from "@/components/Mark";
import { PlanForm, initialValues, toRequest, type FormValues } from "@/components/PlanForm";
import { ProfileSheet } from "@/components/ProfileSheet";
import { Reveal } from "@/components/Reveal";
import { Searching } from "@/components/Searching";
import { usePlan } from "@/hooks/usePlan";
import { clearProfile, defaultProfile, loadProfile, profileIsEmpty, rememberOrigin, saveProfile, type Profile } from "@/lib/profile";

export default function HomePage() {
  const { state, run, cancel, reset } = usePlan();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [values, setValues] = useState<FormValues>(() => initialValues(defaultProfile));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setValues(initialValues(p));
    setLoaded(true);
  }, []);

  const updateProfile = useCallback((p: Profile) => {
    setProfile(p);
    saveProfile(p);
  }, []);

  const patch = (partial: Partial<FormValues>) => setValues((v) => ({ ...v, ...partial }));

  const submit = () => {
    const request = toRequest(values, state.phase === "notfound");
    // Remember what the traveler set, so next time is one tap shorter.
    let next: Profile = { ...profile, perks: values.perks, bufferMinutes: values.bufferMinutes };
    const o = values.origin;
    if (o && typeof o.lat === "number" && typeof o.lon === "number" && o.label) next = rememberOrigin(next, { label: o.label, lat: o.lat, lon: o.lon });
    updateProfile(next);
    void run(request);
  };

  const startOver = () => {
    reset();
    setValues((v) => ({ ...initialValues(profile), flightNumber: "", origin: v.origin }));
  };

  const phase = state.phase;
  const showForm = phase === "idle" || phase === "notfound" || phase === "error";

  return (
    <main className="shell">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-[19px] font-black tracking-tight">
          <Mark /> Leave By
        </div>
        <button
          type="button"
          aria-label="Saved on this phone"
          onClick={() => setSheetOpen(true)}
          className={`grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-line ${loaded && !profileIsEmpty(profile) ? "bg-blush" : "bg-paper"}`}
        >
          <UserRound className="h-4 w-4" />
        </button>
      </header>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div key="form" className="flex flex-1 flex-col" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {phase === "error" && state.error ? (
              <div className="mb-3 rounded-[18px] bg-blush px-4 py-3 text-[14px] font-semibold">{state.error}</div>
            ) : null}
            <PlanForm values={values} onChange={patch} onSubmit={submit} profile={profile} notFound={phase === "notfound" ? state.error : null} />
          </motion.div>
        ) : null}
        {phase === "searching" ? (
          <motion.div key="searching" className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Searching progress={state.progress} flightNumber={values.flightNumber} onCancel={cancel} />
          </motion.div>
        ) : null}
        {phase === "done" && state.result ? (
          <motion.div key="done" className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Reveal
              result={state.result}
              onReset={startOver}
              onBuffer={(bufferMinutes) => {
                setValues((v) => ({ ...v, bufferMinutes }));
                updateProfile({ ...profile, bufferMinutes });
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ProfileSheet
        open={sheetOpen}
        profile={profile}
        onChange={(p) => {
          updateProfile(p);
          setValues((v) => ({ ...v, perks: p.perks, bufferMinutes: p.bufferMinutes, origin: v.origin ?? (p.home ? { ...p.home } : null) }));
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
