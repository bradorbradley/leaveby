export interface GeocodedPlace {
  lat: number;
  lon: number;
  label: string;
}

/**
 * Geocode a user-entered origin (ZIP, neighborhood, or address) using free,
 * key-less services: zippopotam.us for ZIP codes, Photon (OSM) for free text.
 * `near` biases free-text results toward the departure airport's metro area.
 */
export async function geocodeOrigin(
  input: string,
  near?: { lat: number; lon: number },
): Promise<GeocodedPlace | null> {
  const text = input.trim();
  if (!text) return null;

  const zip = text.match(/\b(\d{5})\b/)?.[1];
  if (zip) {
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (response.ok) {
        const json = (await response.json()) as {
          places?: Array<{ "place name": string; "state abbreviation": string; latitude: string; longitude: string }>;
        };
        const place = json.places?.[0];
        if (place) {
          return {
            lat: Number(place.latitude),
            lon: Number(place.longitude),
            label: `${place["place name"]}, ${place["state abbreviation"]}`,
          };
        }
      }
    } catch {
      // fall through to Photon
    }
  }

  try {
    const params = new URLSearchParams({ q: text, limit: "1", lang: "en" });
    if (near) {
      params.set("lat", String(near.lat));
      params.set("lon", String(near.lon));
    }
    const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      features?: Array<{
        geometry: { coordinates: [number, number] };
        properties: { name?: string; street?: string; housenumber?: string; district?: string; city?: string; state?: string };
      }>;
    };
    const feature = json.features?.[0];
    if (!feature) return null;
    const { name, street, housenumber, district, city, state } = feature.properties;
    const line = [housenumber, street].filter(Boolean).join(" ") || name;
    return {
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
      label: [line, district ?? city ?? state].filter(Boolean).join(", "),
    };
  } catch {
    return null;
  }
}
