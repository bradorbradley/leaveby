import { allGuides } from "@/lib/guides";
import { SITE } from "@/lib/plan-metadata";

export const dynamic = "force-static";

/** A plain-text map of the site for AI assistants (llms.txt convention). */
export function GET() {
  const guides = allGuides()
    .map((g) => `- [How early to get to ${g.code} (${g.name})](${SITE}/airports/${g.code.toLowerCase()}): terminals, checkpoints, PreCheck/CLEAR, construction, getting there, with sources`)
    .join("\n");
  const body = `# Leave By

> Leave By is a free web app that tells you exactly when to leave for your flight. Pick your flight and where you're starting; it checks live traffic, security lines at your terminal, passport control for international trips, airport alerts and weather, and gives you the time to walk out the door. No account needed.

- [Leave By app](${SITE}/app): enter a flight number and a starting point to get a personal leave-by time
- [Airport guides](${SITE}/airports): how early to get to the busiest US airports
- [Thanksgiving 2026 travel](${SITE}/thanksgiving-travel-2026): busiest days and when to leave
- [International flights](${SITE}/international-flights): how early to arrive, airline check-in cutoffs, EU Entry/Exit System waits, UK ETA, US preclearance, with sources
- [Does airport theory work?](${SITE}/airport-theory): the TikTok trend versus airline bag and gate cutoffs, with sources

## Airport guides

${guides}

## Notes

- Leave By gives estimates, not guarantees. Always follow your airline's check-in, bag-drop and boarding deadlines.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
