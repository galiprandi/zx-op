import { BarChart3, Menu, Package, QrCode, Settings, Target, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SiteBrand } from "@/components/SiteBrand";

interface DesktopShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DesktopShell({ children, className }: DesktopShellProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  usePageTitle(); // Actualiza el título dinámicamente según la ruta

  const navItems = [
    { path: "/checkin", label: "Check-in", icon: Package },
    { path: "/operation", label: "Operación", icon: Target },
    { path: "/monitor", label: "Monitor", icon: BarChart3 },
    { path: "/products", label: "Productos", icon: Settings },
    { path: "/accesos", label: "Accesos", icon: QrCode },
  ];

  return (
    <div className={cn("min-h-screen bg-background text-foreground flex", className)}>
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex md:w-48 lg:w-56 bg-card/50 backdrop-blur border-r border-border/20 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border/20">
          <SiteBrand variant="full" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status */}
        <div className="p-4 border-t border-border/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Sistema en línea</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-50 bg-card/80 backdrop-blur border-b border-border/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <SiteBrand variant="compact" className="flex items-center gap-2" />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="mt-4 space-y-2 animate-fadeIn">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      location.pathname === item.path
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
