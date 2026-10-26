import { HOURLY_DAYS, hourLabel } from "@/lib/tsa-hourly";
import { type DayCount, fmt, formatDay } from "@/lib/tsa-volumes";

// One-hue coral ramp, light to dark (validated as an ordinal ramp against --paper: monotone, light end ≥ 2:1).
const RAMP = ["#eda08e", "#e07c63", "#cc5c42", "#a6432d", "#74291b"];
type Bin = { min: number; label: string; color: string };
const bins = (mins: number[], labels: string[]): Bin[] => mins.map((min, i) => ({ min, label: labels[i], color: RAMP[i] }));
const binColor = (list: Bin[], n: number) => [...list].reverse().find((b) => n >= b.min)!.color;

const BINS = bins([0, 2_000_000, 2_300_000, 2_600_000, 2_900_000], ["Under 2.0M", "2.0–2.3M", "2.3–2.6M", "2.6–2.9M", "2.9M+"]);

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
                    <rect key={d.date} x={(i % 7) * (CELL + GAP)} y={Math.floor(i / 7) * (CELL + GAP)} width={CELL} height={CELL} rx={2.5} fill={binColor(BINS, d.count)}>
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

/** Average people screened in each local hour, 24 columns from midnight, bars from zero. */
export function HourBars({ avg }: { avg: number[] }) {
  const max = Math.max(...avg);
  return (
    <figure className="card !p-4 md:!p-5">
      <div className="flex h-[180px] items-end gap-[2px]" role="img" aria-label={`Average people screened per hour; busiest at ${hourLabel(avg.indexOf(max))}`}>
        {avg.map((n, h) => (
          <div key={h} className="flex h-full flex-1 items-end" title={`${hourLabel(h)}–${hourLabel((h + 1) % 24)}: about ${fmt(n)} people`}>
            <span className="block w-full rounded-t-[3px] bg-[#cc5c42]" style={{ height: `${Math.max((n / max) * 100, 0.8)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex text-[11px] text-ink-3">
        {avg.map((_, h) => (
          <span key={h} className="flex-1 text-center">{h % 6 === 0 ? hourLabel(h) : ""}</span>
        ))}
      </div>
      <figcaption className="mt-3 text-[12px] text-ink-2">People screened per hour on an average day, local time at each airport. Hover a bar for its count.</figcaption>
    </figure>
  );
}

const HOUR_BINS = bins([0, 50_000, 100_000, 140_000, 170_000], ["Under 50K", "50–100K", "100–140K", "140–170K", "170K+"]);

/** One row per day, one square per hour, shaded by people screened nationally. */
export function DayHourHeatmap({ grid, dates }: { grid: number[][]; dates: string[] }) {
  return (
    <figure className="card !p-4 md:!p-5">
      <div className="grid grid-cols-[30px_1fr] items-center gap-x-2 gap-y-[2px]">
        {grid.map((row, d) => (
          <div key={d} className="contents">
            <span className="text-[11.5px] font-semibold text-ink-2">{HOURLY_DAYS[d]}</span>
            <svg viewBox={`0 0 ${24 * 12} 12`} className="block w-full" role="img" aria-label={`${HOURLY_DAYS[d]} ${dates[d]}: busiest at ${hourLabel(row.indexOf(Math.max(...row)))}`}>
              {row.map((n, h) => (
                <rect key={h} x={h * 12} y={0} width={10.5} height={12} rx={2} fill={binColor(HOUR_BINS, n)}>
                  <title>{`${HOURLY_DAYS[d]} ${dates[d]}, ${hourLabel(h)}: ${fmt(n)} screened`}</title>
                </rect>
              ))}
            </svg>
          </div>
        ))}
        <span />
        <div className="flex text-[11px] text-ink-3">
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="flex-1">{h % 6 === 0 ? hourLabel(h) : ""}</span>
          ))}
        </div>
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-ink-2">
        <span className="font-semibold text-ink">People screened per hour</span>
        {HOUR_BINS.map((b) => (
          <span key={b.label} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: b.color }} aria-hidden />
            {b.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
