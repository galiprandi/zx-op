import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  
  const navItems = [
    { path: '/checkin', label: 'Check-in', icon: '📝' },
    { path: '/operation', label: 'Operación', icon: '🎯' },
    { path: '/monitor', label: 'Monitor', icon: '📊' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Zona Xtreme</h1>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-4 py-3">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          Zona Xtreme Operation System v1.0
        </div>
      </footer>
    </div>
  )
}
