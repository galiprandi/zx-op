import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: "primary" | "success" | "warning" | "danger" | "muted";
  className?: string;
  footer?: ReactNode;
}

const colorClasses = {
  primary: "text-blue-600",
  success: "text-emerald-600",
  warning: "text-amber-500",
  danger: "text-rose-600",
  muted: "text-slate-500",
};

export function KPICard({
  title,
  value,
  icon: Icon,
  description,
  color = "primary",
  className,
  footer,
}: KPICardProps) {
  const iconColor = colorClasses[color];

  return (
    <GlassCard className={cn("!p-0 bg-slate-300/85 border-2 border-slate-600 rounded-xl shadow-none", className)}>
      <div className="p-6 md:px-8 md:py-7">
        <div className="flex items-center gap-3">
          <Icon className={cn("w-6 h-6 shrink-0", iconColor)} />
          <p className="text-4xl md:text-5xl font-extrabold leading-none text-slate-900">{value}</p>
        </div>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-700">{title}</p>
        {description && <p className="mt-3 text-xs text-slate-500">{description}</p>}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </GlassCard>
  );
}
