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
        <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">
          Spare time before boarding
        </label>
        <span className={`display-soft font-display font-semibold leading-none ${compact ? "text-[24px]" : "text-[34px]"}`}>
          {value}
          <span className="ml-1 font-sans text-[13px] font-medium text-ink-2">min</span>
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
        aria-valuetext={`${value} minutes of spare time before boarding`}
      />
      <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
        <span>Tight</span>
        <span>Relaxed</span>
      </div>
    </div>
  );
}
