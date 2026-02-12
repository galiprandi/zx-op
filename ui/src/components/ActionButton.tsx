import { Play, Pause, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionButtonType = "play" | "pause" | "checkin" | "danger";

interface ActionButtonProps {
  type: ActionButtonType;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: "md" | "lg" | "xl";
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const buttonConfig = {
  play: {
    baseClass: "bg-green-600 hover:bg-green-700 text-white",
    icon: Play,
    loadingIcon: Loader2,
  },
  pause: {
    baseClass: "bg-orange-600 hover:bg-orange-700 text-white",
    icon: Pause,
    loadingIcon: Loader2,
  },
  checkin: {
    baseClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
    icon: Check,
    loadingIcon: Loader2,
  },
  danger: {
    baseClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    icon: AlertCircle,
    loadingIcon: Loader2,
  },
};

const sizeClasses = {
  md: "h-12 text-base",
  lg: "h-14 text-lg",
  xl: "h-16 text-xl",
};

export function ActionButton({
  type,
  onClick,
  disabled = false,
  loading = false,
  className,
  size = "lg",
  fullWidth = true,
  children,
}: ActionButtonProps) {
  const config = buttonConfig[type];
  const Icon = loading ? config.loadingIcon : config.icon;

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "font-bold rounded-xl transition-all duration-200 min-h-[44px]",
        config.baseClass,
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
    >
      <Icon className={cn("w-5 h-5", loading && "animate-spin")} />
      {children}
    </Button>
  );
}
