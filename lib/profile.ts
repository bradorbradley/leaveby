import type { Perks } from "@/types/plan";

export interface SavedPlace {
  label: string;
  lat: number;
  lon: number;
}

export interface Profile {
  perks: Perks;
  bufferMinutes: number;
  home: SavedPlace | null;
  recents: SavedPlace[];
}

const KEY = "leaveby.profile.v1";

export const defaultProfile: Profile = {
  perks: { precheck: false, clear: false, globalEntry: false, touchlessId: false },
  bufferMinutes: 30,
  home: null,
  recents: [],
};

export function loadProfile(): Profile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      perks: { ...defaultProfile.perks, ...(parsed.perks ?? {}) },
      bufferMinutes: typeof parsed.bufferMinutes === "number" ? parsed.bufferMinutes : defaultProfile.bufferMinutes,
      home: parsed.home ?? null,
      recents: Array.isArray(parsed.recents) ? parsed.recents.slice(0, 3) : [],
    };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // storage unavailable; ignore
  }
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function rememberOrigin(profile: Profile, place: SavedPlace): Profile {
  if (profile.home && sameLabel(profile.home.label, place.label)) return profile;
  const recents = [place, ...profile.recents.filter((p) => !sameLabel(p.label, place.label))].slice(0, 3);
  return { ...profile, recents };
}

export function profileIsEmpty(p: Profile) {
  return !p.home && !p.recents.length && !Object.values(p.perks).some(Boolean);
}

function sameLabel(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
