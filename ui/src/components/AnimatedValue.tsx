import { cn } from "@/lib/utils";

interface AnimatedValueProps {
  value: string | number;
  className?: string;
  format?: "currency" | "number" | "text";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export function AnimatedValue({ 
  value, 
  className, 
  format = "number",
  size = "md"
}: AnimatedValueProps) {
  const formatValue = () => {
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
    <span 
      className={cn(
        "font-bold font-mono transition-all duration-300 hover:scale-105",
        sizeClasses[size],
        className
      )}
    >
      {formatValue()}
    </span>
  );
}
