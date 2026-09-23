import { getAirportProfile, getTerminalProfile } from "@/lib/airports";
import { FAST_MODEL, hasOpenAI, openai } from "@/lib/openai";
import { instantToZonedParts } from "@/lib/tz";
import type { FlightInfo } from "@/types/flight";
import type { Mode, Perks, Research, RouteEstimate } from "@/types/plan";
import type { WeatherEstimate } from "@/types/weather";

export type Stage = "traffic" | "security" | "rules" | "today" | "synthesis";

export interface ResearchInput {
  flight: FlightInfo;
  route: RouteEstimate;
  weather: WeatherEstimate | null;
  checkedBag: boolean;
  perks: Perks;
  mode: Mode;
  onSearch?: (query: string) => void;
  onStage?: (stage: Stage) => void;
  onNote?: (text: string) => void;
}

/**
 * Speed budget. Four focused web searches run in parallel (one model call
 * each), then one quick synthesis call turns the findings into numbers.
 * Every step has its own timeout so the app always answers.
 */
const SCOUT_TIMEOUT_MS = Number(process.env.RESEARCH_SCOUT_TIMEOUT_MS ?? 14_000);
const SYNTH_TIMEOUT_MS = Number(process.env.RESEARCH_SYNTH_TIMEOUT_MS ?? 18_000);
const CACHE_TTL_MS = Number(process.env.RESEARCH_CACHE_TTL_MS ?? 3 * 3600_000);
const SCOUT_MODEL = process.env.OPENAI_SCOUT_MODEL ?? FAST_MODEL;
const SYNTH_MODEL = process.env.OPENAI_SYNTH_MODEL ?? FAST_MODEL;

interface Citation {
  title: string;
  url: string;
}

interface ScoutResult {
  stage: Exclude<Stage, "synthesis">;
  text: string;
  queries: string[];
  citations: Citation[];
  /** True only when the answer cites at least one web source. Unverified notes are never used. */
  verified: boolean;
}

// Per-instance cache. Serverless instances are short-lived, but a warm one
// makes a retry or a second traveler at the same terminal near-instant.
const cache = new Map<string, { at: number; value: ScoutResult }>();

export async function researchTrip(input: ResearchInput): Promise<Research> {
  if (!hasOpenAI()) return fallbackResearch(input, "No OpenAI key configured");
  try {
    const result = await runResearch(input);
    if (result) return result;
    return fallbackResearch(input, "Research returned nothing usable");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fallbackResearch(input, message);
  }
}

function laneList(perks: Perks): string[] {
  return [
    perks.touchlessId && "TSA PreCheck Touchless ID / the airline's Digital ID (face scan)",
    perks.clear && "CLEAR",
    perks.precheck && "TSA PreCheck",
    perks.globalEntry && !perks.precheck && "TSA PreCheck (via Global Entry)",
  ].filter((x): x is string => Boolean(x));
}

function describeLanes(perks: Perks): string {
  const lanes = [
    perks.precheck && "TSA PreCheck",
    perks.globalEntry && "Global Entry (which includes TSA PreCheck)",
    perks.clear && "CLEAR",
    perks.touchlessId && "TSA PreCheck Touchless ID / airline Digital ID",
  ].filter(Boolean);
  return lanes.length ? lanes.join(", ") : "none; standard screening only";
}

interface TripContext {
  flightLine: string;
  terminalLabel: string;
  arrivalHour: string;
  weekday: string;
  dateLabel: string;
  originLine: string;
  lanes: string;
  bag: string;
  weatherLine: string;
  tz: string;
  modeLine: string;
}

