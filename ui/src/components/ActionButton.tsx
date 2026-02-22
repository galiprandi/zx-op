import { Check, AlertCircle, Loader2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionButtonVariant = "cta" | "secondary" | "cancel" | "danger";
type ActionButtonTone = "default" | "success" | "warning";

interface ActionButtonProps {
  variant: ActionButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: "md" | "lg" | "xl";
  fullWidth?: boolean;
  icon?: LucideIcon;
  tone?: ActionButtonTone;
  children?: React.ReactNode;
}

const buttonConfig = {
  cta: {
    baseClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
    defaultIcon: Check,
  },
  secondary: {
    baseClass: "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60",
    defaultIcon: Check,
  },
  cancel: {
    baseClass: "bg-transparent hover:bg-secondary/50 text-foreground border border-border/60",
    defaultIcon: X,
  },
  danger: {
    baseClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    defaultIcon: AlertCircle,
  },
};

const sizeClasses = {
  md: "h-12 text-base",
  lg: "h-14 text-lg",
  xl: "h-16 text-xl",
};

const ctaToneClasses: Record<ActionButtonTone, string> = {
  default: "bg-primary hover:bg-primary/90 text-primary-foreground",
  success: "bg-green-600 hover:bg-green-700 text-white",
  warning: "bg-orange-600 hover:bg-orange-700 text-white",
};

export function ActionButton({
  variant,
  onClick,
  disabled = false,
  loading = false,
  className,
  size = "lg",
  fullWidth = true,
  icon,
  tone = "default",
  children,
}: ActionButtonProps) {
  const config = buttonConfig[variant];
  const Icon = loading ? Loader2 : icon ?? config.defaultIcon;
  const ctaClass = variant === "cta" ? ctaToneClasses[tone] : "";

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "font-semibold rounded-xl transition-all duration-200 min-h-[44px] disabled:opacity-60 disabled:saturate-50 disabled:contrast-75",
        config.baseClass,
        ctaClass,
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
