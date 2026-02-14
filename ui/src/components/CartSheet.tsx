import { Minus, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatPrice, formatTimeValue, isTimeProduct } from "@/api/products";
import { GlassCard } from "@/components/GlassCard";
import { Product } from "@/api/products";

interface CartItem {
	product: Product;
	quantity: number;
}

interface CartSheetProps {
	isOpen: boolean;
	onClose: () => void;
	items: CartItem[];
	onUpdateQuantity: (id: string, quantity: number) => void;
	totalPrice: number;
	totalTime: number;
}

export function CartSheet({
	isOpen,
	onClose,
	items,
	onUpdateQuantity,
	totalPrice,
	totalTime,
}: CartSheetProps) {
	const getTotalItems = () => {
		return items.reduce((total, item) => total + item.quantity, 0);
	};

	return (
		<Sheet open={isOpen} onOpenChange={onClose}>
			<SheetContent side="bottom" className="h-[80vh]">
				<SheetHeader>
					<SheetTitle>
						Carrito de Compras
					</SheetTitle>
				</SheetHeader>

				<div className="flex flex-col h-full pt-6">
					{/* Items List */}
					<div className="flex-1 overflow-y-auto">
						{items.map((item) => (
							<div key={item.product.id} className="flex items-center justify-between p-3 border-b border-border/10 hover:bg-muted/30 transition-colors active:bg-muted/50">
								<div className="flex-1 min-w-0">
									<div className="font-medium text-foreground mb-1">
										{item.product.name}
									</div>
									<div className="flex items-center gap-3 text-sm text-muted-foreground">
										<span className="font-bold text-primary">
											{formatPrice(item.product.price)} c/u
										</span>
										{isTimeProduct(item.product) && item.product.timeValueSeconds && (
											<span className="text-blue-400">
												+{formatTimeValue(item.product.timeValueSeconds)}
											</span>
										)}
									</div>
								</div>
								
								<div className="flex items-center gap-0">
									<div className="flex items-center bg-muted/50 rounded border border-border/20">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
											className="w-4 h-4 p-0 rounded-l hover:bg-muted/70"
										>
											<Minus className="w-2 h-2" />
										</Button>
										<div className="w-4 text-center font-medium text-xs">
											{item.quantity}
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
											className="w-4 h-4 p-0 rounded-r hover:bg-muted/70"
										>
											<Plus className="w-2 h-2" />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Total Summary */}
					<div className="border-t border-border/20 pt-4 mt-4">
						<GlassCard className="p-4">
							<div className="space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">
										{getTotalItems()} items
									</span>
									<span className="font-bold text-xl text-foreground">
										{formatPrice(totalPrice)}
									</span>
								</div>
								{totalTime > 0 && (
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Tiempo total
										</span>
										<span className="text-blue-400 font-medium">
											{formatTimeValue(totalTime)}
										</span>
									</div>
								)}
							</div>
						</GlassCard>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