function buildContext(input: ResearchInput): TripContext {
  const { flight, route, weather, checkedBag, perks } = input;
  const tz = flight.departureTimezone ?? "America/New_York";
  const dep = new Date(flight.departureTime);
  const depParts = instantToZonedParts(dep, tz);
  const arrival = instantToZonedParts(new Date(dep.getTime() - 2 * 3600_000), tz);
  const airportName = flight.departureAirportName ? `${flight.departureAirport} (${flight.departureAirportName})` : flight.departureAirport;
  return {
    tz,
    flightLine: `${flight.flightNumber} (${flight.airlineName}), ${flight.region}, departing ${airportName} at ${depParts.hhmm} on ${depParts.weekday} ${depParts.isoDate} to ${flight.destinationCity ?? flight.destinationAirportCode ?? "unknown"}`,
    terminalLabel: flight.terminal ? `${flight.departureAirport} Terminal ${flight.terminal}` : `${flight.departureAirport} (terminal not published; find which terminal ${flight.airlineName} uses)`,
    arrivalHour: arrival.hhmm,
    weekday: depParts.weekday,
    dateLabel: depParts.isoDate,
    originLine: route.originLabel
      ? `${route.originLabel}${route.freeFlowMinutes ? ` (routing engine: ${route.freeFlowMinutes} min with no traffic, ${route.distanceKm ?? "?"} km)` : ""}`
      : "not given; assume a typical trip from within the metro area",
    lanes: describeLanes(perks),
    bag: checkedBag ? "checking a bag" : "carry-on only with a mobile boarding pass",
    weatherLine: weather ? `${weather.summary}${weather.notes.length ? ` ${weather.notes.join(" ")}` : ""}` : "unknown",
    modeLine:
      input.mode === "drive"
        ? "driving their own car and parking at the airport (include finding parking, the lot-to-terminal walk or shuttle)"
        : input.mode === "transit"
          ? "taking public transit (subway, train, or bus, including any AirTrain or shuttle to the terminal)"
          : "taking a rideshare or taxi, dropped at the departures curb",
  };
}

const SCOUT_SYSTEM = `You are a research scout for Leave By, an app that tells one traveler when to walk out the door for a flight. You have web search. Answer ONE focused question about THIS airport, THIS terminal, THIS hour, THIS day. Run one or two searches, then answer.

Rules: be specific and current. Prefer official sources (airport, TSA, airline, DOT) and recent reports. Give numbers where you can (minutes, hours of operation, cutoffs). Every fact must come from a page you searched; cite it inline. Say "not found" for anything you could not verify rather than guessing. Never fill gaps from memory. Keep it under 130 words, plain sentences, no headers.`;

function scoutPrompts(c: TripContext, input: ResearchInput): Array<{ stage: ScoutResult["stage"]; question: string; cacheKey: string }> {
  const { flight, route } = input;
  const terminalKey = `${flight.departureAirport}|${flight.terminal ?? flight.airlineCode}`;
  const hourBucket = c.arrivalHour.slice(0, 2);
  const originKey = route.originCoord ? `${route.originCoord.lat.toFixed(2)},${route.originCoord.lon.toFixed(2)}` : "none";
  return [
    {
      stage: "traffic",
      cacheKey: `traffic|${input.mode}|${terminalKey}|${c.weekday}|${hourBucket}|${originKey}`,
      question:
        input.mode === "transit"
          ? `Getting to ${c.terminalLabel} by public transit from ${c.originLine}, arriving around ${c.arrivalHour} on a ${c.weekday}. What is the realistic route and total door-to-terminal time including waits and any AirTrain or shuttle? How often does it run at that hour? Any service changes or construction affecting it this week?`
          : input.mode === "drive"
            ? `Driving and parking at ${c.terminalLabel} from ${c.originLine}, arriving around ${c.arrivalHour} on a ${c.weekday}. What is a realistic drive time with typical traffic for that hour? Name the chokepoints. Which parking lot or garage serves this terminal, how long from the lot to the terminal (walk or shuttle), and is there active roadway or parking construction this month?`
            : `Getting to ${c.terminalLabel} by rideshare or taxi from ${c.originLine}, arriving around ${c.arrivalHour} on a ${c.weekday}. What is a realistic door-to-curb drive time with typical traffic for that hour? Name the chokepoints. Is there active roadway or curb construction at the airport this month, and exactly where do rideshares drop off at this terminal?`,
    },
    {
      stage: "security",
      cacheKey: `security|${terminalKey}|${c.weekday}|${hourBucket}|${c.lanes}`,
      question: (() => {
        const lanes = laneList(input.perks);
        const laneQ = lanes.length
          ? `The traveler has: ${lanes.join("; ")}. For EACH of these at ${c.terminalLabel}: does it exist here, what are its hours, and what is the typical wait around ${c.arrivalHour} on a ${c.weekday}? Which one is fastest at that hour? Note if CLEAR or PreCheck lanes back up at peak times despite the perk.`
          : `The traveler has no expedited screening. What do standard lanes at ${c.terminalLabel} run around ${c.arrivalHour} on a ${c.weekday}?`;
        const gateQ = flight.gate
          ? `Then the walk: how many minutes from that checkpoint to gate ${flight.gate}, and is there a train, a long concourse, or a far pier involved?`
          : `Then the walk: how many minutes from that checkpoint to ${flight.airlineName}'s gates in this terminal, and is there a train, a long concourse, or a far pier involved?`;
        return `Security at ${c.terminalLabel} for ${flight.airlineName}. ${laneQ} Which checkpoints does this terminal have, which is usually shorter, and which entrance leads to the expedited lanes? ${gateQ}`;
      })(),
    },
  ];
}

