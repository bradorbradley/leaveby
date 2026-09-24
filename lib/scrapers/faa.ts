/**
 * FAA National Airspace System status: live ground stops, ground delay
 * programs, departure delays, and closures for US airports. Free and
 * official (nasstatus.faa.gov). Programs are same-day, so they only matter
 * for flights leaving in the next several hours.
 */
const URL = "https://nasstatus.faa.gov/api/airport-status-information";
const TTL_MS = 3 * 60_000;
let cache: { at: number; xml: string } | null = null;

async function feed(): Promise<string | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.xml;
  try {
    const res = await fetch(URL, { headers: { Accept: "application/xml", "User-Agent": "LeaveBy (https://leaveby.vercel.app)" }, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!res.ok) return cache?.xml ?? null;
    const xml = await res.text();
    cache = { at: Date.now(), xml };
    return xml;
  } catch {
    return cache?.xml ?? null;
  }
}

const tag = (block: string, name: string) => block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]?.trim() ?? "";
const blocks = (xml: string, name: string) => Array.from(xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "g")), (m) => m[1]);
const short = (d: string) => d.replace(/ and /g, " ").replace(/hours?/g, "h").replace(/minutes?/g, "min").replace(/\s+/g, " ").trim();
const reason = (r: string) => {
  const s = r.replace(/^[A-Z]+:/, "").toLowerCase().trim();
  return s && s !== "other" ? ` (${s})` : "";
};

export interface FaaAlert {
  airport: string;
  kind: "ground-stop" | "ground-delay" | "departure-delay" | "closure";
  text: string;
}

export function parseFaa(xml: string, origin: string, destination?: string | null): FaaAlert[] {
  const out: FaaAlert[] = [];
  const want = (a: string) => a === origin || (destination && a === destination);
  for (const b of blocks(xml, "Program")) {
    const a = tag(b, "ARPT");
    if (!want(a)) continue;
    const end = tag(b, "End_Time");
    out.push({ airport: a, kind: "ground-stop", text: a === origin ? `FAA ground stop at ${a}${reason(tag(b, "Reason"))}${end ? ` until ${end}` : ""}. Departures are held.` : `FAA ground stop for flights to ${a}${reason(tag(b, "Reason"))}${end ? ` until ${end}` : ""}. Your flight may wait to leave.` });
  }
  // A ground delay program holds flights headed TO that airport, so it only matters at the destination.
  for (const b of blocks(xml, "Ground_Delay")) {
    const a = tag(b, "ARPT");
    if (!destination || a !== destination) continue;
    const avg = short(tag(b, "Avg"));
    out.push({ airport: a, kind: "ground-delay", text: `Flights to ${a} are being held an average of ${avg}${reason(tag(b, "Reason"))}.` });
  }
  for (const b of blocks(xml, "Delay")) {
    const a = tag(b, "ARPT");
    if (a !== origin || !/Type="Departure"/.test(b)) continue;
    const min = short(tag(b, "Min")), max = short(tag(b, "Max"));
    const range = / min$/.test(min) && / min$/.test(max) && !/h/.test(min + max) ? `${min.replace(/ min$/, "")}–${max}` : `${min}–${max}`;
    out.push({ airport: a, kind: "departure-delay", text: `Departures from ${a} running ${range} late${reason(tag(b, "Reason"))}.` });
  }
  for (const b of blocks(xml, "Airport")) {
    const a = tag(b, "ARPT");
    const r = tag(b, "Reason");
    // Most "closures" are notices restricting private aircraft; they don't affect airline passengers.
    if (!want(a) || /NON SKED|TRANSIENT|GA ACFT|PPR|GENERAL AVIATION/i.test(r)) continue;
    out.push({ airport: a, kind: "closure", text: `FAA reports ${a} closed until ${tag(b, "Reopen").replace(/\.$/, "")}.` });
  }
  return out.slice(0, 2);
}

/** Alerts for a flight, only when it leaves within the next 8 hours. */
export async function faaAlerts(origin: string, destination: string | null | undefined, departureISO: string): Promise<string[]> {
  const until = new Date(departureISO).getTime() - Date.now();
  if (until > 8 * 3600_000 || until < -3600_000) return [];
  const xml = await feed();
  if (!xml) return [];
  const alerts = parseFaa(xml, origin, destination);
  return alerts.length ? [...alerts.map((a) => a.text), "Check your flight status before you leave."].slice(0, 3) : [];
}
