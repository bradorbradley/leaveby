import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const fontCache = new Map<string, Promise<ArrayBuffer | null>>();
/** A Google font as TTF. An old user agent makes Google Fonts serve truetype instead of woff2, which the renderer can't parse. */
function googleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      (async () => {
        try {
          const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`, {
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
  const [displayData, bodyData] = await Promise.all([googleFont("Gabarito", 900), googleFont("Figtree", 600)]);
  const fonts = [
    ...(displayData ? [{ name: "Gabarito", data: displayData, weight: 900 as const, style: "normal" as const }] : []),
    ...(bodyData ? [{ name: "Figtree", data: bodyData, weight: 600 as const, style: "normal" as const }] : []),
  ];
  const display = displayData ? "Gabarito" : "sans-serif";
  const body = bodyData ? "Figtree" : "sans-serif";

  const mark = (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 56, height: 56, background: "#7E5FD0", borderRadius: "50% 50% 50% 22%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, background: "#F9E48F", borderRadius: 999 }} />
      </div>
      <div style={{ fontFamily: display, fontSize: 44, fontWeight: 900, color: "#2E2540", letterSpacing: -1 }}>Leave By</div>
    </div>
  );

  if (!leave) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#FBF6EF", fontFamily: body }}>
          {mark}
          <div style={{ fontFamily: display, fontSize: 96, fontWeight: 900, color: "#2E2540", lineHeight: 1.02, letterSpacing: -3, display: "flex", flexDirection: "column" }}>
            <span>When do I</span>
            <span style={{ background: "#F9E48F", padding: "0 18px", borderRadius: 24, alignSelf: "flex-start" }}>need to leave?</span>
          </div>
          <div style={{ fontSize: 34, color: "#6A5F7E" }}>Tell it your flight. It tells you when to walk out the door.</div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 64, background: "#FBF6EF", fontFamily: body }}>
        {mark}
        <div style={{ marginTop: 40, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#D9C8F5", borderRadius: 48, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: -80, top: -100, width: 280, height: 280, borderRadius: 999, background: "rgba(248,203,214,0.8)" }} />
          <div style={{ position: "absolute", right: -60, bottom: -90, width: 220, height: 220, borderRadius: 999, background: "rgba(249,228,143,0.9)" }} />
          <div style={{ fontSize: 26, letterSpacing: 6, color: "#6A5F7E" }}>LEAVE BY</div>
          <div style={{ fontFamily: display, fontSize: 200, fontWeight: 900, color: "#2E2540", lineHeight: 1, letterSpacing: -8, marginTop: 8 }}>{leave}</div>
          <div style={{ fontSize: 34, color: "#2E2540", marginTop: 6 }}>{day}</div>
        </div>
        <div style={{ marginTop: 32, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 30, color: "#6A5F7E", whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span style={{ fontFamily: display, fontWeight: 900, color: "#2E2540", fontSize: 34 }}>{flight}</span>
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
