import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/hooks/useSocket";

// Real API functions
const api = {
	getProducts: async () => {
		const response = await fetch("http://localhost:3001/api/products");
		if (!response.ok) throw new Error("Failed to fetch products");
		return response.json();
	},
};

export function CheckInView() {
	useSocket(); // Initialize socket connection for real-time updates

	const [wristbandCode, setWristbandCode] = useState("");

	const { data: products = [] } = useQuery({
		queryKey: ["products"],
		queryFn: api.getProducts,
	});

	const requiredProducts = products.filter(
		(product) => !product.isDeleted && product.required,
	);
	const optionalProducts = products.filter(
		(product) => !product.isDeleted && !product.required,
	);

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-bold mb-2">Check-in</h2>
				<p className="text-muted-foreground">
					Asigna tiempo y productos a una pulsera
				</p>
			</div>

			{/* Wristband Input */}
			<Card>
				<CardHeader>
					<CardTitle>Código de Pulsera</CardTitle>
					<CardDescription>
						Escanea o ingresa el código QR/Barcode
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="wristband">Código</Label>
						<Input
							id="wristband"
							placeholder="Ingrese o escanee código"
							value={wristbandCode}
							onChange={(e) => setWristbandCode(e.target.value)}
							className="text-lg"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Required Products */}
			<Card>
				<CardHeader>
					<CardTitle>Productos Obligatorios</CardTitle>
					<CardDescription>
						Productos requeridos para el ingreso
					</CardDescription>
				</CardHeader>
				<CardContent>
					{requiredProducts.length > 0 ? (
						<div className="space-y-3">
							{requiredProducts.map((product) => (
								<div
									key={product.id}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<div>
										<div className="font-medium">{product.name}</div>
										{product.description && (
											<div className="text-sm text-muted-foreground">
												{product.description}
											</div>
										)}
									</div>
									<div className="text-lg font-bold text-green-600">
										${product.price.toLocaleString("es-CL")}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center text-muted-foreground py-8">
							📦 No hay productos obligatorios
						</div>
					)}
				</CardContent>
			</Card>

			{/* Optional Products */}
			<Card>
				<CardHeader>
					<CardTitle>Productos Opcionales</CardTitle>
					<CardDescription>
						Agrega productos adicionales si lo deseas
					</CardDescription>
				</CardHeader>
				<CardContent>
					{optionalProducts.length > 0 ? (
						<div className="space-y-3">
							{optionalProducts.map((product) => (
								<div
									key={product.id}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<div>
										<div className="font-medium">{product.name}</div>
										{product.description && (
											<div className="text-sm text-muted-foreground">
												{product.description}
											</div>
										)}
									</div>
									<div className="text-lg font-bold text-green-600">
										${product.price.toLocaleString("es-CL")}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center text-muted-foreground py-8">
							🛒 No hay productos opcionales disponibles
						</div>
					)}
				</CardContent>
			</Card>

			{/* Transaction */}
			<Card>
				<CardHeader>
					<CardTitle>Transacción</CardTitle>
					<CardDescription>Número de transacción (opcional)</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Label htmlFor="transaction">N° Transacción</Label>
						<Input
							id="transaction"
							placeholder="Opcional"
							className="text-lg"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex gap-4">
				<Button
					size="lg"
					className="flex-1 h-14 text-lg"
					disabled={!wristbandCode}
				>
					✅ Procesar Check-in
				</Button>
				<Button
					variant="outline"
					size="lg"
					className="flex-1 h-14 text-lg"
					onClick={() => setWristbandCode("")}
				>
					🔄 Limpiar
				</Button>
			</div>
		</div>
	);
}
