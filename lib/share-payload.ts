import type { PlanRequest, PlanResult } from "@/types/plan";

/**
 * A shared link carries the finished plan, compressed, so the recipient sees
 * it instantly. The `f`, `d`, … params stay alongside as a fallback that
 * re-runs the search if the payload can't be decoded.
 */
export interface SharedPlan {
  v: 1;
  request: PlanRequest;
  result: PlanResult;
}

export function slimForShare(request: PlanRequest, result: PlanResult): SharedPlan {
  return {
    v: 1,
    request,
    result: {
      ...result,
      flight: { ...result.flight, notes: [] },
      research: { ...result.research, sources: [] },
    },
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Browser side: deflate + base64url. Returns null where CompressionStream is unavailable. */
export async function encodeSharedPlan(plan: SharedPlan): Promise<string | null> {
  try {
    if (typeof CompressionStream === "undefined") return null;
    const json = new TextEncoder().encode(JSON.stringify(plan));
    const stream = new Blob([json as BlobPart]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    return toBase64Url(buf);
  } catch {
    return null;
  }
}

/** Browser side decode. */
export async function decodeSharedPlanClient(p: string): Promise<SharedPlan | null> {
  try {
    if (typeof DecompressionStream === "undefined") return null;
    const bytes = fromBase64Url(p);
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const text = await new Response(stream).text();
    return validateSharedPlan(JSON.parse(text));
  } catch {
    return null;
  }
}

export function validateSharedPlan(x: unknown): SharedPlan | null {
  const s = x as Partial<SharedPlan>;
  if (!s || s.v !== 1 || !s.request || !s.result) return null;
  const r = s.result;
  if (!r.flight?.flightNumber || !r.flight.departureTime || !r.research || !r.leaveISO || !Array.isArray(r.timeline)) return null;
  return s as SharedPlan;
}