async function runScout(prompt: { stage: ScoutResult["stage"]; question: string; cacheKey: string }, input: ResearchInput): Promise<ScoutResult> {
  const hit = cache.get(prompt.cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    input.onStage?.(prompt.stage);
    for (const q of hit.value.queries) input.onSearch?.(q);
    return hit.value;
  }
  input.onStage?.(prompt.stage);
  const queries: string[] = [];
  const stream = await openai().responses.create(
    {
      model: SCOUT_MODEL,
      tools: [{ type: "web_search" }],
      ...({ max_tool_calls: 2 } as object),
      instructions: SCOUT_SYSTEM,
      input: prompt.question,
      stream: true,
    },
    { timeout: SCOUT_TIMEOUT_MS },
  );
  let text = "";
  const seen = new Set<string>();
  const citations: Citation[] = [];
  const seenUrls = new Set<string>();
  const addCitation = (a: { type?: string; url?: string; title?: string }) => {
    if (a?.type !== "url_citation" || !a.url) return;
    const key = a.url.split("?")[0];
    if (seenUrls.has(key)) return;
    seenUrls.add(key);
    citations.push({ title: (a.title ?? "").trim() || hostOf(a.url), url: a.url });
  };
  const deadline = Date.now() + SCOUT_TIMEOUT_MS;
  for await (const event of stream) {
    if (Date.now() > deadline) throw new Error(`scout ${prompt.stage} timed out`);
    if (event.type === "response.output_text.annotation.added") {
      addCitation(event.annotation as { type?: string; url?: string; title?: string });
    } else if (event.type === "response.output_item.added" || event.type === "response.output_item.done") {
      const it = event.item as { type?: string; action?: { query?: string; queries?: string[] }; content?: Array<{ annotations?: Array<{ type?: string; url?: string; title?: string }> }> };
      if (it?.type === "message") {
        for (const part of it.content ?? []) for (const a of part.annotations ?? []) addCitation(a);
      }
      if (it?.type === "web_search_call") {
        const qs = it.action?.queries?.length ? it.action.queries : it.action?.query ? [it.action.query] : [];
        for (const q of qs) {
          const key = q.trim().toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          queries.push(q.trim());
          input.onSearch?.(q.trim());
        }
      }
    } else if (event.type === "response.output_text.delta") {
      text += event.delta;
    } else if (event.type === "response.failed" || event.type === "response.incomplete") {
      throw new Error(`scout ${prompt.stage} ${event.type}`);
    }
  }
  const clean = text.trim();
  const value: ScoutResult = { stage: prompt.stage, text: clean, queries, citations, verified: citations.length > 0 && clean.length > 0 };
  if (value.verified) cache.set(prompt.cacheKey, { at: Date.now(), value });
  return value;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const SYNTH_SYSTEM = `You are the brain behind Leave By. You turn research notes into the minutes a traveler needs, and into a few plain sentences shown on a phone.

Judgment: err a little protective (a missed flight costs hours, ten spare minutes cost nothing) but do not pad every number; travelers stop trusting an app that always says four hours. Where a note says "not found", use the airport's typical pattern. Never include the traveler's gate time; the app adds it.

Writing: plain words, no jargon, no hedging, at most 18 words per sentence. Name the specific thing (the checkpoint, the road, the rule). "headsUp" is only things that genuinely change this trip; empty is fine.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    driveMinutes: { type: "integer", description: "Door to the terminal with traffic for that hour. For driving, include parking and the lot-to-terminal walk or shuttle. For transit, the full door-to-terminal trip including waits." },
    curbToCheckpointMinutes: { type: "integer", description: "Curb or terminal entrance to the checkpoint they should use, including bag drop if they check a bag" },
    securityMinutes: { type: "integer", description: "Queue plus screening for their lane at their arrival hour" },
    checkpointToGateMinutes: { type: "integer", description: "Checkpoint to gate area, including trains or long walks" },
    boardingLeadMinutes: { type: "integer", description: "Minutes before departure that boarding starts" },
    bagDropCutoffMinutes: { type: ["integer", "null"], description: "Airline bag-drop cutoff in minutes before departure, null if no checked bag" },
    checkpoint: { type: "string", description: "The checkpoint to use, e.g. 'Terminal 4 main checkpoint, departures level'" },
    lane: { type: "string", description: "The lane they will actually use, e.g. 'TSA PreCheck' or 'standard lanes'" },
    driveNotes: { type: "array", items: { type: "string" }, description: "1 or 2 short notes for the trip to the airport: expected traffic, any construction or event that slows it, where to get dropped or park" },
    securityNotes: { type: "array", items: { type: "string" }, description: "1 or 2 short notes for security: the typical wait for their lane at this hour, and one thing that matters (backs up at peak, which entrance, bag cutoff)" },
    gateNotes: { type: "array", items: { type: "string" }, description: "1 short note that justifies checkpointToGateMinutes from the research (which concourse or gates, a train, a long pier, the distance). Empty only if the notes say nothing about the walk." },
    sources: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: [
    "driveMinutes",
    "curbToCheckpointMinutes",
    "securityMinutes",
    "checkpointToGateMinutes",
    "boardingLeadMinutes",
    "bagDropCutoffMinutes",
    "checkpoint",
    "lane",
    "driveNotes",
    "securityNotes",
    "gateNotes",
    "sources",
    "confidence",
  ],
} as const;

async function runResearch(input: ResearchInput): Promise<Research | null> {
  const c = buildContext(input);
  const prompts = scoutPrompts(c, input);
  const settled = await Promise.allSettled(prompts.map((p) => runScout(p, input)));
  const notes: ScoutResult[] = [];
  const failed: string[] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled" && s.value.verified) notes.push(s.value);
    else failed.push(prompts[i].stage);
  });
  if (!notes.length) return null;
  if (failed.length) input.onNote?.(`Not verified live: ${failed.join(", ")}.`);
  const baseline = fallbackNumbers(input);

  input.onStage?.("synthesis");
  const user = `## The trip
- ${c.flightLine}
- Terminal: ${c.terminalLabel}
- Likely at the airport around ${c.arrivalHour} on a ${c.weekday}
- Leaving from: ${c.originLine}
- Getting there: ${c.modeLine}
- Bag: ${c.bag}
- Skip-the-line: ${c.lanes}
- Weather forecast near departure: ${c.weatherLine}

## Verified research notes (live web searches just now, each backed by cited sources)
${notes.map((n) => `### ${n.stage}\n${n.text}\nCited: ${n.citations.map((c) => hostOf(c.url)).join(", ")}`).join("\n\n")}
${failed.length ? `\n(No verified note for: ${failed.join(", ")}. For those pieces use the typical baseline below, do not invent specifics, and set confidence to at most "medium".)` : ""}

## Typical baseline for this airport (use only where the notes are silent)
- driveMinutes ${baseline.driveMinutes}${input.route.freeFlowMinutes ? ` (routing engine free-flow ${input.route.freeFlowMinutes})` : ""}
- curbToCheckpointMinutes ${baseline.curbToCheckpointMinutes}
- securityMinutes ${baseline.securityMinutes} for ${baseline.lane}
- checkpointToGateMinutes ${baseline.checkpointToGateMinutes}
- boardingLeadMinutes ${baseline.boardingLeadMinutes}
- bagDropCutoffMinutes ${baseline.bagDropCutoffMinutes ?? "n/a"}

## Rules
Only state facts that appear in the verified notes. Never invent hours, closures, cutoffs, or construction. If a note says "not found", fall back to the baseline and say nothing about it. Every note shown to the traveler must be traceable to a research note.

## Return
Fill the JSON schema. Minutes are integers. Notes are shown under the step where they matter and the traveler is on a phone, so be brief: driveNotes 1 or 2, securityNotes 1 or 2, gateNotes 1 when the notes describe the walk to the gates (say what makes it that long: the concourse, a train, a far pier) and 0 otherwise. Put holiday, event, or weather warnings that slow the roads into driveNotes. securityNotes: the typical wait for their lane at this hour, plus one thing that matters (a perk lane that backs up at peak, which entrance, bag cutoff). Do not rank their lanes against each other. A note must be a concrete number or something a first-timer would not know. Never restate the traveler's inputs and never state the obvious. At most 14 words per note, plain words.`;

  const response = await openai().responses.create(
    {
      model: SYNTH_MODEL,
      instructions: SYNTH_SYSTEM,
      input: user,
      text: { format: { type: "json_schema", name: "research", strict: true, schema: SCHEMA } },
    },
    { timeout: SYNTH_TIMEOUT_MS },
  );
  const parsed = parseJson(response.output_text);
  if (!parsed) return null;
  const engine = `${SCOUT_MODEL} scouts + ${SYNTH_MODEL}`;
  const result = sanitize(parsed, input, engine);
  // Sources are the real citations, not the model's description of them.
  const cited = notes.flatMap((n) => n.citations);
  const byHost = new Map<string, Citation>();
  for (const c of cited) if (!byHost.has(hostOf(c.url))) byHost.set(hostOf(c.url), c);
  result.sources = Array.from(byHost.values())
    .slice(0, 6)
    .map((c) => (c.title && c.title !== hostOf(c.url) ? `${c.title} (${hostOf(c.url)})` : hostOf(c.url)));
  if (failed.length) {
    if (result.confidence === "high") result.confidence = "medium";
    const labels: Record<string, string> = { traffic: "traffic", security: "security lines", rules: "airline rules", today: "today's conditions" };
    const note = `Couldn't verify ${failed.map((f) => labels[f] ?? f).join(" or ")} live, so that part uses typical numbers.`;
    result.headsUp = [note, ...result.headsUp].slice(0, 2);
  }
  return result;
}

