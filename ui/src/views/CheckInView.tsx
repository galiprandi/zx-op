import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";
import { createCheckin, type CheckinResponse, type CheckinPayload } from "@/api/checkin";
import { formatPrice, formatTimeValue, isTimeProduct, type Product } from "@/api/products";
import { MobileShell } from "@/components/MobileShell";
import { ActionButton } from "@/components/ActionButton";
import { ScanInput } from "@/components/ScanInput";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassCard } from "@/components/GlassCard";
import { useProducts } from "@/hooks/useProducts";
import { useSocket } from "@/hooks/useSocket";
import { usePlayerSession } from "@/hooks/usePlayerSession";

interface CartItem {
	product: Product;
	quantity: number;
}

export function CheckInView() {
	useSocket(); // Initialize socket connection for real-time updates

	const [barcodeId, setBarcodeId] = useState("");
	const [cart, setCart] = useState<CartItem[]>([]);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [lastCheckinData, setLastCheckinData] = useState<CheckinResponse | null>(null);

	const queryClient = useQueryClient();
	const {
		requiredProducts,
		optionalProducts,
		calculateTotalPrice: calculateCartTotalPrice,
		calculateTotalTime: calculateCartTotalTime,
	} = useProducts();

	// Get current session status for the scanned barcode
	const { session, isLoading: sessionLoading } = usePlayerSession(barcodeId);

	const checkinMutation = useMutation({
		mutationFn: (data: CheckinPayload) => createCheckin(data),
		onSuccess: (data: CheckinResponse) => {
			setLastCheckinData(data);
			setShowConfirmation(true);
			setTimeout(() => {
				setShowConfirmation(false);
				resetForm();
			}, 3000);
			queryClient.invalidateQueries({ queryKey: ["products"] });
			queryClient.invalidateQueries({ queryKey: ["playerSession"] });
		},
		onError: (error) => {
			console.error("Error creating checkin:", error);
			alert("Error al procesar el check-in");
		},
	});

	const resetForm = () => {
		setBarcodeId("");
		setCart([]);
		setLastCheckinData(null);
	};

	const addToCart = (product: Product) => {
		setCart((prevCart) => {
			const existingItem = prevCart.find(
				(item) => item.product.id === product.id,
			);
			if (existingItem) {
				return prevCart.map((item) =>
					item.product.id === product.id
						? { ...item, quantity: item.quantity + 1 }
						: item,
				);
			}
			return [...prevCart, { product, quantity: 1 }];
		});
	};

	const removeFromCart = (productId: string) => {
		setCart((prevCart) =>
			prevCart.filter((item) => item.product.id !== productId),
		);
	};

	const updateQuantity = (productId: string, quantity: number) => {
		if (quantity <= 0) {
			removeFromCart(productId);
		} else {
			setCart((prevCart) =>
				prevCart.map((item) =>
					item.product.id === productId ? { ...item, quantity } : item,
				),
			);
		}
	};

	const getTotalPrice = () => {
		return calculateCartTotalPrice(cart.map(item => ({ id: item.product.id, quantity: item.quantity })));
	};

	const getTotalTime = () => {
		return calculateCartTotalTime(cart.map(item => ({ id: item.product.id, quantity: item.quantity })));
	};

	const getTotalItems = () => {
		return cart.reduce((total, item) => total + item.quantity, 0);
	};

	const handleCheckin = () => {
		if (!barcodeId || cart.length === 0) {
			alert("Por favor ingrese el código de pulsera y agregue productos");
			return;
		}

		const checkinData = {
			barcodeId,
			products: cart.map((item) => ({
				id: item.product.id,
				quantity: item.quantity,
			})),
		};

		checkinMutation.mutate(checkinData);
	};

	// Calculate session status display
	const getSessionStatusDisplay = () => {
		if (!barcodeId) return null;
		if (sessionLoading) {
			return (
				<GlassCard className="text-center">
					<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
					<span className="text-muted-foreground text-sm">Cargando estado...</span>
				</GlassCard>
			);
		}
		if (!session) {
			return (
				<GlassCard className="text-center">
					<AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
					<span className="text-muted-foreground text-sm">Sin sesión activa</span>
				</GlassCard>
			);
		}

		const hasTimeInCart = cart.some(item => isTimeProduct(item.product));

		return (
			<GlassCard>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center">
						<StatusBadge 
							status={session.isActive ? "playing" : "paused"} 
							size="sm"
						/>
					</div>
					<div className="text-right">
						<div className={`font-bold text-lg ${
							session.remainingSeconds > 300 ? 'text-green-400' : 
							session.remainingSeconds > 60 ? 'text-yellow-400' : 'text-red-400'
						}`}>
							{formatTimeValue(session.remainingSeconds)}
						</div>
						<div className="text-xs text-muted-foreground">
							{Math.floor(session.remainingSeconds / 60)} min restantes
						</div>
					</div>
				</div>
				{hasTimeInCart && (
					<div className="text-xs text-blue-400 mt-2">
						⚠️ Agregar tiempo extenderá la sesión actual
					</div>
				)}
			</GlassCard>
		);
	};

	return (
		<MobileShell title="Check-in">
			<div className="flex flex-col h-full space-y-4">
				{/* Scan Input */}
				<div className="px-4">
					<ScanInput
						value={barcodeId}
						onChange={setBarcodeId}
						placeholder="Código de pulsera"
					/>
				</div>

				{/* Session Status Display */}
				{getSessionStatusDisplay()}

				{/* Products Grid */}
				<div className="flex-1 overflow-y-auto px-4 space-y-6">
					{/* Required Products */}
					{requiredProducts.length > 0 && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold text-foreground">
									Productos Obligatorios
								</h3>
								<StatusBadge status="waiting" size="sm" showIcon={false} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								{requiredProducts
									.filter((product: Product) => {
										const cartItem = cart.find(
											(item) => item.product.id === product.id,
										);
										return !cartItem;
									})
									.slice(0, 4)
									.map((product: Product) => (
										<ProductButton
											key={product.id}
											product={product}
											onClick={() => addToCart(product)}
										/>
									))}
							</div>
						</div>
					)}

					{/* Optional Products */}
					{optionalProducts.length > 0 && (
						<div className="space-y-3">
							<h3 className="font-semibold text-foreground">Productos Opcionales</h3>
							<div className="grid grid-cols-2 gap-3">
								{optionalProducts
									.filter((product: Product) => {
										const cartItem = cart.find(
											(item) => item.product.id === product.id,
										);
										return !cartItem;
									})
									.slice(0, 4)
									.map((product: Product) => (
										<ProductButton
											key={product.id}
											product={product}
											onClick={() => addToCart(product)}
										/>
									))}
							</div>
						</div>
					)}

					{/* Cart Summary */}
					{cart.length > 0 && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold text-foreground">Carrito</h3>
								<span className="text-sm text-muted-foreground font-medium">
									{getTotalItems()} items
								</span>
							</div>
							<div className="space-y-2">
								{cart.map((item) => (
									<CartItemRow
										key={item.product.id}
										item={item}
										onUpdateQuantity={updateQuantity}
										onRemove={removeFromCart}
									/>
								))}
								<div className="border-t border-border/20 pt-3">
									<div className="flex justify-between items-center">
										<span className="font-bold text-foreground">TOTAL:</span>
										<div className="text-right">
											<div className="font-bold text-lg text-green-400">
												{formatPrice(getTotalPrice())}
											</div>
											{getTotalTime() > 0 && (
												<div className="text-xs text-blue-400">
													+{formatTimeValue(getTotalTime())} de tiempo
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer Button */}
				<div className="px-4 pb-4">
					<ActionButton
						type="checkin"
						onClick={handleCheckin}
						disabled={
							!barcodeId || cart.length === 0 || checkinMutation.isPending
						}
						loading={checkinMutation.isPending}
					>
						COBRAR {formatPrice(getTotalPrice())}
						{getTotalTime() > 0 && (
							<span className="ml-2 text-sm bg-primary/20 px-2 py-1 rounded">
								+{formatTimeValue(getTotalTime())}
							</span>
						)}
					</ActionButton>
				</div>

				{/* Success Overlay */}
				{showConfirmation && lastCheckinData && (
					<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
						<GlassCard className="w-full max-w-sm text-center animate-fadeIn">
							<div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
								<Check className="w-8 h-8 text-green-400" />
							</div>
							<h3 className="text-xl font-bold text-green-400 mb-4">
								¡Check-in Exitoso!
							</h3>
							<div className="text-sm text-muted-foreground space-y-2">
								<div className="font-medium">Código: {barcodeId}</div>
								<div className="font-medium">Items: {getTotalItems()}</div>
								<div className="font-bold text-lg text-green-400">
									Total: {formatPrice(getTotalPrice())}
								</div>
								{lastCheckinData.totalSecondsAdded > 0 && (
									<div className="flex items-center justify-center text-blue-400 font-medium">
										<Clock className="w-4 h-4 mr-1" />
										Tiempo agregado: {formatTimeValue(lastCheckinData.totalSecondsAdded)}
									</div>
								)}
							</div>
						</GlassCard>
					</div>
				)}
			</div>
		</MobileShell>
	);
}

// Product Button Component
function ProductButton({ product, onClick }: { product: Product; onClick: () => void }) {
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(price);
	};

	return (
		<button
			type="button"
			onClick={onClick}
			className="relative overflow-hidden border border-border/20 rounded-xl bg-card/50 p-4 hover:bg-card hover:border-primary/30 transition-all duration-200 text-left transform hover:scale-[1.02] active:scale-[0.98] min-h-[80px]"
		>
			<div className="relative">
				<div className="font-semibold text-sm text-foreground mb-2 line-clamp-2 leading-tight">
					{product.name}
				</div>
				<div className="flex items-center justify-between">
					<div className="text-lg font-bold text-primary">
						{formatPrice(product.price)}
					</div>
					{isTimeProduct(product) && (
						<span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
							{formatTimeValue(product.timeValueSeconds!)}
						</span>
					)}
				</div>
				{product.required && (
					<div className="absolute top-2 right-2">
						<span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
							Requerido
						</span>
					</div>
				)}
			</div>
		</button>
	);
}

