import { cn } from "@/lib/utils";

interface SessionRowProps {
  barcodeId: string;
  rightText: string;
  className?: string;
  tone?: "green" | "yellow" | "orange" | "red" | "muted";
}

const formatId = (barcodeId: string) => {
  if (!barcodeId) return "-";
  return barcodeId.slice(-6);
};

const toneClass: Record<Required<SessionRowProps>["tone"], string> = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  orange: "text-orange-400",
  red: "text-red-500",
  muted: "text-muted-foreground",
};

export function SessionRow({ 
  barcodeId, 
  rightText,
  className,
  tone = "muted",
}: SessionRowProps) {
  return (
    <div className={cn(
      "flex justify-between px-2",
      className
    )}>
      <div className="font-mono text-sm font-medium text-foreground">
        {formatId(barcodeId)}
      </div>

      <div className={cn("font-mono text-sm font-semibold text-right", toneClass[tone])}>
        {rightText}
      </div>
    </div>
  );
}
