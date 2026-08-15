import Anthropic from "@anthropic-ai/sdk";
import { formatISO, isBefore, parseISO, subMinutes } from "date-fns";

import { formatInZone } from "@/lib/tz";
import type { CalculationOptions, CalculationResult } from "@/types/calculation";
import type { FlightInfo } from "@/types/flight";
import type { TravelEstimate } from "@/types/traffic";
import type { WeatherEstimate } from "@/types/weather";

/**
 * The research agent: instead of hardcoded airport intelligence, every
 * calculation asks Claude to research this specific airport, terminal,
 * security situation, and route — live, via web search — and return
 * structured component estimates. The server keeps the clock arithmetic.
 */

export function agentAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

interface AgentEstimates {
  travelMinutes: number;
  checkinBagMinutes: number;
  walkToSecurityMinutes: number;
  securityWaitMinutes: number;
  walkToGateMinutes: number;
  boardingLeadMinutes: number;
  travelSummary: string;
  securitySummary: string;
  gateSummary?: string;
  peakDayLabel?: string | null;
  warnings?: string[];
  proTips?: string[];
  researchNotes?: string[];
  confidence?: "high" | "medium" | "low";
}

const SYSTEM_PROMPT = `You are the timing brain behind LeaveBy, an app that answers one question for a traveler: "When do I need to walk out the door to comfortably make my flight?"

You are given verified facts about the flight (from live schedule data) and baseline measurements (a routing-engine drive time, an official weather forecast). Your job is the judgment those numbers can't provide. Research the CURRENT, SPECIFIC reality of this exact trip using web search:

- TSA security waits at this airport and terminal: recent reported waits, how this terminal behaves at this specific hour and day of week, whether the traveler's expedited lanes (TSA PreCheck, CLEAR, Global Entry) actually operate in this terminal and are open at the hour they'll arrive. PreCheck lanes at many airports close in the evening — check.
- Airport ground access right now: active roadway or terminal construction, known pickup/drop-off congestion, parking shuttle time if driving, terminal curb quirks.
- If the traveler is taking transit: the actual line that serves this airport, realistic station-to-terminal time, headways at their travel hour.
- The terminal's internal geography: realistic curb-to-checkpoint and checkpoint-to-gate walking times, tram/train connections to concourses, notoriously long walks.
- Anything unusual today: holiday/peak travel calendar, major events near the airport, weather already given to you.

Search efficiently — a handful of targeted queries, not an exhaustive crawl. Where live data is thin, estimate from the airport's known patterns and say so in your notes. Be honest: err slightly protective (missing a flight costs hours; ten spare minutes costs nothing), but do not pad every number — travelers stop trusting an app that always says 4 hours.

## Output contract

End your reply with ONLY a JSON object (no prose after it, no markdown fence) with exactly these fields. All *Minutes fields are integers representing minutes:

{
  "travelMinutes": door-to-terminal-curb (or platform-to-terminal for transit) for their stated mode, including realistic traffic for that hour, parking+shuttle if driving, or curb drop-off if rideshare,
  "checkinBagMinutes": time for check-in/bag drop; 0 if no checked bag and mobile boarding pass,
  "walkToSecurityMinutes": curb or station to the checkpoint they should use,
  "securityWaitMinutes": queue + screening for THEIR access level at THEIR arrival hour,
  "walkToGateMinutes": checkpoint to gate area, including trams/tunnels,
  "boardingLeadMinutes": how long before scheduled departure boarding starts for this airline and route type (typically 30-35 domestic, 45-60 international),
  "travelSummary": one sentence on the route and traffic reality,
  "securitySummary": one sentence on the security situation you found,
  "gateSummary": one sentence on the walk to the gate (optional),
  "peakDayLabel": short label if this is a peak travel day, else null,
  "warnings": up to 5 short traveler-facing warnings — only things that genuinely matter for THIS trip (closed lanes, construction, bag cutoff times, REAL ID),
  "proTips": up to 3 short insider tips specific to this airport/terminal/mode,
  "researchNotes": up to 4 short notes on what you found and where estimates came from,
  "confidence": "high" | "medium" | "low"
}`;

