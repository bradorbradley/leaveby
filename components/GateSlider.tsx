"use client";

export function GateSlider({
  value,
  onChange,
  id = "gate",
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  id?: string;
  compact?: boolean;
}) {
  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
          Time at the gate
        </label>
        <span className={`font-display font-black tabular-nums leading-none ${compact ? "text-[22px]" : "text-[34px]"}`}>
          {value}
          <span className="ml-1 font-sans text-[13px] font-semibold text-ink-2">min</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="gate mt-1"
        min={10}
        max={90}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value} minutes at the gate before boarding`}
      />
      <div className="flex justify-between text-[11px] font-semibold text-ink-3">
        <span>Tight</span>
        <span>Relaxed</span>
      </div>
    </div>
  );
}
