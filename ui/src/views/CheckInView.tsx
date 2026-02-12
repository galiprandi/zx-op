import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Trash2, X, Play, Pause, AlertCircle } from "lucide-react";
import { useState } from "react";
import { createCheckin, type CheckinResponse, type CheckinPayload } from "@/api/checkin";
import { formatPrice, formatTimeValue, isTimeProduct, type Product } from "@/api/products";
import { MobileLayout } from "@/components/MobileLayout";
import { ProductTouchable } from "@/components/ProductTouchable";
import { QRScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useSocket } from "@/hooks/useSocket";
import { usePlayerSession } from "@/hooks/usePlayerSession";

interface CartItem {
	product: Product;
	quantity: number;
}

interface SimpleProduct {
	id: string;
	name: string;
	price: number;
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
			}, 4000);
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

	// Convert Product to SimpleProduct for ProductTouchable
	const toSimpleProduct = (product: Product): SimpleProduct => ({
		id: product.id,
		name: product.name,
		price: product.price,
	});

	// Calculate session status display
	const getSessionStatusDisplay = () => {
		if (!barcodeId) return null;
		if (sessionLoading) {
			return (
				<div className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
					<div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
					<span className="text-blue-700 text-sm">Cargando estado...</span>
				</div>
			);
		}
		if (!session) {
			return (
				<div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
					<AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
					<span className="text-gray-700 text-sm">Sin sesión activa</span>
				</div>
			);
		}

		const hasTimeInCart = cart.some(item => isTimeProduct(item.product));

		return (
			<div className={`p-3 border rounded-lg ${
				session.isActive ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
			}`}>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center">
						{session.isActive ? (
							<Play className="w-4 h-4 text-green-600 mr-2" />
						) : (
							<Pause className="w-4 h-4 text-yellow-600 mr-2" />
						)}
						<span className={`font-semibold text-sm ${
							session.isActive ? 'text-green-700' : 'text-yellow-700'
						}`}>
							{session.isActive ? 'En Juego' : 'Pausado'}
						</span>
					</div>
					<div className="text-right">
						<div className={`font-bold text-lg ${
							session.remainingSeconds > 300 ? 'text-green-600' : 
							session.remainingSeconds > 60 ? 'text-yellow-600' : 'text-red-600'
						}`}>
							{formatTimeValue(session.remainingSeconds)}
						</div>
						<div className="text-xs text-gray-500">
							{session.remainingMinutes} min restantes
						</div>
					</div>
				</div>
				{hasTimeInCart && (
					<div className="text-xs text-blue-600 mt-2">
						⚠️ Agregar tiempo extenderá la sesión actual
					</div>
				)}
			</div>
		);
	};

	return (
		<MobileLayout
			footer={
				<div className="flex flex-col gap-2">
					<Button
						type="button"
						size="lg"
						className="flex-1 h-16 text-lg font-bold bg-blue-600 hover:bg-blue-700"
						disabled={
							!barcodeId || cart.length === 0 || checkinMutation.isPending
						}
						onClick={handleCheckin}
					>
						{checkinMutation.isPending ? (
							<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
						) : (
							<>
								Check-in
								<span className="ml-2">{formatPrice(getTotalPrice())}</span>
								{getTotalTime() > 0 && (
									<span className="ml-1 text-xs bg-blue-700 px-2 py-1 rounded">
										+{formatTimeValue(getTotalTime())}
									</span>
								)}
							</>
						)}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="lg"
						className="flex-1 h-12 text-lg font-bold"
						onClick={resetForm}
					>
						<X className="w-5 h-5 mr-2" />
						Limpiar
					</Button>
				</div>
			}
		>
			<div className="p-4 space-y-4">
				{/* Barcode Input */}
				<div className="relative mb-6">
					<QRScanner
						value={barcodeId}
						onChange={setBarcodeId}
						placeholder="Código de pulsera"
						className="text-lg pr-16 h-14"
					/>
				</div>

				{/* Session Status Display */}
				{getSessionStatusDisplay()}

				{/* Products Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{/* Required Products */}
					{requiredProducts.length > 0 && (
						<div className="space-y-2">
							<div className="flex items-center justify-between px-2">
								<h3 className="font-semibold text-yellow-700">
									Productos Obligatorios
								</h3>
								<span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
									Requerido
								</span>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{requiredProducts
									.filter((product: Product) => {
										const cartItem = cart.find(
											(item) => item.product.id === product.id,
										);
										return !cartItem;
									})
									.slice(0, 4)
									.map((product: Product) => (
										<ProductTouchable
											key={product.id}
											product={toSimpleProduct(product)}
											onClick={() => addToCart(product)}
										/>
									))}
							</div>
						</div>
					)}

					{/* Optional Products */}
					{optionalProducts.length > 0 && (
						<div className="space-y-2">
							<h3 className="font-semibold px-2">Productos Opcionales</h3>
							<div className="grid grid-cols-2 gap-2">
								{optionalProducts
									.filter((product: Product) => {
										const cartItem = cart.find(
											(item) => item.product.id === product.id,
										);
										return !cartItem;
									})
									.slice(0, 4)
									.map((product: Product) => (
										<ProductTouchable
											key={product.id}
											product={toSimpleProduct(product)}
											onClick={() => addToCart(product)}
										/>
									))}
							</div>
						</div>
					)}
				</div>

				{/* Cart Summary */}
				{cart.length > 0 && (
					<div className="space-y-2">
						<div className="flex items-center justify-between px-2">
							<h3 className="font-semibold text-green-800">Carrito</h3>
							<span className="text-sm text-green-600 font-medium">
								{getTotalItems()} items
							</span>
						</div>
						<div className="space-y-2">
							{cart.map((item) => (
								<div
									key={item.product.id}
									className="flex items-center justify-between p-2 bg-white border rounded"
								>
									<div className="flex-1">
										<div className="font-medium text-xs">
											{item.product.name}
										</div>
										<div className="flex items-center gap-2 text-xs text-gray-500">
											<span>{formatPrice(item.product.price)} c/u</span>
											{isTimeProduct(item.product) && (
												<span className="text-blue-600">
													+{formatTimeValue(item.product.timeValueSeconds!)}
												</span>
											)}
										</div>
									</div>
									<div className="flex items-center gap-1">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												updateQuantity(item.product.id, item.quantity - 1)
											}
											className="h-6 w-6 p-0"
										>
											-
										</Button>
										<span className="w-6 text-center text-xs font-medium">
											{item.quantity}
										</span>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												updateQuantity(item.product.id, item.quantity + 1)
											}
											className="h-6 w-6 p-0"
										>
											+
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => removeFromCart(item.product.id)}
											className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
										>
											<Trash2 className="w-3 h-3" />
										</Button>
									</div>
								</div>
							))}
							<div className="flex justify-between items-center p-2 border-t">
								<span className="font-bold text-sm">TOTAL:</span>
								<div className="text-right">
									<div className="font-bold text-lg text-green-600">
										{formatPrice(getTotalPrice())}
									</div>
									{getTotalTime() > 0 && (
										<div className="text-xs text-blue-600">
											+{formatTimeValue(getTotalTime())} de tiempo
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Confirmation Modal */}
				{showConfirmation && lastCheckinData && (
					<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
						<div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6 animate-fadeIn">
							<div className="text-center">
								<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Check className="w-8 h-8 text-green-600" />
								</div>
								<h3 className="text-xl font-bold text-green-600 mb-4">
									¡Check-in Exitoso!
								</h3>
								<div className="text-sm text-gray-600 space-y-2">
									<div className="font-medium">Código: {barcodeId}</div>
									<div className="font-medium">Items: {getTotalItems()}</div>
									<div className="font-bold text-lg text-green-600">
										Total: {formatPrice(getTotalPrice())}
									</div>
									{lastCheckinData.totalSecondsAdded > 0 && (
										<div className="flex items-center justify-center text-blue-600 font-medium">
											<Clock className="w-4 h-4 mr-1" />
											Tiempo agregado: {formatTimeValue(lastCheckinData.totalSecondsAdded)}
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</MobileLayout>
	);
}