export async function researchLeavePlan(input: {
  flight: FlightInfo;
  traffic: TravelEstimate;
  weather: WeatherEstimate;
  options: CalculationOptions;
  originLabel: string;
}): Promise<CalculationResult | null> {
  if (!agentAvailable()) return null;

  const { flight, traffic, weather, options } = input;
  const client = new Anthropic();

  const perks = [
    options.hasPreCheck && "TSA PreCheck",
    options.hasGlobalEntry && "Global Entry",
    options.hasClear && "CLEAR",
  ]
    .filter(Boolean)
    .join(", ");

  const modeLabel =
    options.mode === "transit" ? "public transit (train/subway)" : options.mode === "rideshare" ? "rideshare (Uber/Lyft, curb drop-off)" : "driving their own car (will need to park)";

  const userMessage = `## Verified flight facts (live schedule data — trust these)
- Flight: ${flight.flightNumber} (${flight.airlineName}), ${flight.departureAirport}${flight.departureAirportName ? ` — ${flight.departureAirportName}` : ""} to ${flight.destinationCity ?? flight.destinationAirportCode ?? "unknown destination"}
- Scheduled departure: ${flight.departureLocalLabel ?? flight.departureTime} local airport time (${flight.departureTime} UTC)
- Status: ${flight.status}${flight.delayMinutes > 0 ? `, running ~${flight.delayMinutes} min late` : ""}
- Terminal: ${flight.terminal ?? "unknown — research which terminal this airline uses here"}${flight.gate ? `, gate ${flight.gate}` : ""}
- Route type: ${flight.region}

## Traveler
- Leaving from: ${input.originLabel || "location not given — assume a typical trip from within the metro area"}
- Getting to the airport by: ${modeLabel}
- Checked bag: ${options.checkedBag ? "YES" : "no (carry-on, mobile boarding pass)"}
- Expedited security: ${perks || "none — standard screening"}
- Wants ${options.bufferMinutes} minutes of breathing room after security before boarding starts (do NOT include this in your numbers — the app adds it separately)

## Baseline measurements (starting points — adjust with your research)
- Routing engine drive time (free-flow, no traffic): ${traffic.source.includes("Fallback") ? "unavailable — estimate from the origin description" : `${traffic.durationMinutes} min total including our naive traffic/mode adjustments; the raw route is ${input.originLabel} to the airport`}
- Weather at departure: ${weather.summary} ${weather.notes.length ? `(${weather.notes.join("; ")})` : ""}

Research this trip and return the JSON.`;

  try {
    const response = await callWithContinuation(client, userMessage);
    if (!response) return null;

    const estimates = extractJson(response);
    if (!estimates) return null;

    return buildResult(estimates, input);
  } catch {
    return null;
  }
}

async function callWithContinuation(client: Anthropic, userMessage: string) {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: userMessage }];

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
      messages,
    });

    if (response.stop_reason === "refusal") return null;

    if (response.stop_reason === "pause_turn") {
      // Server-side tool loop paused — append the assistant turn and resume.
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    return response;
  }

  return null;
}

