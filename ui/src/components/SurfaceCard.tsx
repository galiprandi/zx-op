import { type ReactNode } from "react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

interface SurfaceCardProps {
  children: ReactNode;
  className?: string;
  contentPaddingClassName?: string;
}

export function SurfaceCard({
  children,
  className,
  contentPaddingClassName = "[&>div]:p-5",
}: SurfaceCardProps) {
  return (
    <GlassCard
      className={cn(
        "!p-0 bg-slate-100/85 border border-slate-200 rounded-xl shadow-none",
        contentPaddingClassName,
        className,
      )}
    >
      {children}
    </GlassCard>
  );
}
