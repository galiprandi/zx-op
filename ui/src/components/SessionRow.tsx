import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "./StatusBadge";
import { BigTimer } from "./BigTimer";
import { cn } from "@/lib/utils";

interface SessionRowProps {
  barcodeId: string;
  remainingSeconds: number;
  isActive: boolean;
  progress: number;
  className?: string;
  showProgress?: boolean;
}

export function SessionRow({ 
  barcodeId, 
  remainingSeconds, 
  isActive, 
  progress, 
  className,
  showProgress = true 
}: SessionRowProps) {
  const getStatus = () => {
    if (remainingSeconds <= 0) return "expired";
    if (remainingSeconds <= 60) return "expiring";
    if (!isActive) return "paused";
    return "playing";
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/20",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="font-mono text-lg font-medium text-foreground">
          {barcodeId}
        </div>
        <StatusBadge status={getStatus()} size="sm" />
      </div>
      
      <div className="flex items-center gap-4">
        <BigTimer 
          seconds={remainingSeconds} 
          size="md" 
          showMinutes={false}
        />
        {showProgress && (
          <div className="w-20">
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
}
