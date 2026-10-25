import { type DayCount, fmt, formatDay } from "@/lib/tsa-volumes";

// One-hue coral ramp, light to dark (validated as an ordinal ramp against --paper: monotone, light end ≥ 2:1).
const BINS = [
  { min: 0, label: "Under 2.0M", color: "#eda08e" },
  { min: 2_000_000, label: "2.0–2.3M", color: "#e07c63" },
  { min: 2_300_000, label: "2.3–2.6M", color: "#cc5c42" },
  { min: 2_600_000, label: "2.6–2.9M", color: "#a6432d" },
  { min: 2_900_000, label: "2.9M+", color: "#74291b" },
];
const binColor = (n: number) => [...BINS].reverse().find((b) => n >= b.min)!.color;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CELL = 13;
const GAP = 2;

/** A small calendar per month, one square per day shaded by how many people TSA screened. Hover a day for its count. */
export function TsaCalendar({ year, days }: { year: number; days: DayCount[] }) {
  const byMonth = MONTHS.map((_, m) => days.filter((d) => Number(d.date.slice(5, 7)) === m + 1)).filter((xs) => xs.length);
  return (
    <figure className="card !p-4 md:!p-5">
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
        {byMonth.map((xs) => {
          const m = Number(xs[0].date.slice(5, 7)) - 1;
          const lead = new Date(Date.UTC(year, m, 1)).getUTCDay();
          const rows = Math.ceil((lead + new Date(Date.UTC(year, m + 1, 0)).getUTCDate()) / 7);
          const top = xs.reduce((a, b) => (b.count > a.count ? b : a));
          return (
            <div key={m}>
              <p className="mb-1 text-[12px] font-semibold text-ink-2">{MONTHS[m]}</p>
              <svg
                viewBox={`0 0 ${7 * (CELL + GAP) - GAP} ${rows * (CELL + GAP) - GAP}`}
                className="block w-full max-w-[120px]"
                role="img"
                aria-label={`${MONTHS[m]} ${year}: busiest day ${formatDay(top.date, false)}, ${fmt(top.count)} screened`}
              >
                {xs.map((d) => {
                  const i = lead + Number(d.date.slice(8, 10)) - 1;
                  return (
                    <rect key={d.date} x={(i % 7) * (CELL + GAP)} y={Math.floor(i / 7) * (CELL + GAP)} width={CELL} height={CELL} rx={2.5} fill={binColor(d.count)}>
                      <title>{`${formatDay(d.date)}: ${fmt(d.count)} screened`}</title>
                    </rect>
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-ink-2">
        <span className="font-semibold text-ink">People screened per day</span>
        {BINS.map((b) => (
          <span key={b.label} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: b.color }} aria-hidden />
            {b.label}
          </span>
        ))}
        <span className="w-full text-ink-3">Weeks run Sunday to Saturday. Hover or long-press a day for its count.</span>
      </figcaption>
    </figure>
  );
}

/** Average screenings by weekday, bars from zero. */
export function WeekdayBars({ rows }: { rows: { day: string; avg: number }[] }) {
  const max = Math.max(...rows.map((r) => r.avg));
  return (
    <figure className="card !p-4 md:!p-5">
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.day} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 text-[13.5px]" title={`${r.day}: ${fmt(r.avg)} a day on average`}>
            <span className="font-semibold text-ink">{r.day.slice(0, 3)}</span>
            <span className="h-[14px] rounded-r-[4px] bg-[#cc5c42]" style={{ width: `${(r.avg / max) * 100}%` }} aria-hidden />
            <span className="tabular-nums text-ink-2">{(r.avg / 1e6).toFixed(2)}M</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
