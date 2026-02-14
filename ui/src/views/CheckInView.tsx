import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";
import { createCheckin, type CheckinResponse, type CheckinPayload } from "@/api/checkin";
import { formatPrice, formatTimeValue, isTimeProduct, type Product } from "@/api/products";
import { notifyCartUpdate, type CartItem as ApiCartItem } from "@/api/cart";
import { MobileShell } from "@/components/MobileShell";
import { ActionButton } from "@/components/ActionButton";
import { QRScanner } from "@/components/QRScanner";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassCard } from "@/components/GlassCard";
import { CartSheet } from "@/components/CartSheet";
import { ChevronDown, ShoppingCart } from "lucide-react";
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
	const [activeBarcode, setActiveBarcode] = useState(""); // The barcode we're actually searching for
	const [cart, setCart] = useState<CartItem[]>([]);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [lastCheckinData, setLastCheckinData] = useState<CheckinResponse | null>(null);
	const [isCartOpen, setIsCartOpen] = useState(false);

	const queryClient = useQueryClient();
	const {
		requiredProducts,
		optionalProducts,
		calculateTotalPrice: calculateCartTotalPrice,
		calculateTotalTime: calculateCartTotalTime,
	} = useProducts();

	// Get current session status only when we actively search
	const { session, isLoading: sessionLoading } = usePlayerSession(activeBarcode);

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
		setActiveBarcode("");
		setCart([]);
		setLastCheckinData(null);

		// Emit cart clear via socket
		const effectiveBarcode = (activeBarcode || barcodeId).trim();
		if (effectiveBarcode) {
			notifyCartUpdate(effectiveBarcode, []).catch(console.error);
		}
	};

	const handleBarcodeSearch = () => {
		if (barcodeId.trim()) {
			setActiveBarcode(barcodeId.trim());
		}
	};

	const addToCart = (product: Product) => {
		setCart((prevCart) => {
			const existingItem = prevCart.find(
				(item) => item.product.id === product.id,
			);
			let newCart;
			if (existingItem) {
				newCart = prevCart.map((item) =>
					item.product.id === product.id
						? { ...item, quantity: item.quantity + 1 }
						: item,
				);
			} else {
				newCart = [...prevCart, { product, quantity: 1 }];
			}

			// Emit cart update via socket
			const effectiveBarcode = (activeBarcode || barcodeId).trim();
			if (effectiveBarcode) {
				const apiCart: ApiCartItem[] = newCart.map(item => ({
					productId: item.product.id,
					quantity: item.quantity
				}));
				notifyCartUpdate(effectiveBarcode, apiCart).catch(console.error);
			}

			return newCart;
		});
	};

	const removeFromCart = (productId: string) => {
		setCart((prevCart) => {
			const newCart = prevCart.filter((item) => item.product.id !== productId);

			// Emit cart update via socket
			const effectiveBarcode = (activeBarcode || barcodeId).trim();
			if (effectiveBarcode) {
				const apiCart: ApiCartItem[] = newCart.map(item => ({
					productId: item.product.id,
					quantity: item.quantity
				}));
				notifyCartUpdate(effectiveBarcode, apiCart).catch(console.error);
			}

			return newCart;
		});
	};

	const updateQuantity = (productId: string, quantity: number) => {
		if (quantity <= 0) {
			removeFromCart(productId);
		} else {
			setCart((prevCart) => {
				const newCart = prevCart.map((item) =>
					item.product.id === productId ? { ...item, quantity } : item,
				);

				// Emit cart update via socket
				const effectiveBarcode = (activeBarcode || barcodeId).trim();
				if (effectiveBarcode) {
					const apiCart: ApiCartItem[] = newCart.map(item => ({
						productId: item.product.id,
						quantity: item.quantity
					}));
					notifyCartUpdate(effectiveBarcode, apiCart).catch(console.error);
				}

				return newCart;
			});
		}
	};

	const getTotalPrice = () => {
		return calculateCartTotalPrice(cart.map(item => ({ id: item.product.id, quantity: item.quantity })));
	};

	const getTotalTime = () => {
		return calculateCartTotalTime(cart.map(item => ({ id: item.product.id, quantity: item.quantity })));
	};

	// Filter products for display based on session state
	const getAvailableRequiredProducts = () => {
		// If session exists, don't show required products (they should already have them)
		if (session) return [];
		return requiredProducts;
	};

	const getAvailableOptionalProducts = () => {
		return optionalProducts;
	};

	const getTotalItems = () => {
		return cart.reduce((total, item) => total + item.quantity, 0);
	};

	const hasRequiredProducts = () => {
		return true; // Restriction disabled pending stakeholder review
	};

	const isMissingRequired = !hasRequiredProducts();

	const handleCheckin = () => {
		const effectiveBarcode = (activeBarcode || barcodeId).trim();
		if (!effectiveBarcode || cart.length === 0) {
			alert("Por favor ingrese el código de pulsera y agregue productos");
			return;
		}
		setActiveBarcode(effectiveBarcode);

		const checkinData = {
			barcodeId: effectiveBarcode,
			products: cart.map((item) => ({
				id: item.product.id,
				quantity: item.quantity,
			})),
		};

		checkinMutation.mutate(checkinData);
	};

	// Calculate session status display
	const getSessionStatusDisplay = () => {
		// Don't show anything if no active barcode search
		if (!activeBarcode) return null;
		
		if (sessionLoading) {
			return (
				<GlassCard className="text-center py-3">
					<div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-1" />
					<span className="text-muted-foreground text-xs">Cargando estado...</span>
				</GlassCard>
			);
		}
		
		// New wristband - no session found
		if (!session) {
			return (
				<GlassCard className="text-center py-3">
					<AlertCircle className="w-6 h-6 text-blue-400 mx-auto mb-1" />
					<span className="text-blue-400 font-medium text-xs">📋 Nueva Pulsera</span>
					<span className="text-muted-foreground text-xs block mt-1">⏱️ Sin tiempo</span>
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
		<MobileShell 
			title="Check-in"
			footer={
				<div className="space-y-3">
					{/* Cart Summary - Opción 1: Collapsible */}
					{cart.length > 0 && (
						<div className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-border/20">
							<button
								type="button"
								onClick={() => setIsCartOpen(true)}
								className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								<ShoppingCart className="w-4 h-4" />
								<span>{getTotalItems()} items</span>
								<span>-</span>
								<span className="font-medium text-foreground">{formatPrice(getTotalPrice())}</span>
								<ChevronDown className="w-4 h-4" />
							</button>
						</div>
					)}
					
					<ActionButton
						type="checkin"
						onClick={handleCheckin}
						disabled={
							!(activeBarcode || barcodeId).trim() ||
							cart.length === 0 ||
							isMissingRequired ||
							checkinMutation.isPending
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
					{isMissingRequired && (
						<div className="text-xs text-yellow-400">
							Debes incluir los productos obligatorios
						</div>
					)}
				</div>
			}
		>
			<div className="px-4 space-y-4 min-h-0">
				{/* Scan Input */}
				<QRScanner
					value={barcodeId}
					onChange={setBarcodeId}
					onSubmit={handleBarcodeSearch}
					placeholder="Código de pulsera"
				/>

				{/* Session Status Display */}
				{getSessionStatusDisplay()}

				{/* Products Grid */}
				<div className="space-y-6">
					{/* Required Products */}
					{session && requiredProducts.length > 0 && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold text-foreground">
									Productos Obligatorios
								</h3>
								<StatusBadge status="playing" size="sm" showIcon={false} />
							</div>
							<div className="text-center py-4 text-muted-foreground text-sm">
								✅ Ya incluidos en la sesión actual
							</div>
						</div>
					)}
					{!session && getAvailableRequiredProducts().length > 0 && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold text-foreground">
									Productos Obligatorios
								</h3>
								<StatusBadge status="waiting" size="sm" showIcon={false} />
							</div>
							<div className="grid grid-cols-2 gap-3">
								{getAvailableRequiredProducts()
									.slice(0, 4)
									.map((product: Product) => {
										const cartItem = cart.find(item => item.product.id === product.id);
										return (
											<ProductButton
												key={product.id}
												product={product}
												onClick={() => addToCart(product)}
												quantity={cartItem?.quantity}
											/>
										);
									})}
							</div>
						</div>
					)}

					{/* Optional Products */}
					{getAvailableOptionalProducts().length > 0 && (
						<div className="space-y-3">
							<h3 className="font-semibold text-foreground">Productos Opcionales</h3>
							<div className="max-h-96 overflow-y-auto space-y-2">
								{getAvailableOptionalProducts().map((product: Product) => {
									const cartItem = cart.find(item => item.product.id === product.id);
									return (
										<ProductListItem
											key={product.id}
											product={product}
											onClick={() => addToCart(product)}
											quantity={cartItem?.quantity}
										/>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Success Overlay */}
			{showConfirmation && lastCheckinData && (
				<div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
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

			{/* Cart Sheet - Opción 1 */}
			<CartSheet
				isOpen={isCartOpen}
				onClose={() => setIsCartOpen(false)}
				items={cart}
				onUpdateQuantity={updateQuantity}
				totalPrice={getTotalPrice()}
				totalTime={getTotalTime()}
			/>
		</MobileShell>
	);
}

// Product Button Component
function ProductButton({ product, onClick, quantity }: { product: Product; onClick: () => void; quantity?: number }) {
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
					{isTimeProduct(product) && product.timeValueSeconds && (
						<span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
							{formatTimeValue(product.timeValueSeconds)}
						</span>
					)}
				</div>
				{quantity && quantity > 0 && (
					<div className="absolute top-2 right-2 bg-primary/20 text-primary text-xs px-2 py-1 rounded-full font-medium">
						{quantity}
					</div>
				)}
			</div>
		</button>
	);
}

// Product List Item Component
function ProductListItem({ product, onClick, quantity }: { product: Product; onClick: () => void; quantity?: number }) {
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
			className="w-full p-3 border border-border/20 rounded-lg bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-200 text-left"
		>
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<div className="font-medium text-sm text-foreground mb-1">
						{product.name}
					</div>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span className="text-primary font-bold">{formatPrice(product.price)}</span>
						{isTimeProduct(product) && product.timeValueSeconds && (
							<span className="text-blue-400">
								+{formatTimeValue(product.timeValueSeconds)}
							</span>
						)}
					</div>
				</div>
				{quantity && quantity > 0 && (
					<div className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full font-medium min-w-[2rem] text-center">
						{quantity}
					</div>
				)}
			</div>
		</button>
	);
}

