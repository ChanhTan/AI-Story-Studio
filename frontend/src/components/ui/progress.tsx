import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
      >
        <div
          className="h-full w-full flex-1 bg-gradient-to-r from-primary to-purple-400 transition-all duration-500 ease-out rounded-full"
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
