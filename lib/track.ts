import { track as vercelTrack } from "@vercel/analytics";

type Value = string | number | boolean | null;

/**
 * Anonymous product events (Vercel Web Analytics: no cookies, no cross-site tracking).
 * Never pass addresses, coordinates or anything that identifies a person. Keep to two properties.
 */
export function track(name: string, props?: Record<string, Value>) {
  try {
    vercelTrack(name, props);
  } catch {
    // analytics must never break the app
  }
}
