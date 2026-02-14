import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RevealValueProps {
  value: string | number;
  className?: string;
  size?: "sm" | "md" | "lg";
  format?: "currency" | "number" | "text";
}

const sizeClasses = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
};

export function RevealValue({ 
  value, 
  className, 
  size = "md", 
  format = "currency" 
}: RevealValueProps) {
  const [isRevealed, setIsRevealed] = useState(true);

  const formatValue = () => {
    if (!isRevealed) return "--,--";
    
    if (format === "currency" && typeof value === "number") {
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
      }).format(value);
    }
    
    if (format === "number" && typeof value === "number") {
      return value.toLocaleString("es-CL");
    }
    
    return String(value);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("font-bold font-mono", sizeClasses[size])}>
        {formatValue()}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsRevealed(!isRevealed)}
        className="h-8 w-8 p-0 hover:bg-accent"
      >
        {isRevealed ? (
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Eye className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
