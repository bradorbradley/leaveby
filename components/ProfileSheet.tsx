"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { GateSlider } from "@/components/GateSlider";
import { OriginField } from "@/components/OriginField";
import type { Profile } from "@/lib/profile";
import type { Perks } from "@/types/plan";

const perkOptions: Array<{ key: keyof Perks; label: string }> = [
  { key: "precheck", label: "TSA PreCheck" },
  { key: "clear", label: "CLEAR" },
  { key: "globalEntry", label: "Global Entry" },
  { key: "touchlessId", label: "Touchless ID" },
];

export function ProfileSheet({
  open,
  profile,
  onChange,
  onForget,
  onClose,
}: {
  open: boolean;
  profile: Profile;
  onChange: (p: Profile) => void;
  onForget: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-30 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="Saved on this phone"
            className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] rounded-t-[28px] bg-ground px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 shadow-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[22px] font-black">Saved on this phone</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-paper">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <span className="label">Home</span>
                <OriginField
                  id="home"
                  value={profile.home ? { label: profile.home.label, lat: profile.home.lat, lon: profile.home.lon } : null}
                  onChange={(v) =>
                    onChange({
                      ...profile,
                      home: v && typeof v.lat === "number" && typeof v.lon === "number" ? { label: v.label ?? "Home", lat: v.lat, lon: v.lon } : null,
                    })
                  }
                  placeholder="Home address"
                />
              </div>
              <div>
                <span className="label">Skip the line</span>
                <div className="flex flex-wrap gap-2">
                  {perkOptions.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className="chip"
                      aria-pressed={profile.perks[p.key]}
                      onClick={() => onChange({ ...profile, perks: { ...profile.perks, [p.key]: !profile.perks[p.key] } })}
                    >
                      {profile.perks[p.key] ? <span className="text-sage-deep">✓</span> : null}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <GateSlider id="gate-default" compact value={profile.bufferMinutes} onChange={(bufferMinutes) => onChange({ ...profile, bufferMinutes })} />
              <button type="button" onClick={onForget} className="text-[13.5px] font-semibold text-blush-deep">
                Forget everything
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
