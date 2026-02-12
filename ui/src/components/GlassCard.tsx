import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  title?: string;
  padding?: "sm" | "md" | "lg";
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function GlassCard({ children, className, header, title, padding = "md" }: GlassCardProps) {
  return (
    <Card className={cn(
      "glass bg-card/70 backdrop-blur border-border/20 shadow-xl",
      paddingClasses[padding],
      className
    )}>
      {(header || title) && (
        <CardHeader className="pb-4">
          {header}
          {title && <CardTitle className="text-foreground">{title}</CardTitle>}
        </CardHeader>
      )}
      <CardContent className={cn(title && "pt-0")}>
        {children}
      </CardContent>
    </Card>
  );
}
