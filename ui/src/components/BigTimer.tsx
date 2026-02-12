import { cn } from "@/lib/utils";

interface BigTimerProps {
  seconds: number;
  className?: string;
  size?: "md" | "lg" | "xl";
  showMinutes?: boolean;
}

const sizeClasses = {
  md: "text-4xl",
  lg: "text-6xl", 
  xl: "text-8xl",
};

const getColorClass = (seconds: number): string => {
  if (seconds <= 0) return "text-red-500";
  if (seconds <= 60) return "text-red-400";
  if (seconds <= 300) return "text-yellow-400";
  return "text-green-400";
};

export function BigTimer({ seconds, className, size = "lg", showMinutes = true }: BigTimerProps) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const colorClass = getColorClass(seconds);

  const formatTime = () => {
    if (seconds <= 0) return "00:00";
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("font-mono font-bold", sizeClasses[size], colorClass, className)}>
      {formatTime()}
      {showMinutes && seconds > 0 && (
        <div className="text-sm font-normal text-muted-foreground mt-1 text-center">
          {minutes} min restantes
        </div>
      )}
    </div>
  );
}
