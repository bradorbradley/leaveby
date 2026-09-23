import type { Metadata } from "next";

import { HomeClient } from "@/components/HomeClient";
import { Landing } from "@/components/landing/Landing";
import { hasPlanParams, landingMetadata, planMetadata, type SearchParams } from "@/lib/plan-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  return planMetadata(searchParams, landingMetadata);
}

/** The front door. A link that carries a plan opens straight into it. */
export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  if (hasPlanParams(params)) return <HomeClient />;
  return <Landing />;
}
