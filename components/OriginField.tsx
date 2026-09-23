"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Home, LocateFixed, MapPin, Clock, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { SavedPlace } from "@/lib/profile";
import type { OriginInput } from "@/types/plan";

interface Suggestion {
  label: string;
  sub: string;
  lat: number;
  lon: number;
}

export function OriginField({
  value,
  onChange,
  home,
  recents,
  placeholder = "Address or zip",
  id = "origin",
}: {
  value: OriginInput | null;
  onChange: (v: OriginInput | null) => void;
  home?: SavedPlace | null;
  recents?: SavedPlace[];
  placeholder?: string;
  id?: string;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [results, setResults] = useState<Suggestion[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chosen = value && (value.label || typeof value.lat === "number") ? value : null;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
        const json = (await r.json()) as { results: Suggestion[] };
        setResults(json.results ?? []);
      } catch {
        setResults([]);
      }
    }, 220);
  }, [text]);

  const pick = (place: { label: string; lat: number; lon: number }) => {
    onChange({ label: place.label, lat: place.lat, lon: place.lon });
    setText("");
    setResults([]);
    setOpen(false);
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Location isn't available here.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        let label = "My location";
        try {
          const r = await fetch(`/api/places?reverse=1&lat=${lat}&lon=${lon}`);
          const json = (await r.json()) as { label: string | null };
          if (json.label) label = json.label;
        } catch {
          // keep default label
        }
        setLocating(false);
        pick({ label, lat, lon });
      },
      () => {
        setLocating(false);
        setLocError("Couldn't get your location. Type it instead.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 120_000 },
    );
  };

  const commitFreeText = () => {
    const q = text.trim();
    if (q && !chosen) onChange({ text: q, label: q });
  };

  const quick: Array<{ key: string; icon: React.ReactNode; label: string; sub?: string; onClick: () => void }> = [];
  quick.push({
    key: "loc",
    icon: <LocateFixed className="h-4 w-4 text-coral" />,
    label: locating ? "Finding you…" : "Use my current location",
    onClick: useLocation,
  });
  if (home) quick.push({ key: "home", icon: <Home className="h-4 w-4 text-ink-2" />, label: "Home", sub: home.label, onClick: () => pick(home) });
  for (const r of recents ?? []) {
    if (home && r.label === home.label) continue;
    quick.push({ key: `r-${r.label}`, icon: <Clock className="h-4 w-4 text-ink-2" />, label: r.label, onClick: () => pick(r) });
  }

  const showList = open && !chosen;
  const listItems = text.trim().length >= 2 ? results : [];

  return (
    <div ref={wrapRef} className="relative">
      <div className={`field ${showList ? "rounded-b-none" : ""}`}>
        <MapPin className="h-5 w-5 shrink-0 text-coral" />
        {chosen ? (
          <>
            <span className="min-w-0 flex-1 truncate">{chosen.label ?? chosen.text}</span>
            <button
              type="button"
              aria-label="Clear"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-ground"
              onClick={() => {
                onChange(null);
                setText("");
                setOpen(true);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <input
            id={id}
            value={text}
            placeholder={placeholder}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            onFocus={() => setOpen(true)}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitFreeText}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (listItems[0]) pick({ label: `${listItems[0].label}, ${listItems[0].sub}`, lat: listItems[0].lat, lon: listItems[0].lon });
                else {
                  commitFreeText();
                  setOpen(false);
                }
              }
            }}
          />
        )}
      </div>
      <AnimatePresence>
        {showList ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 z-20 -mt-px max-h-72 overflow-y-auto rounded-b-[18px] border border-t-0 border-line bg-paper shadow-pop"
          >
            {listItems.length
              ? listItems.map((s) => (
                  <button
                    key={`${s.label}-${s.sub}`}
                    type="button"
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-ground"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick({ label: s.sub ? `${s.label}, ${s.sub}` : s.label, lat: s.lat, lon: s.lon })}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium">{s.label}</span>
                      {s.sub ? <span className="block truncate text-[12.5px] text-ink-2">{s.sub}</span> : null}
                    </span>
                  </button>
                ))
              : quick.map((q) => (
                  <button
                    key={q.key}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ground"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={q.onClick}
                  >
                    {q.icon}
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium">{q.label}</span>
                      {q.sub ? <span className="block truncate text-[12.5px] text-ink-2">{q.sub}</span> : null}
                    </span>
                  </button>
                ))}
            {locError ? <p className="px-4 pb-3 text-[12.5px] text-coral">{locError}</p> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
