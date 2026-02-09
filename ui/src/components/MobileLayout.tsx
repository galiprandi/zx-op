import { cn } from "@/lib/utils";

interface MobileLayoutProps {
	children: React.ReactNode;
	className?: string;
	footer?: React.ReactNode;
}

export function MobileLayout({
	children,
	className,
	footer,
}: MobileLayoutProps) {
	return (
		<div
			className={cn(
				"min-h-screen bg-background text-foreground flex flex-col",
				className,
			)}
		>
			{/* Scrollable content area */}
			<main className="flex-1 overflow-y-auto">
				<div className="animate-fadeIn">{children}</div>
			</main>

			{/* Fixed footer */}
			{footer && (
				<footer className="sticky bottom-0 bg-background border-t border-border/20 p-4 z-10">
					{footer}
				</footer>
			)}
		</div>
	);
}
