import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const STAR = "M50 0A50 50 0 0 0 100 50A50 50 0 0 0 50 100A50 50 0 0 0 0 50A50 50 0 0 0 50 0Z";
const LENS = "M50 0A62 62 0 0 1 50 100A62 62 0 0 1 50 0Z";

const fontCache = new Map<string, Promise<ArrayBuffer | null>>();
/** A Google font as TTF. An old user agent makes Google Fonts serve truetype instead of woff2, which the renderer can't parse. */
function googleFont(family: string, weight: number, italic = false): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}:${italic}`;
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      (async () => {
        try {
          const spec = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
          const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${spec}`, {
            headers: { "User-Agent": "Mozilla/4.0" },
          }).then((r) => r.text());
          const url = css.match(/src: url\(([^)]+\.ttf)\)/)?.[1];
          if (!url) return null;
          const res = await fetch(url);
          if (!res.ok) return null;
          return await res.arrayBuffer();
        } catch {
          return null;
        }
      })(),
    );
  }
  return fontCache.get(key)!;
}

/** 1200x630 preview card for a shared plan. */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const leave = p.get("leave");
  const day = p.get("day") ?? "";
  const flight = p.get("flight") ?? "";
  const route = p.get("route") ?? "";
  const dep = p.get("dep") ?? "";
  const terminal = p.get("terminal") ?? "";
  const spare = p.get("spare") ?? "";
  const [displayData, bodyData] = await Promise.all([googleFont("Fraunces", 600), googleFont("Instrument Sans", 500)]);
  const fonts = [
    ...(displayData ? [{ name: "Fraunces", data: displayData, weight: 600 as const, style: "normal" as const }] : []),
    ...(bodyData ? [{ name: "Instrument Sans", data: bodyData, weight: 500 as const, style: "normal" as const }] : []),
  ];
  const display = displayData ? "Fraunces" : "serif";
  const body = bodyData ? "Instrument Sans" : "sans-serif";

  const mark = (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width="44" height="44" viewBox="0 0 100 100">
        <path d={STAR} fill="#1F2030" />
        <circle cx="50" cy="50" r="9" fill="#E36F58" />
      </svg>
      <div style={{ fontFamily: display, fontSize: 40, fontWeight: 600, color: "#1F2030", letterSpacing: -0.5 }}>Leave By</div>
    </div>
  );

  const geometry = (
    <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
      <path d={LENS} transform="translate(330 -40) scale(5.4 7.1)" fill="#F8D9D0" />
      <path d="M0 630A260 260 0 0 1 260 370V630Z" fill="#F2B3A5" opacity="0.7" />
      <path d={STAR} transform="translate(980 60) scale(1.5)" fill="#F4D48B" />
      <circle cx="1055" cy="135" r="8" fill="#FCFAF6" />
      <path d={STAR} transform="translate(1030 470) scale(0.8)" fill="#1F2030" />
      <circle cx="1070" cy="510" r="6" fill="#FCFAF6" />
    </svg>
  );

  if (!leave) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#F3EEE5", position: "relative", fontFamily: body }}>
          {geometry}
          {mark}
          <div style={{ fontFamily: display, fontSize: 108, fontWeight: 600, color: "#1F2030", lineHeight: 1.02, letterSpacing: -3, display: "flex", flexDirection: "column" }}>
            <span>When do I</span>
            <span>
              need to <span style={{ color: "#E36F58", marginLeft: 22 }}>leave?</span>
            </span>
          </div>
          <div style={{ fontSize: 32, color: "#62606F" }}>Tell it your flight. It tells you when to walk out the door.</div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 64, background: "#F3EEE5", position: "relative", fontFamily: body }}>
        {geometry}
        {mark}
        <div style={{ marginTop: 24, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, letterSpacing: 8, color: "#62606F", fontWeight: 500 }}>LEAVE BY</div>
          <div style={{ fontFamily: display, fontSize: 220, fontWeight: 600, color: "#1F2030", lineHeight: 1, letterSpacing: -8, marginTop: 4 }}>{leave}</div>
          <div style={{ fontSize: 34, color: "#1F2030", marginTop: 6 }}>{day}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, fontSize: 27, color: "#62606F", whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <span style={{ fontFamily: display, fontWeight: 600, color: "#1F2030", fontSize: 34 }}>{flight}</span>
            <span>{route}</span>
            <span>departs {dep}</span>
            {terminal ? <span>Terminal {terminal}</span> : null}
          </div>
          {spare ? <span>{spare} min spare before boarding</span> : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}
