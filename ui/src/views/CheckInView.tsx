import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, X } from "lucide-react";
import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { ProductTouchable } from "@/components/ProductTouchable";
import { QRScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/useSocket";

// Real API functions
const api = {
	getProducts: async () => {
		const response = await fetch(
			"http://" + window.location.hostname + ":3001/api/products",
		);
		if (!response.ok) throw new Error("Failed to fetch products");
		return response.json();
	},
	createCheckin: async (data: CheckinData) => {
		const response = await fetch(
			"http://" + window.location.hostname + ":3001/api/checkin",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			},
		);
		if (!response.ok) throw new Error("Failed to create checkin");
		return response.json();
	},
};

interface CheckinData {
	wristbandCode: string;
	products: { id: string; quantity: number }[];
	transactionNumber?: string;
}

interface CartItem {
	product: Product;
	quantity: number;
}

interface Product {
	id: string;
	name: string;
	description?: string;
	price: number;
	category: string;
	required: boolean;
	isDeleted: boolean;
}

export function CheckInView() {
	useSocket(); // Initialize socket connection for real-time updates

	const [wristbandCode, setWristbandCode] = useState("");
	const [transactionNumber, setTransactionNumber] = useState("");
	const [cart, setCart] = useState<CartItem[]>([]);
	const [showConfirmation, setShowConfirmation] = useState(false);

	const queryClient = useQueryClient();

	const { data: products = [] } = useQuery({
		queryKey: ["products"],
		queryFn: api.getProducts,
	});

	const checkinMutation = useMutation({
		mutationFn: api.createCheckin,
		onSuccess: () => {
			setShowConfirmation(true);
			setTimeout(() => {
				setShowConfirmation(false);
				resetForm();
			}, 3000);
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
		onError: (error) => {
			console.error("Error creating checkin:", error);
			alert("Error al procesar el check-in");
		},
	});

	const requiredProducts = products.filter(
		(product: Product) => !product.isDeleted && product.required,
	);
	const optionalProducts = products.filter(
		(product: Product) => !product.isDeleted && !product.required,
	);

	const resetForm = () => {
		setWristbandCode("");
		setTransactionNumber("");
		setCart([]);
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
		return cart.reduce(
			(total, item) => total + item.product.price * item.quantity,
			0,
		);
	};

	const getTotalItems = () => {
		return cart.reduce((total, item) => total + item.quantity, 0);
	};

	const handleCheckin = () => {
		if (!wristbandCode || cart.length === 0) {
			alert("Por favor ingrese el código de pulsera y agregue productos");
			return;
		}

		const checkinData: CheckinData = {
			wristbandCode,
			products: cart.map((item) => ({
				id: item.product.id,
				quantity: item.quantity,
			})),
			transactionNumber: transactionNumber || undefined,
		};

		checkinMutation.mutate(checkinData);
	};

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(price);
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
							!wristbandCode || cart.length === 0 || checkinMutation.isPending
						}
						onClick={handleCheckin}
					>
						{checkinMutation.isPending ? (
							<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
						) : (
							<>
								Check-in
								<span className="ml-2">{formatPrice(getTotalPrice())}</span>
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
				{/* Wristband Input */}
				<div className="relative mb-6">
					<QRScanner
						value={wristbandCode}
						onChange={setWristbandCode}
						placeholder="Código de pulsera"
						className="text-lg pr-16 h-14"
					/>
				</div>

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
										return !cartItem; // Solo mostrar productos que no están en el carrito
									})
									.slice(0, 4) // Máximo 4 productos
									.map((product: Product) => (
										<ProductTouchable
											key={product.id}
											product={product as any}
											onClick={addToCart as any}
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
										return !cartItem; // Solo mostrar productos que no están en el carrito
									})
									.slice(0, 4) // Máximo 4 productos
									.map((product: Product) => (
										<ProductTouchable
											key={product.id}
											product={product as any}
											onClick={addToCart as any}
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
										<div className="text-xs text-gray-500">
											{formatPrice(item.product.price)} c/u
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
								<span className="font-bold text-lg text-green-600">
									{formatPrice(getTotalPrice())}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Transaction */}
				<div className="space-y-2">
					<h3 className="font-semibold px-2">No. Transacción (Opcional)</h3>
					<Input
						id="transaction"
						placeholder="Referencia de pago"
						value={transactionNumber}
						onChange={(e) => setTransactionNumber(e.target.value)}
						className="text-sm h-10"
					/>
				</div>

				{/* Confirmation Modal */}
				{showConfirmation && (
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
									<div className="font-medium">Pulsera: {wristbandCode}</div>
									<div className="font-medium">Items: {getTotalItems()}</div>
									<div className="font-bold text-lg text-green-600">
										Total: {formatPrice(getTotalPrice())}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</MobileLayout>
	);
}
