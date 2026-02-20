import { formatTimeValue } from "@/api/products";
import { SessionTime } from "@/components/SessionTime";
import { cn } from "@/lib/utils";
import { sessionTextColorClass, type SessionVisualState } from "@/lib/sessionVisual";

interface BigTimerProps {
  seconds: number;
  className?: string;
  size?: "md" | "lg" | "xl";
  showMinutes?: boolean;
  visualState?: SessionVisualState;
}

const sizeClasses = {
  md: "text-4xl",
  lg: "text-6xl", 
  xl: "text-8xl",
};

const timerSizeByBigTimerSize = {
  md: "lg",
  lg: "xl",
  xl: "xl",
} as const;

const fallbackStateBySeconds = (seconds: number): SessionVisualState => {
  if (seconds <= 0) return "expired";
  if (seconds <= 60) return "expiring";
  return "playing";
};

export function BigTimer({ seconds, className, size = "lg", showMinutes = true, visualState }: BigTimerProps) {
  const minutes = Math.floor(seconds / 60);
  const resolvedState = visualState ?? fallbackStateBySeconds(seconds);
  const colorClass = sessionTextColorClass[resolvedState];

  return (
    <div className={cn("font-bold", sizeClasses[size], className)}>
      <SessionTime
        seconds={seconds}
        visualState={resolvedState}
        format="adaptive"
        className={colorClass}
        size={timerSizeByBigTimerSize[size]}
      />
      {showMinutes && seconds > 0 && (
        <div className="text-sm font-normal text-muted-foreground mt-1 text-center">
          {seconds >= 3600 ? `${formatTimeValue(seconds)} restantes` : `${minutes} min restantes`}
        </div>
      )}
    </div>
  );
}
