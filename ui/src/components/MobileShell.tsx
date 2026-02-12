import { cn } from "@/lib/utils";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  showStatusDot?: boolean;
  footer?: React.ReactNode;
}

export function MobileShell({ 
  children, 
  className, 
  title, 
  showStatusDot = true,
  footer 
}: MobileShellProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col",
      className
    )}>
      {/* Header minimal */}
      {(title || showStatusDot) && (
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur border-b border-border/20 px-4 py-3">
          <div className="flex items-center justify-between">
            {title && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">ZX</span>
                </div>
                <h1 className="text-lg font-bold text-foreground">{title}</h1>
              </div>
            )}
            {showStatusDot && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-6">
        <div className="animate-fadeIn">{children}</div>
      </main>

      {/* Fixed footer */}
      {footer && (
        <footer className="sticky bottom-0 bg-card border-t border-border/20 p-4 z-10">
          {footer}
        </footer>
      )}
    </div>
  );
}
