import { useState } from "react";
import { Search, Plus, Edit2, Trash2, Package, Clock, AlertCircle } from "lucide-react";
import { DesktopShell } from "@/components/DesktopShell";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts } from "@/hooks/useProducts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPrice, formatTimeValue, isTimeProduct, type Product, createProduct, updateProduct, deleteProduct, type CreateProductRequest, type UpdateProductRequest } from "@/api/products";

export function ProductsView() {
	const [searchTerm, setSearchTerm] = useState("");
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		price: "",
		category: "",
		required: false,
		timeValueSeconds: "",
	});

	const queryClient = useQueryClient();
	const {
		products,
		isLoading,
		error,
	} = useProducts();

	// Mutations
	const createMutation = useMutation({
		mutationFn: createProduct,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setIsCreateModalOpen(false);
			resetForm();
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, ...data }: { id: string } & UpdateProductRequest) => updateProduct(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setIsCreateModalOpen(false);
			resetForm();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteProduct,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});

	const refreshProducts = () => {
		queryClient.invalidateQueries({ queryKey: ["products"] });
	};

	// Filter products based on search term
	const filteredProducts = products.filter(
		(product) =>
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.category.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	// Reset form
	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			price: "",
			category: "",
			required: false,
			timeValueSeconds: "",
		});
		setEditingProduct(null);
	};

	// Handle create/update
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const productData: CreateProductRequest = {
			name: formData.name,
			description: formData.description || undefined,
			price: parseFloat(formData.price),
			category: formData.category,
			required: formData.required,
			timeValueSeconds: formData.timeValueSeconds ? parseInt(formData.timeValueSeconds) : undefined,
		};

		if (editingProduct) {
			const updateData: UpdateProductRequest = {
				name: productData.name,
				description: productData.description,
				price: productData.price,
				category: productData.category,
				required: productData.required,
				timeValueSeconds: productData.timeValueSeconds,
			};
			updateMutation.mutate({ id: editingProduct, ...updateData });
		} else {
			createMutation.mutate(productData);
		}

		resetForm();
		setIsCreateModalOpen(false);
	};

	// Handle edit
	const handleEdit = (product: Product) => {
		setFormData({
			name: product.name,
			description: product.description || "",
			price: product.price.toString(),
			category: product.category,
			required: product.required,
			timeValueSeconds: product.timeValueSeconds?.toString() || "",
		});
		setEditingProduct(product.id);
		setIsCreateModalOpen(true);
	};

	// Handle delete
	const handleDelete = (productId: string) => {
		if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
			deleteMutation.mutate(productId);
		}
	};

	// Group products by category
	const productsByCategory = filteredProducts.reduce((acc, product) => {
		if (!acc[product.category]) {
			acc[product.category] = [];
		}
		acc[product.category].push(product);
		return acc;
	}, {} as Record<string, Product[]>);

	return (
		<DesktopShell>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-3xl font-bold">Productos</h2>
						<p className="text-muted-foreground">
							Gestión de productos y servicios
						</p>
					</div>
					<Button
						onClick={() => {
							resetForm();
							setIsCreateModalOpen(true);
						}}
						className="flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />
						Nuevo Producto
					</Button>
				</div>

				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Buscar productos..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Loading/Error States */}
				{isLoading && (
					<div className="flex items-center justify-center min-h-[40vh]">
						<div className="text-center">
							<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
							<p className="text-muted-foreground">Cargando productos...</p>
						</div>
					</div>
				)}

				{error && (
					<div className="flex items-center justify-center min-h-[40vh]">
						<div className="text-center">
							<AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
							<p className="text-destructive font-medium">Error al cargar productos</p>
							<Button onClick={refreshProducts} variant="outline" className="mt-4">
								Reintentar
							</Button>
						</div>
					</div>
				)}

				{/* Products Grid by Category */}
				{!isLoading && !error && Object.entries(productsByCategory).map(([category, categoryProducts]) => (
					<div key={category} className="space-y-4">
						<div className="flex items-center gap-2">
							<Package className="w-5 h-5 text-primary" />
							<h3 className="text-xl font-semibold text-foreground">{category}</h3>
							<span className="text-sm text-muted-foreground">
								({categoryProducts.length} productos)
							</span>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{categoryProducts.map((product) => (
								<GlassCard key={product.id} className="relative">
									{product.required && (
										<div className="absolute top-2 right-2">
											<span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
												Requerido
											</span>
										</div>
									)}
									<div className="space-y-3">
										<div>
											<h4 className="font-semibold text-foreground">{product.name}</h4>
											{product.description && (
												<p className="text-sm text-muted-foreground mt-1">
													{product.description}
												</p>
											)}
										</div>
										<div className="flex items-center justify-between">
											<span className="text-lg font-bold text-primary">
												{formatPrice(product.price)}
											</span>
											{isTimeProduct(product) && (
												<span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
													{formatTimeValue(product.timeValueSeconds!)}
												</span>
											)}
										</div>
										<div className="flex gap-2">
											<Button
												onClick={() => handleEdit(product)}
												variant="outline"
												size="sm"
												className="flex-1"
											>
												<Edit2 className="w-3 h-3 mr-1" />
												Editar
											</Button>
											<Button
												onClick={() => handleDelete(product.id)}
												variant="outline"
												size="sm"
												className="flex-1 text-destructive hover:text-destructive"
											>
												<Trash2 className="w-3 h-3 mr-1" />
												Eliminar
											</Button>
										</div>
									</div>
								</GlassCard>
							))}
						</div>
					</div>
				))}

				{!isLoading && !error && filteredProducts.length === 0 && (
					<div className="text-center py-12">
						<Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-medium text-foreground mb-2">
							{searchTerm ? "No se encontraron productos" : "No hay productos"}
						</h3>
						<p className="text-muted-foreground">
							{searchTerm 
								? "Intenta con otra búsqueda" 
								: "Crea tu primer producto para comenzar"
							}
						</p>
						{!searchTerm && (
							<Button
								onClick={() => {
									resetForm();
									setIsCreateModalOpen(true);
								}}
								className="mt-4"
							>
								<Plus className="w-4 h-4 mr-2" />
								Crear Producto
							</Button>
						)}
					</div>
				)}

				{/* Create/Edit Modal */}
				{isCreateModalOpen && (
					<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center px-4">
						<GlassCard className="w-full max-w-md">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-lg font-semibold">
									{editingProduct ? "Editar Producto" : "Nuevo Producto"}
								</h3>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setIsCreateModalOpen(false)}
									className="h-8 w-8 p-0"
								>
									×
								</Button>
							</div>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<Label htmlFor="name">Nombre *</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										placeholder="Nombre del producto"
										required
									/>
								</div>

								<div>
									<Label htmlFor="description">Descripción</Label>
									<Input
										id="description"
										value={formData.description}
										onChange={(e) => setFormData({ ...formData, description: e.target.value })}
										placeholder="Descripción opcional"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="price">Precio *</Label>
										<Input
											id="price"
											type="number"
											step="0.01"
											value={formData.price}
											onChange={(e) => setFormData({ ...formData, price: e.target.value })}
											placeholder="0.00"
											required
										/>
									</div>

									<div>
										<Label htmlFor="category">Categoría *</Label>
										<Input
											id="category"
											value={formData.category}
											onChange={(e) => setFormData({ ...formData, category: e.target.value })}
											placeholder="Tiempo, Accesorios, etc."
											required
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="timeValueSeconds">
										Tiempo (segundos) - solo para productos de tiempo
									</Label>
									<div className="relative">
										<Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
										<Input
											id="timeValueSeconds"
											type="number"
											value={formData.timeValueSeconds}
											onChange={(e) => setFormData({ ...formData, timeValueSeconds: e.target.value })}
											placeholder="1800 (30 minutos)"
											className="pl-10"
										/>
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Deja vacío para productos sin tiempo (ej: medias, snacks)
									</p>
								</div>

								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										id="required"
										checked={formData.required}
										onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
										className="rounded border-border"
									/>
									<Label htmlFor="required" className="text-sm">
										Producto obligatorio (requerido para todos los check-ins)
									</Label>
								</div>

								<div className="flex justify-end gap-2 pt-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsCreateModalOpen(false)}
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										disabled={createMutation.isPending || updateMutation.isPending}
									>
										{createMutation.isPending || updateMutation.isPending
											? "Guardando..."
											: editingProduct
											? "Actualizar"
											: "Crear"
										}
									</Button>
								</div>
							</form>
						</GlassCard>
					</div>
				)}
			</div>
		</DesktopShell>
	);
}
