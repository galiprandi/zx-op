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

// Real API functions
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = {
	getProducts: async () => {
		const response = await fetch(`${API_BASE}/api/products`);
		if (!response.ok) throw new Error("Failed to fetch products");
		return response.json();
	},
	createProduct: async (data: ProductFormData) => {
		const response = await fetch(`${API_BASE}/api/products`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error("Failed to create product");
		return response.json();
	},
	updateProduct: async (id: string, data: ProductFormData) => {
		const response = await fetch(`${API_BASE}/api/products/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error("Failed to update product");
		return response.json();
	},
	deleteProduct: async (id: string) => {
		const response = await fetch(`${API_BASE}/api/products/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) throw new Error("Failed to delete product");
		return response.json();
	},
};

interface ProductFormData {
	name: string;
	description: string;
	price: number;
	category: string;
	required: boolean;
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
	});

	const queryClient = useQueryClient();

	const {
		data: products = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["products"],
		queryFn: api.getProducts,
		retry: 3,
		retryDelay: 1000,
	});

	const createMutation = useMutation({
		mutationFn: api.createProduct,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setIsCreateModalOpen(false);
			resetForm();
		},
		onError: (error) => {
			console.error("Error creating product:", error);
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
			api.updateProduct(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setIsCreateModalOpen(false);
			setEditingProduct(null);
			resetForm();
		},
		onError: (error) => {
			console.error("Error updating product:", error);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: api.deleteProduct,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
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
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (editingProduct) {
			updateMutation.mutate({ id: editingProduct, data: formData });
		} else {
			createMutation.mutate(formData);
		}
	};

	const handleEdit = (product: any) => {
		setEditingProduct(product.id);
		setFormData({
			name: product.name,
			description: product.description,
			price: product.price,
			category: product.category,
			required: product.required || false,
		});
		setIsCreateModalOpen(true);
	};

	const handleDelete = (id: string) => {
		if (confirm("¿Estás seguro de eliminar este producto?")) {
			deleteMutation.mutate(id);
		}
	};

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(price);
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
									<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
										<Package className="w-4 h-4 text-white" />
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

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-xl font-bold text-green-500">
										{formatPrice(product.price)}
									</span>
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
										onClick={() => handleDelete(product.id)}
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
									<Label htmlFor="name">Nombre</Label>
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
									<Label htmlFor="category">Categoría</Label>
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
									<Label htmlFor="price">Precio (CLP)</Label>
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
