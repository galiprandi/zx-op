import { BarChart3, Menu, Package, Settings, Target, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const navItems = [
		{ path: "/checkin", label: "Check-in", icon: Package },
		{ path: "/operation", label: "Operación", icon: Target },
		{ path: "/monitor", label: "Monitor", icon: BarChart3 },
		{ path: "/products", label: "Productos", icon: Settings },
	];

	return (
		<div className="min-h-screen bg-background text-foreground">
			{/* Header */}
			<header className="glass border-b border-border/20 px-4 py-4 sticky top-0 z-50">
				<div className="container mx-auto flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-sm">ZX</span>
						</div>
						<h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
							Zona Xtreme
						</h1>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex gap-2">
						{navItems.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.path}
									to={item.path}
									className={cn(
										"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
										location.pathname === item.path
											? "bg-primary text-primary-foreground shadow-lg"
											: "text-muted-foreground hover:text-foreground hover:bg-accent",
									)}
								>
									<Icon className="w-4 h-4" />
									{item.label}
								</Link>
							);
						})}
					</nav>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
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
					<nav className="md:hidden mt-4 space-y-2 animate-fadeIn">
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
											: "text-muted-foreground hover:text-foreground hover:bg-accent",
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
			<main className="flex-1 container mx-auto px-4 py-6">
				<div className="animate-fadeIn">{children}</div>
			</main>
		</div>
	);
}
