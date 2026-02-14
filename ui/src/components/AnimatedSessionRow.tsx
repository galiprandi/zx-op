import { cn } from "@/lib/utils";

interface AnimatedSessionRowProps {
  barcodeId: string;
  rightText: string;
  className?: string;
  tone?: "green" | "yellow" | "orange" | "red" | "muted";
}

const formatId = (barcodeId: string) => {
  if (!barcodeId) return "-";
  return barcodeId.slice(-6);
};

const toneClass: Record<Required<AnimatedSessionRowProps>["tone"], string> = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  orange: "text-orange-400",
  red: "text-red-500",
  muted: "text-muted-foreground",
};

export function AnimatedSessionRow({ 
  barcodeId, 
  rightText,
  className,
  tone = "muted",
}: AnimatedSessionRowProps) {
  return (
    <div 
      className={cn(
        "flex justify-between px-2 transition-all duration-300 ease-out animate-in slide-in-from-left-2 fade-in-0",
        className
      )}
    >
      <div className="font-mono text-sm font-medium text-foreground">
        {formatId(barcodeId)}
      </div>

      <div className={cn("font-mono text-sm font-semibold text-right transition-colors duration-300", toneClass[tone])}>
        {rightText}
      </div>
    </div>
  );
}
