import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: "primary" | "success" | "warning" | "danger" | "muted";
  className?: string;
  footer?: ReactNode;
}

const colorClasses = {
  primary: "text-primary",
  success: "text-green-400",
  warning: "text-yellow-400", 
  danger: "text-red-400",
  muted: "text-muted-foreground",
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  color = "primary",
  className,
  footer,
}: StatCardProps) {
  const iconColor = colorClasses[color];

  return (
    <GlassCard className={cn("text-center", className)}>
      <div className="flex items-center justify-center mb-3">
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-bold text-foreground">
          {value}
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {title}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground mt-2">
            {description}
          </div>
        )}
        {footer && (
          <div className="mt-3">
            {footer}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