function parseJson(text: string): Partial<Research> | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Partial<Research>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Partial<Research>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function clamp(n: unknown, lo: number, hi: number, fallback: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.min(hi, Math.max(lo, v));
}

function sanitize(r: Partial<Research>, input: ResearchInput, engine: string): Research {
  const base = fallbackNumbers(input);
  const strings = (arr: unknown, max: number) =>
    Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim()).slice(0, max) : [];
  const free = input.route.freeFlowMinutes;
  const driveLo = free ? Math.round(free * 0.9) : 5;
  const driveHi = free ? (input.mode === "transit" ? Math.round(free * 3) + 30 : input.mode === "drive" ? Math.round(free * 2.2) + 35 : Math.round(free * 2.2) + 15) : 900;
  return {
    driveMinutes: clamp(r.driveMinutes, driveLo, driveHi, base.driveMinutes),
    curbToCheckpointMinutes: clamp(r.curbToCheckpointMinutes, 2, 60, base.curbToCheckpointMinutes),
    securityMinutes: clamp(r.securityMinutes, 5, 120, base.securityMinutes),
    checkpointToGateMinutes: clamp(r.checkpointToGateMinutes, 2, 45, base.checkpointToGateMinutes),
    boardingLeadMinutes: clamp(r.boardingLeadMinutes, 20, 90, base.boardingLeadMinutes),
    bagDropCutoffMinutes: input.checkedBag ? clamp(r.bagDropCutoffMinutes, 30, 120, base.bagDropCutoffMinutes ?? 45) : null,
    checkpoint: typeof r.checkpoint === "string" && r.checkpoint ? r.checkpoint : base.checkpoint,
    lane: typeof r.lane === "string" && r.lane ? r.lane : base.lane,
    driveNotes: strings(r.driveNotes, 2),
    securityNotes: strings(r.securityNotes, 2),
    gateNotes: strings(r.gateNotes, 1).length ? strings(r.gateNotes, 1) : [typicalWalkNote(input, clamp(r.checkpointToGateMinutes, 2, 45, base.checkpointToGateMinutes))],
    headsUp: withDistanceWarning(input, []),
    sources: strings(r.sources, 4),
    confidence: r.confidence === "high" || r.confidence === "medium" || r.confidence === "low" ? r.confidence : "medium",
    engine,
  };
}