function extractJson(response: Anthropic.Beta.BetaMessage): AgentEstimates | null {
  const text = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // The JSON object is the last {...} span in the reply.
  const start = text.lastIndexOf("{\n") !== -1 ? findMatchingObject(text) : null;
  const candidate = start ?? text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) return null;

  try {
    const parsed = JSON.parse(candidate) as AgentEstimates;
    const requiredNumbers = [
      parsed.travelMinutes,
      parsed.checkinBagMinutes,
      parsed.walkToSecurityMinutes,
      parsed.securityWaitMinutes,
      parsed.walkToGateMinutes,
      parsed.boardingLeadMinutes,
    ];
    if (requiredNumbers.some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Find the last top-level {...} object in the text by brace matching. */
function findMatchingObject(text: string): string | null {
  const lastClose = text.lastIndexOf("}");
  if (lastClose === -1) return null;
  let depth = 0;
  for (let i = lastClose; i >= 0; i--) {
    if (text[i] === "}") depth++;
    if (text[i] === "{") {
      depth--;
      if (depth === 0) return text.slice(i, lastClose + 1);
    }
  }
  return null;
}

function buildResult(
  estimates: AgentEstimates,
  input: {
    flight: FlightInfo;
    traffic: TravelEstimate;
    weather: WeatherEstimate;
    options: CalculationOptions;
  },
): CalculationResult {
  const { flight, traffic, weather, options } = input;
  const departure = parseISO(flight.departureTime);
  const clamp = (value: number, max: number) => Math.min(max, Math.max(0, Math.round(value)));

  const travelMinutes = clamp(estimates.travelMinutes, 1440);
  const bagMinutes = clamp(estimates.checkinBagMinutes, 90);
  const securityWalk = clamp(estimates.walkToSecurityMinutes, 45);
  const securityWait = clamp(estimates.securityWaitMinutes, 240);
  const gateWalk = clamp(estimates.walkToGateMinutes, 60);
  const boardingLead = clamp(estimates.boardingLeadMinutes, 90) || 30;

  const boardingTime = subMinutes(departure, boardingLead);
  const airportArrivalMinutes = bagMinutes + securityWalk + securityWait + gateWalk;
  const leaveByTime = subMinutes(boardingTime, airportArrivalMinutes + travelMinutes + options.bufferMinutes);

  const timezone = flight.departureTimezone ?? "America/New_York";

  return {
    leaveByTime: formatISO(leaveByTime),
    targetBufferMinutes: options.bufferMinutes,
    airportArrivalMinutes,
    travelMinutes,
    totalMinutes: airportArrivalMinutes + travelMinutes + options.bufferMinutes,
    boardingTime: formatISO(boardingTime),
    departureTime: flight.departureTime,
    flight,
    traffic: {
      ...traffic,
      durationMinutes: travelMinutes,
      trafficSummary: estimates.travelSummary,
      source: "Claude research + live grounding",
    },
    security: {
      terminal: flight.terminal,
      airportCode: flight.departureAirport,
      baseWaitMinutes: securityWait,
      adjustedWaitMinutes: securityWait,
      confidence: "live",
      usedSources: ["Live web research by Claude"],
      sourceNotes: [estimates.securitySummary, ...(estimates.researchNotes ?? [])].filter(Boolean),
    },
    weather,
    breakdown: [
      {
        id: "travel",
        icon: options.mode === "transit" ? "train" : "car",
        label: `${options.mode === "transit" ? "Transit" : options.mode === "rideshare" ? "Ride" : "Drive"} to ${flight.departureAirport}${flight.terminal ? ` T${flight.terminal}` : ""}`,
        minutes: travelMinutes,
        detail: estimates.travelSummary,
      },
      {
        id: "bags",
        icon: options.checkedBag ? "briefcase" : "check",
        label: options.checkedBag ? "Check bag at counter" : "Check-in and head inside",
        minutes: bagMinutes,
        detail: options.checkedBag ? "Bag-drop timing researched for this airline at this airport." : "No checked bag time added.",
      },
      {
        id: "security-walk",
        icon: "footprints",
        label: "Walk to security",
        minutes: securityWalk,
        detail: `Curb-to-checkpoint estimate for ${flight.terminal ? `Terminal ${flight.terminal}` : "this terminal"}.`,
      },
      {
        id: "security",
        icon: "shield",
        label: `Security${options.hasClear ? " (CLEAR)" : options.hasPreCheck || options.hasGlobalEntry ? " (PreCheck)" : ""}`,
        minutes: securityWait,
        detail: estimates.securitySummary,
      },
      {
        id: "gate-walk",
        icon: "plane",
        label: flight.gate ? `Walk to gate ${flight.gate}` : "Walk to gate area",
        minutes: gateWalk,
        detail: estimates.gateSummary ?? "Checkpoint-to-gate estimate for this terminal.",
      },
      {
        id: "buffer",
        icon: "clock-3",
        label: "Buffer before boarding",
        minutes: options.bufferMinutes,
        detail: `Targeting ${options.bufferMinutes} minutes after security before boarding at ${formatInZone(boardingTime, timezone)}.`,
      },
    ].filter((item) => item.minutes > 0 || item.id === "buffer"),
    warnings: (estimates.warnings ?? []).slice(0, 6),
    proTips: (estimates.proTips ?? []).slice(0, 4),
    peakDayLabel: estimates.peakDayLabel ?? null,
    dataQuality: estimates.confidence === "low" ? "mixed" : "live",
    isLate: isBefore(leaveByTime, new Date()),
  };
}
