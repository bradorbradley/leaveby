"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BriefcaseBusiness, Car, CheckCircle2, ChevronDown, Clock3, Footprints, PlaneTakeoff, Shield } from "lucide-react";
import { useState } from "react";

import { minutesToLabel } from "@/lib/utils";
import type { BreakdownItem } from "@/types/calculation";

const iconMap = {
  car: Car,
  briefcase: BriefcaseBusiness,
  check: CheckCircle2,
  footprints: Footprints,
  shield: Shield,
  plane: PlaneTakeoff,
  "clock-3": Clock3,
};

export function Breakdown({ items }: { items: BreakdownItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const total = items.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <div className="glass-card overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-label">How We Calculated This</p>
          <h3 className="mt-2 text-2xl">Your timeline</h3>
        </div>
        <p className="font-mono text-sm text-muted-foreground">{minutesToLabel(total)}</p>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Clock3;
          const open = openId === item.id;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="rounded-2xl border border-border bg-white/80"
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
                onClick={() => setOpenId(open ? null : item.id)}
              >
                <div className="rounded-xl bg-secondary p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{item.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-primary">{minutesToLabel(item.minutes)}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
                </div>
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-[4.25rem] text-sm text-muted-foreground">{item.detail}</div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
