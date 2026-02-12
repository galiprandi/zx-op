import { Play, Pause, AlertCircle, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType = "playing" | "paused" | "expired" | "expiring" | "waiting";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  playing: {
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: Play,
    label: "En Juego",
  },
  paused: {
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: Pause,
    label: "Pausado",
  },
  expired: {
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertCircle,
    label: "Tiempo Agotado",
  },
  expiring: {
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: Clock,
    label: "Expirando",
  },
  waiting: {
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Users,
    label: "Esperando",
  },
};

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

export function StatusBadge({ status, className, showIcon = true, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium",
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
    </div>
  );
}
