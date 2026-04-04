import { airlineProfiles } from "@/lib/airports/data";

export function getStatusOptions(airlineCode: string) {
  const airline = airlineProfiles.find((entry) => entry.code === airlineCode.toUpperCase());
  return airline?.statusTiers ?? ["None", "Priority / First", "Elite status"];
}