// Cart Item Row Component
function CartItemRow({ 
	item, 
	onUpdateQuantity, 
	onRemove 
}: { 
	item: CartItem; 
	onUpdateQuantity: (id: string, quantity: number) => void;
	onRemove: (id: string) => void;
}) {
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(price);
	};

	return (
		<div className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-border/20">
			<div className="flex-1">
				<div className="font-medium text-sm text-foreground">
					{item.product.name}
				</div>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<span>{formatPrice(item.product.price)} c/u</span>
					{isTimeProduct(item.product) && (
						<span className="text-blue-400">
							+{formatTimeValue(item.product.timeValueSeconds!)}
						</span>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
					className="w-6 h-6 rounded border border-border/20 bg-card/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm"
				>
					-
				</button>
				<span className="w-6 text-center text-sm font-medium text-foreground">
					{item.quantity}
				</span>
				<button
					type="button"
					onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
					className="w-6 h-6 rounded border border-border/20 bg-card/50 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm"
				>
					+
				</button>
				<button
					type="button"
					onClick={() => onRemove(item.product.id)}
					className="w-6 h-6 rounded border border-border/20 bg-card/50 text-destructive hover:text-destructive flex items-center justify-center text-xs"
				>
					×
				</button>
			</div>
		</div>
	);
}
