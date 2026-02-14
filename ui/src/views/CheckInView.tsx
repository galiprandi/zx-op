import { useMutation } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { createCheckin, type CheckinResponse, type CheckinPayload } from "@/api/checkin";
import { formatPrice, formatTimeValue, isTimeProduct, type Product } from "@/api/products";
import { notifyCartUpdate, type CartItem as ApiCartItem } from "@/api/cart";
import { MobileShell } from "@/components/MobileShell";
import { ActionButton } from "@/components/ActionButton";
import { QRScanner } from "@/components/QRScanner";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassCard } from "@/components/GlassCard";
import { CartSheet } from "@/components/CartSheet";
import { Modal } from "@/components/Modal";
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

	const {
		requiredProducts,
		optionalProducts,
		calculateTotalPrice: calculateCartTotalPrice,
		calculateTotalTime: calculateCartTotalTime,
	} = useProducts();

	// Get current session status only when we actively search
	const { session } = usePlayerSession(activeBarcode);

	const checkinMutation = useMutation({
		mutationFn: (data: CheckinPayload) => createCheckin(data),
		onSuccess: (data: CheckinResponse) => {
			setLastCheckinData(data);
			setShowConfirmation(true);
			
			setTimeout(() => {
				setShowConfirmation(false);
				resetForm();
			}, 3000);
		},
		onError: (error) => {
			console.error("Error creating checkin:", error);
			alert("Error al procesar el check-in");
		},
	});

	const resetForm = () => {
		// Capture barcode before clearing state
		const effectiveBarcode = (activeBarcode || barcodeId).trim();
		
		setBarcodeId("");
		setActiveBarcode("");
		setCart([]);
		setLastCheckinData(null);

		// Emit cart clear via socket
		if (effectiveBarcode) {
			notifyCartUpdate(effectiveBarcode, []).catch(console.error);
		}
	};

	const handleBarcodeSearch = () => {
		const trimmedBarcode = barcodeId.trim();
		if (!trimmedBarcode) {
			alert("Por favor ingrese un código de pulsera válido");
			return;
		}
		setActiveBarcode(trimmedBarcode);
	};

	const addToCart = (product: Product) => {
		if (!product || !product.id) {
			console.error("Invalid product");
			return;
		}
		
		setCart((prevCart) => {
			const existingItem = prevCart.find(
				(item) => item.product.id === product.id,
			);
			let newCart;
			if (existingItem) {
				// Prevent adding too many units
				if (existingItem.quantity >= 99) {
					alert("No se pueden agregar más de 99 unidades del mismo producto");
					return prevCart;
				}
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

	const getTotalPrice = useCallback(() => {
		return calculateCartTotalPrice(cart.map(item => ({ id: item.product.id, quantity: item.quantity })));
	}, [cart, calculateCartTotalPrice]);

	const getTotalTime = useCallback(() => {
		return calculateCartTotalTime(cart.map(item => ({ id: item.product.id, quantity: item.quantity })));
	}, [cart, calculateCartTotalTime]);

	// Filter products for display based on session state
	const getAvailableRequiredProducts = useMemo(() => {
		// Always return required products - users can add more units anytime
		return requiredProducts;
	}, [requiredProducts]);

	const getAvailableOptionalProducts = useMemo(() => {
		return optionalProducts;
	}, [optionalProducts]);

	const getTotalItems = useCallback(() => {
		return cart.reduce((total, item) => total + item.quantity, 0);
	}, [cart]);

	const hasRequiredProducts = () => {
		// TODO: Implement required products validation when business rules are defined
		return true;
	};

	const isMissingRequired = !hasRequiredProducts();

	const handleCheckin = () => {
		const effectiveBarcode = (activeBarcode || barcodeId).trim();
		
		if (!effectiveBarcode || cart.length === 0) {
			alert("Por favor ingrese el código de pulsera y agregue productos");
			return;
		}
		
		// Ensure active barcode is set
		if (!activeBarcode) {
			setActiveBarcode(effectiveBarcode);
		}

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
		
		// New wristband - no session found
		if (!session) {
			return null;
		}

		return (
			<GlassCard className="px-2 py-1">
				<div className="flex items-center justify-between">
					<StatusBadge 
						status={session.isActive ? "playing" : "paused"} 
						size="sm"
					/>
					<div className="flex items-center gap-2">
						<div className={`font-bold text-xs ${
							session.remainingSeconds > 300 ? 'text-green-400' : 
							session.remainingSeconds > 60 ? 'text-yellow-400' : 'text-red-400'
						}`}>
							{formatTimeValue(session.remainingSeconds)}
						</div>
						<div className="text-[8px] text-muted-foreground">
							({Math.floor(session.remainingSeconds / 60)}min)
						</div>
					</div>
				</div>
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
					placeholder={checkinMutation.isPending ? "Procesando..." : "Código de pulsera"}
					disabled={checkinMutation.isPending}
				/>

				{/* Session Status Display */}
				{getSessionStatusDisplay()}

				{/* Products Grid */}
				<div className="space-y-6">
										{/* Required Products */}
					{getAvailableRequiredProducts.length > 0 && (
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold text-foreground">
									Productos Obligatorios
								</h3>
								{session ? (
									<StatusBadge status={session.isActive ? "playing" : "paused"} size="sm" showIcon={false} />
								) : (
									<StatusBadge status="waiting" size="sm" showIcon={false} />
								)}
							</div>
														<div className="grid grid-cols-2 gap-3">
								{getAvailableRequiredProducts.slice(0, 4).map((product: Product) => {
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
					{getAvailableOptionalProducts.length > 0 && (
						<div className="space-y-3">
							<h3 className="font-semibold text-foreground sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">Otros productos</h3>
							<div className="max-h-64 overflow-y-auto space-y-2 pr-1">
								{getAvailableOptionalProducts.map((product: Product) => {
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

			{/* Success Modal */}
			<Modal
				isOpen={showConfirmation && !!lastCheckinData}
				onClose={() => setShowConfirmation(false)}
				title="¡Check-in Exitoso!"
				type="success"
				autoClose={true}
				autoCloseDelay={3000}
				details={
					<>
						<div className="font-medium">Código: {barcodeId}</div>
						<div className="font-medium">Items: {getTotalItems()}</div>
						<div className="font-bold text-lg text-green-400">
							Total: {formatPrice(getTotalPrice())}
						</div>
						{lastCheckinData?.totalSecondsAdded && lastCheckinData.totalSecondsAdded > 0 && (
							<div className="text-xs text-blue-400">
								+{formatTimeValue(lastCheckinData.totalSecondsAdded)} de tiempo añadido
							</div>
						)}
					</>
				}
			/>

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
			className="relative overflow-hidden border border-border/20 rounded-xl bg-gradient-to-br from-slate-800/5 to-slate-900/8 backdrop-blur-sm p-4 hover:from-slate-800/10 hover:to-slate-900/12 hover:border-primary/30 transition-all duration-200 text-left transform hover:scale-[1.02] active:scale-[0.98] min-h-[88px] w-full"
		>
			<div className="flex flex-col h-full justify-between space-y-2">
				{/* Nombre del producto */}
				<div className="font-semibold text-sm text-foreground line-clamp-2 leading-tight pr-8">
					{product.name}
				</div>
				
				{/* Tiempo y precio */}
				<div className="space-y-1">
					{isTimeProduct(product) && product.timeValueSeconds && (
						<div className="flex items-center gap-2">
							<span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-medium">
								({formatTimeValue(product.timeValueSeconds)})
							</span>
						</div>
					)}
					<span className="text-lg font-bold text-primary">
						{formatPrice(product.price)}
					</span>
				</div>
			</div>
			
			{/* Badge de cantidad */}
			{quantity && quantity > 0 && (
				<div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium min-w-[20px] text-center">
					{quantity}
				</div>
			)}
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

