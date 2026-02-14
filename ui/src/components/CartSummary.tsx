import { ShoppingCart, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatTimeValue } from "@/api/products";

interface CartSummaryProps {
	items: number;
	totalPrice: number;
	totalTime: number;
	onClick: () => void;
}

export function CartSummary({ items, totalPrice, totalTime, onClick }: CartSummaryProps) {
	if (items === 0) return null;

	return (
		<Button
			variant="outline"
			onClick={onClick}
			className="w-full justify-between bg-card/50 border-border/20 hover:bg-card/80"
		>
			<div className="flex items-center gap-2">
				<ShoppingCart className="w-4 h-4" />
				<span className="text-sm font-medium">{items} items</span>
			</div>
			<div className="flex items-center gap-2">
				<span className="font-bold text-primary">{formatPrice(totalPrice)}</span>
				{totalTime > 0 && (
					<span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
						{formatTimeValue(totalTime)}
					</span>
				)}
				<ChevronUp className="w-4 h-4" />
			</div>
		</Button>
	);
}
