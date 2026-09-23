import { inflateRawSync } from "node:zlib";

import { fromBase64Url, validateSharedPlan, type SharedPlan } from "@/lib/share-payload";

/** Server side decode of a shared plan payload (used for Open Graph metadata). */
export function decodeSharedPlanServer(p: string): SharedPlan | null {
  try {
    const text = inflateRawSync(Buffer.from(fromBase64Url(p))).toString("utf8");
    return validateSharedPlan(JSON.parse(text));
  } catch {
    return null;
  }
}
