"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  minLabel?: string;
  maxLabel?: string;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      onValueChange,
      min,
      max,
      step,
      minLabel,
      maxLabel,
      className,
      disabled,
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center gap-4">
          {minLabel && (
            <span className="text-sm text-text-muted shrink-0">{minLabel}</span>
          )}
          <div className="relative flex-1 h-10 flex items-center">
            <div className="absolute inset-x-0 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-100"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <input
              ref={ref}
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onValueChange(Number(e.target.value))}
              disabled={disabled}
              className="absolute inset-x-0 w-full h-10 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div
              className="absolute w-5 h-5 bg-accent rounded-full shadow-md border-2 border-white pointer-events-none transition-all duration-100"
              style={{ left: `calc(${percentage}% - 10px)` }}
            />
          </div>
          {maxLabel && (
            <span className="text-sm text-text-muted shrink-0">{maxLabel}</span>
          )}
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
