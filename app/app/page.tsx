import type { Metadata } from "next";

import { HomeClient } from "@/components/HomeClient";
import { planMetadata, type SearchParams } from "@/lib/plan-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  return planMetadata(searchParams);
}

export default function AppPage() {
  return <HomeClient />;
}
