import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Check,
	Edit2,
	Package,
	Plus,
	Search,
	Tag,
	Trash2,
	X,
	Clock,
	Timer,
} from "lucide-react";
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
import {
	getProducts,
	createProduct,
	updateProduct,
	deleteProduct,
	formatPrice,
	formatTimeValue,
	isTimeProduct,
	type Product,
	type CreateProductRequest,
	type UpdateProductRequest,
} from "@/api/products";

interface ProductFormData {
	name: string;
	description: string;
	price: number;
	category: string;
	required: boolean;
	timeValueSeconds?: number;
}

export function ProductsView() {
	useSocket(); // Initialize socket connection for real-time updates

	const [searchTerm, setSearchTerm] = useState("");
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<string | null>(null);
	const [formData, setFormData] = useState<ProductFormData>({
		name: "",
		description: "",
		price: 0,
		category: "Tiempo",
		required: false,
		timeValueSeconds: undefined,
	});

	const queryClient = useQueryClient();

	const {
		data: products = [],
		isLoading,
	} = useQuery({
		queryKey: ["products"],
		queryFn: getProducts,
		retry: 3,
		retryDelay: 1000,
	});

	const createMutation = useMutation({
		mutationFn: (data: CreateProductRequest) => createProduct(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setIsCreateModalOpen(false);
			resetForm();
		},
		onError: (error) => {
			console.error("Error creating product:", error);
			alert("Error al crear producto. Por favor intenta nuevamente.");
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
			updateProduct(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setIsCreateModalOpen(false);
			setEditingProduct(null);
			resetForm();
		},
		onError: (error) => {
			console.error("Error updating product:", error);
			alert("Error al actualizar producto. Por favor intenta nuevamente.");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteProduct,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
		onError: (error) => {
			console.error("Error deleting product:", error);
			alert("Error al eliminar producto. Por favor intenta nuevamente.");
		},
	});

	const filteredProducts = products.filter(
		(product) =>
			!product.isDeleted &&
			product.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			price: 0,
			category: "Tiempo",
			required: false,
			timeValueSeconds: undefined,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validate form
		if (!formData.name.trim()) {
			alert("El nombre del producto es requerido");
			return;
		}

		if (formData.price < 0) {
			alert("El precio debe ser un valor positivo");
			return;
		}

		if (formData.timeValueSeconds !== undefined && formData.timeValueSeconds < 0) {
			alert("El valor de tiempo debe ser un valor positivo");
			return;
		}

		const submitData = {
			name: formData.name.trim(),
			description: formData.description.trim(),
			price: formData.price,
			category: formData.category,
			required: formData.required,
			...(formData.timeValueSeconds !== undefined && { timeValueSeconds: formData.timeValueSeconds }),
		};

		if (editingProduct) {
			updateMutation.mutate({ id: editingProduct, data: submitData });
		} else {
			createMutation.mutate(submitData);
		}
	};

	const handleEdit = (product: Product) => {
		setEditingProduct(product.id);
		setFormData({
			name: product.name,
			description: product.description || "",
			price: product.price,
			category: product.category,
			required: product.required,
			timeValueSeconds: product.timeValueSeconds || undefined,
		});
		setIsCreateModalOpen(true);
	};

	const handleDelete = (id: string, productName: string) => {
		if (confirm(`¿Estás seguro de eliminar "${productName}"? Esta acción no se puede deshacer.`)) {
			deleteMutation.mutate(id);
		}
	};

	const getProductCardIcon = (product: Product) => {
		if (isTimeProduct(product)) {
			return <Timer className="w-4 h-4 text-white" />;
		}
		return <Package className="w-4 h-4 text-white" />;
	};

	const getProductCardGradient = (product: Product) => {
		if (isTimeProduct(product)) {
			return "from-blue-500 to-cyan-600";
		}
		return "from-purple-500 to-pink-600";
	};

	const getTimeBadge = (product: Product) => {
		if (!isTimeProduct(product)) return null;
		
		const timeValue = product.timeValueSeconds!;
		if (timeValue >= 3600) {
			return `${Math.floor(timeValue / 3600)}h`;
		}
		return `${Math.floor(timeValue / 60)}m`;
	};

	return (
		<div className="max-w-6xl mx-auto space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold">Productos</h2>
					<p className="text-muted-foreground">
						Gestiona el catálogo de productos y servicios
					</p>
				</div>
				<Button
					onClick={() => setIsCreateModalOpen(true)}
					className="flex items-center gap-2 h-12 px-6"
				>
					<Plus className="w-4 h-4" />
					Nuevo Producto
				</Button>
			</div>

			{/* Search */}
			<Card className="glass">
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
						<Input
							placeholder="Buscar productos..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 h-12"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Products Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredProducts.map((product) => (
					<Card
						key={product.id}
						className="glass hover:shadow-lg transition-shadow animate-fadeIn"
					>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-2">
									<div className={`w-8 h-8 bg-gradient-to-br ${getProductCardGradient(product)} rounded-lg flex items-center justify-center`}>
										{getProductCardIcon(product)}
									</div>
									<div>
										<CardTitle className="text-lg">{product.name}</CardTitle>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Tag className="w-3 h-3" />
											{product.category}
											{product.required && (
												<span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
													Obligatorio
												</span>
											)}
											{isTimeProduct(product) && (
												<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
													<Clock className="w-3 h-3" />
													Tiempo
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{product.description && (
								<CardDescription className="text-sm">
									{product.description}
								</CardDescription>
							)}

							{/* Time Value Display */}
							{isTimeProduct(product) && (
								<div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
									<Clock className="w-4 h-4 text-blue-600" />
									<span className="text-sm font-medium text-blue-700">
										{formatTimeValue(product.timeValueSeconds!)}
									</span>
								</div>
							)}

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-xl font-bold text-green-500">
										{formatPrice(product.price)}
									</span>
									{getTimeBadge(product) && (
										<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
											{getTimeBadge(product)}
										</span>
									)}
								</div>

								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleEdit(product)}
										className="h-8 w-8 p-0"
									>
										<Edit2 className="w-3 h-3" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDelete(product.id, product.name)}
										className="h-8 w-8 p-0 text-destructive hover:text-destructive"
									>
										<Trash2 className="w-3 h-3" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Empty State */}
			{filteredProducts.length === 0 && !isLoading && (
				<Card className="glass">
					<CardContent className="pt-12 pb-12 text-center">
						<Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
						<h3 className="text-lg font-medium mb-2">
							No se encontraron productos
						</h3>
						<p className="text-muted-foreground mb-4">
							{searchTerm
								? "Intenta con otra búsqueda"
								: "Crea tu primer producto"}
						</p>
						{!searchTerm && (
							<Button onClick={() => setIsCreateModalOpen(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Crear Producto
							</Button>
						)}
					</CardContent>
				</Card>
			)}

			{/* Create/Edit Modal */}
			{isCreateModalOpen && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<Card className="w-full max-w-md glass animate-fadeIn">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>
									{editingProduct ? "Editar Producto" : "Nuevo Producto"}
								</CardTitle>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setIsCreateModalOpen(false);
										setEditingProduct(null);
										resetForm();
									}}
									className="h-8 w-8 p-0"
								>
									<X className="w-4 h-4" />
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nombre *</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										placeholder="Nombre del producto"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="category">Categoría *</Label>
									<select
										id="category"
										value={formData.category}
										onChange={(e) =>
											setFormData({ ...formData, category: e.target.value })
										}
										className="w-full h-12 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										required
									>
										<option value="Tiempo">Tiempo</option>
										<option value="Accesorios">Accesorios</option>
										<option value="Alimentos">Alimentos</option>
										<option value="Bebidas">Bebidas</option>
										<option value="Otros">Otros</option>
									</select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="price">Precio (CLP) *</Label>
									<Input
										id="price"
										type="number"
										value={formData.price}
										onChange={(e) =>
											setFormData({
												...formData,
												price: Number(e.target.value),
											})
										}
										placeholder="0"
										min="0"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="timeValueSeconds">
										Valor de Tiempo (segundos)
									</Label>
									<Input
										id="timeValueSeconds"
										type="number"
										value={formData.timeValueSeconds || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												timeValueSeconds: e.target.value ? Number(e.target.value) : undefined,
											})
										}
										placeholder="Ej: 1800 para 30 minutos"
										min="0"
									/>
									<p className="text-xs text-muted-foreground">
										Opcional. Define cuánto tiempo agrega este producto al check-in.
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="description">Descripción</Label>
									<textarea
										id="description"
										value={formData.description}
										onChange={(e) =>
											setFormData({ ...formData, description: e.target.value })
										}
										placeholder="Descripción del producto (opcional)"
										rows={3}
										className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<input
											id="required"
											type="checkbox"
											checked={formData.required}
											onChange={(e) =>
												setFormData({ ...formData, required: e.target.checked })
											}
											className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
										/>
										<Label htmlFor="required" className="text-sm font-medium">
											Producto obligatorio
										</Label>
									</div>
									<p className="text-xs text-muted-foreground">
										Los productos obligatorios aparecerán en la sección de
										productos requeridos en el check-in
									</p>
								</div>

								<div className="flex gap-3 pt-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setIsCreateModalOpen(false);
											setEditingProduct(null);
											resetForm();
										}}
										className="flex-1 h-12"
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										disabled={
											createMutation.isPending || updateMutation.isPending
										}
										className="flex-1 h-12"
									>
										{createMutation.isPending || updateMutation.isPending ? (
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										) : (
											<>
												{editingProduct ? (
													<Check className="w-4 h-4 mr-2" />
												) : (
													<Plus className="w-4 h-4 mr-2" />
												)}
												{editingProduct ? "Actualizar" : "Crear"}
											</>
										)}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