/** The walk to the gate is never shown as a bare number: say what it is based on. */
function typicalWalkNote(input: ResearchInput, minutes: number): string {
  const terminal = getTerminalProfile(input.flight.departureAirport, input.flight.terminal);
  if (terminal) {
    const [lo, hi] = terminal.securityToGateMinutes;
    const name = terminal.name.replace(/^Terminal /, "Terminal ");
    const range = lo === hi ? `about ${hi} min` : `${lo}–${hi} min`;
    if (minutes >= hi) return `${name} gates are ${range} from security. This plans for the far end.`;
    return `${name} gates are ${range} from security.`;
  }
  return `Typical walk to a far gate at ${input.flight.departureAirport}. Most gates are closer.`;
}

/** A very long drive usually means the wrong origin or the wrong airport. Say so first. */
function withDistanceWarning(input: ResearchInput, headsUp: string[]): string[] {
  const free = input.route.freeFlowMinutes;
  if (!free || free < 180) return headsUp;
  const hours = Math.round(free / 30) / 2;
  const note = `That's about a ${hours}-hour drive to ${input.flight.departureAirport}. Double-check where you're leaving from.`;
  return [note, ...headsUp].slice(0, 2);
}

function fallbackNumbers(input: ResearchInput): Research {
  const { flight, route, checkedBag, perks } = input;
  const airport = getAirportProfile(flight.departureAirport, {
    name: flight.departureAirportName,
    timezone: flight.departureTimezone,
    coord: flight.airportCoord,
  });
  const terminal = getTerminalProfile(flight.departureAirport, flight.terminal);
  const tz = flight.departureTimezone ?? airport.timezone;
  const road = instantToZonedParts(new Date(new Date(flight.departureTime).getTime() - 2.5 * 3600 * 1000), tz);
  const weekend = road.weekday === "Sat" || road.weekday === "Sun";
  const rush = !weekend && ((road.hour >= 7 && road.hour < 10) || (road.hour >= 15 && road.hour < 19));
  const factor = rush ? 1.45 : road.hour >= 6 && road.hour < 21 ? 1.2 : 1.0;
  const drive = route.freeFlowMinutes ? Math.round(route.freeFlowMinutes * factor) + 5 : 50;
  const expedited = perks.precheck || perks.globalEntry || perks.touchlessId;
  const wait = terminal?.security.waitEstimate ?? { offPeak: 15, normal: 25, peak: 40, holiday: 55 };
  const peakHour = (road.hour >= 5 && road.hour < 9) || (road.hour >= 15 && road.hour < 19);
  const standardWait = peakHour ? wait.peak : wait.normal;
  const security = expedited ? Math.max(8, Math.round(standardWait * 0.45)) : perks.clear ? Math.max(10, Math.round(standardWait * 0.6)) : standardWait;
  const intl = flight.region === "international";
  const curb = (terminal?.curbToSecurityMinutes[1] ?? 8) + (checkedBag ? 12 : 0);
  const modeExtra = input.mode === "drive" ? 15 : input.mode === "transit" ? Math.round(drive * 0.6) + 15 : 0;
  return {
    driveMinutes: drive + modeExtra,
    curbToCheckpointMinutes: curb,
    securityMinutes: security,
    checkpointToGateMinutes: terminal?.securityToGateMinutes[1] ?? 10,
    boardingLeadMinutes: intl ? airport.standardBoardingBuffer.international : airport.standardBoardingBuffer.domestic,
    bagDropCutoffMinutes: checkedBag ? (intl ? airport.bagCutoffs.checkedInternational : airport.bagCutoffs.checkedDomestic) : null,
    checkpoint: terminal ? `${terminal.name} checkpoint` : "Main checkpoint",
    lane: expedited ? "TSA PreCheck" : perks.clear ? "CLEAR" : "standard lanes",
    driveNotes: [
      route.originLabel ? (rush ? "Rush hour on the way, so the drive is padded." : "Typical traffic for that hour.") : "No starting point given, so this assumes a typical trip from the metro area.",
    ],
    securityNotes: [`${expedited ? "PreCheck" : perks.clear ? "CLEAR" : "Standard"} lanes usually run about ${security} minutes at that hour.`],
    gateNotes: [typicalWalkNote(input, terminal?.securityToGateMinutes[1] ?? 10)],
    headsUp: [],
    sources: ["Typical numbers for this airport; live search was not available."],
    confidence: "low",
    engine: "typical-numbers",
  };
}

function fallbackResearch(input: ResearchInput, reason: string): Research {
  const base = fallbackNumbers(input);
  input.onNote?.(`Live search unavailable (${reason}). Using typical numbers.`);
  return { ...base, headsUp: withDistanceWarning(input, ["Live search was unavailable, so these are typical numbers for this airport."]).slice(0, 2) };
}
