import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1, className }, ref) => {
    const percentage = ((value[0] - min) / (max - min)) * 100;

    return (
      <div ref={ref} className={cn("relative w-full h-6 flex items-center", className)}>
        <div className="absolute w-full h-1.5 bg-secondary rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onValueChange([parseFloat(e.target.value)])}
          className="absolute w-full h-1.5 opacity-0 cursor-pointer"
        />
        <div
          className="absolute w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/30 -translate-x-1/2 pointer-events-none transition-all"
          style={{ left: `${percentage}%` }}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
