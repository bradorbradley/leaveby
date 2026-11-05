import type { ServiceWindow } from "@/types/airport";

/**
 * TSA PreCheck lane hours from the cited /airports guides (lib/airports/guides.json, checked
 * Oct 2026). Each window is the earliest opening and latest closing across every PreCheck
 * checkpoint that serves that terminal, so "closed" is only ever said when no PreCheck lane
 * serving that terminal is open. Hours that vary by day, or that the guides could not confirm
 * for every checkpoint in a terminal, are left out.
 *
 * `"*"` covers the whole airport, whatever terminal the flight lists. Other keys are
 * terminal ids as the flight data gives them.
 */
export const precheckHours: Record<string, Record<string, ServiceWindow>> = {
  CLT: { "*": { opensAt: "03:45", closesAt: "23:00" } }, // Checkpoint 2, CLT hours table
  DEN: { "*": { opensAt: "04:00", closesAt: "20:45" } }, // West to ~8:45pm, East to 8pm
  HNL: { "*": { opensAt: "04:15", closesAt: "23:30" } }, // CP 1B; CP 3 lane 6 and CP 5 in T2
  IND: { "*": { opensAt: "04:00", closesAt: "19:00" } }, // Checkpoint A
  MCO: { "*": { opensAt: "04:00", closesAt: "20:30" } }, // MCO's normal PreCheck hours
  MDW: { "*": { opensAt: "04:30", closesAt: "20:00" } }, // CDA
  PDX: { "*": { opensAt: "04:00", closesAt: "16:00" } }, // both checkpoints, "about 4 p.m."
  SEA: { "*": { opensAt: "04:00", closesAt: "20:00" } }, // latest PreCheck close is 8pm (CP 1, 3, 5)
  SLC: { "*": { opensAt: "03:30", closesAt: "22:00" } }, // SLC regular PreCheck hours
  IAH: { E: { opensAt: "04:00", closesAt: "20:00" } }, // Houston Airports
  ORD: {
    "1": { opensAt: "04:00", closesAt: "20:30" }, // CDA, Checkpoint 2
    "2": { opensAt: "03:30", closesAt: "20:00" }, // Checkpoint 5
    "3": { opensAt: "03:30", closesAt: "20:30" }, // Checkpoint 7A
    "5": { opensAt: "03:45", closesAt: "20:30" }, // Checkpoint 10
  },
  PHL: {
    "A-East": { opensAt: "04:15", closesAt: "18:30" },
    C: { opensAt: "04:15", closesAt: "20:00" },
    D: { opensAt: "03:45", closesAt: "20:00" },
    E: { opensAt: "03:45", closesAt: "20:00" },
  },
  PHX: {
    "3": { opensAt: "05:00", closesAt: "14:00" }, // PHX
    "4": { opensAt: "05:00", closesAt: "19:00" }, // Checkpoints A-D
  },
  SAT: {
    A: { opensAt: "03:30", closesAt: "18:00" }, // SAT
    B: { opensAt: "03:30", closesAt: "17:00" },
  },
};

/** "Terminal 3", "T3" and "3" all match "3". */
function norm(id: string) {
  return id.trim().toUpperCase().replace(/^TERMINAL\s*/, "").replace(/^T(?=\d)/, "");
}

export function precheckWindow(airport: string, terminal: string | null): { window: ServiceWindow; terminalKey: string } | null {
  const table = precheckHours[airport.toUpperCase()];
  if (!table) return null;
  if (table["*"]) return { window: table["*"], terminalKey: "*" };
  if (!terminal) return null;
  const key = Object.keys(table).find((k) => norm(k) === norm(terminal));
  return key ? { window: table[key], terminalKey: key } : null;
}
