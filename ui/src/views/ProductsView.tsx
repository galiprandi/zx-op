import { useState } from "react";
import { Search, Plus, Edit2, Package, Clock, AlertCircle, Pencil } from "lucide-react";
import { DesktopShell } from "@/components/DesktopShell";
import { GlassCard } from "@/components/GlassCard";
import { modalOverlayClass, modalPanelBaseClass } from "@/components/modalStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProducts } from "@/hooks/useProducts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	formatPrice,
	formatTimeValue,
	isTimeProduct,
	type Product,
	createProduct,
	updateProduct,
	deleteProduct,
	getProductCategories,
	createProductCategory,
	renameProductCategory,
	type CreateProductRequest,
	type UpdateProductRequest,
} from "@/api/products";

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
		timeValueMinutes: "",
	});

	const queryClient = useQueryClient();
	const { data: categories = [] } = useQuery({
		queryKey: ["productCategories"],
		queryFn: getProductCategories,
	});

	const { products, isLoading, error } = useProducts();

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

	const createCategoryMutation = useMutation({
		mutationFn: createProductCategory,
		onSuccess: ({ name }) => {
			queryClient.invalidateQueries({ queryKey: ["productCategories"] });
			setFormData((prev) => ({ ...prev, category: name }));
		},
		onError: () => alert("No se pudo crear la categoría"),
	});

	const renameCategoryMutation = useMutation({
		mutationFn: ({ currentName, nextName }: { currentName: string; nextName: string }) =>
			renameProductCategory(currentName, nextName),
		onSuccess: ({ name }) => {
			queryClient.invalidateQueries({ queryKey: ["productCategories"] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setFormData((prev) => ({ ...prev, category: name }));
		},
		onError: () => alert("No se pudo renombrar la categoría"),
	});

	const refreshProducts = () => {
		queryClient.invalidateQueries({ queryKey: ["products"] });
	};

	const filteredProducts = products.filter(
		(product) =>
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.category.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			price: "",
			category: "",
			required: false,
			timeValueMinutes: "",
		});
		setEditingProduct(null);
	};

	const handleAddCategory = () => {
		const trimmed = prompt("Nombre de la nueva categoría:")?.trim() || "";
		if (!trimmed) return;
		createCategoryMutation.mutate(trimmed);
	};

	const handleRenameSelectedCategory = () => {
		if (!formData.category) return;
		const nextName = prompt("Nuevo nombre para la categoría:", formData.category)?.trim();
		if (!nextName || nextName === formData.category) return;
		renameCategoryMutation.mutate({ currentName: formData.category, nextName });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const parsedTimeValueMinutes = formData.timeValueMinutes === "" ? undefined : parseInt(formData.timeValueMinutes);

		if (parsedTimeValueMinutes !== undefined && (Number.isNaN(parsedTimeValueMinutes) || parsedTimeValueMinutes <= 0)) {
			return;
		}

		const productData: CreateProductRequest = {
			name: formData.name,
			description: formData.description || undefined,
			price: parseFloat(formData.price),
			category: formData.category,
			required: formData.required,
			timeValueSeconds: parsedTimeValueMinutes !== undefined ? parsedTimeValueMinutes * 60 : undefined,
		};

		if (editingProduct) {
			const updateData: UpdateProductRequest = {
				name: productData.name,
				description: productData.description,
				price: productData.price,
				category: productData.category,
				required: productData.required,
				timeValueSeconds: formData.timeValueMinutes === "" ? null : productData.timeValueSeconds,
			};
			updateMutation.mutate({ id: editingProduct, ...updateData });
		} else {
			createMutation.mutate(productData);
		}

		resetForm();
		setIsCreateModalOpen(false);
	};

	const handleEdit = (product: Product) => {
		setFormData({
			name: product.name,
			description: product.description || "",
			price: product.price.toString(),
			category: product.category,
			required: product.required,
			timeValueMinutes: product.timeValueSeconds ? (product.timeValueSeconds / 60).toString() : "",
		});
		setEditingProduct(product.id);
		setIsCreateModalOpen(true);
	};

	const handleDelete = (productId: string) => {
		if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
			deleteMutation.mutate(productId);
			setIsCreateModalOpen(false);
			resetForm();
		}
	};

	const requiredProducts = filteredProducts.filter((product) => product.required);
	const optionalProducts = filteredProducts.filter((product) => !product.required);

	return (
		<DesktopShell>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-3xl font-bold">Productos</h2>
						<p className="text-muted-foreground">Administra productos y categorías</p>
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

				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Buscar productos..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>

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

				{!isLoading && !error && (
					<>
						<GlassCard className="overflow-hidden">
							<div className="flex items-center gap-2 p-4 border-b border-border">
								<Package className="w-5 h-5 text-primary" />
								<h3 className="text-lg font-semibold">Obligatorios</h3>
								<span className="text-sm text-muted-foreground">({requiredProducts.length})</span>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="bg-muted/40">
										<tr className="text-left">
											<th className="px-4 py-3 font-medium">Nombre</th>
											<th className="px-4 py-3 font-medium">Categoría</th>
											<th className="px-4 py-3 font-medium">Tiempo</th>
											<th className="px-4 py-3 font-medium">Precio</th>
											<th className="px-4 py-3 font-medium text-right">Acción</th>
										</tr>
									</thead>
									<tbody>
										{requiredProducts.map((product) => (
											<tr key={product.id} className="border-t border-border">
												<td className="px-4 py-3">{product.name}</td>
												<td className="px-4 py-3">{product.category}</td>
												<td className="px-4 py-3">{isTimeProduct(product) ? formatTimeValue(product.timeValueSeconds!) : "-"}</td>
												<td className="px-4 py-3">{formatPrice(product.price)}</td>
												<td className="px-4 py-3 text-right">
													<Button onClick={() => handleEdit(product)} variant="outline" size="sm">
														<Edit2 className="w-3 h-3 mr-1" />
														Editar
													</Button>
												</td>
											</tr>
										))}
										{requiredProducts.length === 0 && (
											<tr className="border-t border-border">
												<td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
													No hay productos obligatorios
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</GlassCard>

						<GlassCard className="overflow-hidden">
							<div className="flex items-center gap-2 p-4 border-b border-border">
								<Package className="w-5 h-5 text-primary" />
								<h3 className="text-lg font-semibold">Otros</h3>
								<span className="text-sm text-muted-foreground">({optionalProducts.length})</span>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="bg-muted/40">
										<tr className="text-left">
											<th className="px-4 py-3 font-medium">Nombre</th>
											<th className="px-4 py-3 font-medium">Categoría</th>
											<th className="px-4 py-3 font-medium">Tiempo</th>
											<th className="px-4 py-3 font-medium">Precio</th>
											<th className="px-4 py-3 font-medium text-right">Acción</th>
										</tr>
									</thead>
									<tbody>
										{optionalProducts.map((product) => (
											<tr key={product.id} className="border-t border-border">
												<td className="px-4 py-3">{product.name}</td>
												<td className="px-4 py-3">{product.category}</td>
												<td className="px-4 py-3">{isTimeProduct(product) ? formatTimeValue(product.timeValueSeconds!) : "-"}</td>
												<td className="px-4 py-3">{formatPrice(product.price)}</td>
												<td className="px-4 py-3 text-right">
													<Button onClick={() => handleEdit(product)} variant="outline" size="sm">
														<Edit2 className="w-3 h-3 mr-1" />
														Editar
													</Button>
												</td>
											</tr>
										))}
										{optionalProducts.length === 0 && (
											<tr className="border-t border-border">
												<td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
													No hay productos en esta lista
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</GlassCard>
					</>
				)}

				{!isLoading && !error && filteredProducts.length === 0 && (
					<div className="text-center py-12">
						<Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-medium text-foreground mb-2">
							{searchTerm ? "No se encontraron productos" : "No hay productos"}
						</h3>
						<p className="text-muted-foreground">
							{searchTerm ? "Intenta con otra búsqueda" : "Crea tu primer producto para comenzar"}
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

				{isCreateModalOpen && (
					<div className={`${modalOverlayClass} !mt-0 px-4`}>
						<div className={`${modalPanelBaseClass} max-w-md p-6`}>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-slate-900">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h3>
								<Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)} className="h-8 w-8 p-0">
									×
								</Button>
							</div>

							<form onSubmit={handleSubmit} className="space-y-5">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="name">Nombre *</Label>
										<Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del producto" required />
									</div>
									<div className="space-y-2">
										<Label htmlFor="price">Precio *</Label>
										<Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" required />
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="category">Categoría *</Label>
										<div className="flex items-center gap-2">
											<select id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required>
												<option value="" disabled>Selecciona una categoría</option>
												{categories.map((category) => (
													<option key={category} value={category}>{category}</option>
												))}
											</select>
											<Button type="button" variant="outline" size="icon" onClick={handleAddCategory} disabled={createCategoryMutation.isPending} title="Agregar categoría">
												<Plus className="h-4 w-4" />
											</Button>
											<Button type="button" variant="outline" size="icon" onClick={handleRenameSelectedCategory} disabled={!formData.category || renameCategoryMutation.isPending} title="Editar categoría">
												<Pencil className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="timeValueMinutes">Tiempo (minutos)</Label>
										<div className="relative">
											<Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
											<Input id="timeValueMinutes" type="number" min={1} step={1} value={formData.timeValueMinutes} onChange={(e) => setFormData({ ...formData, timeValueMinutes: e.target.value })} placeholder="30" className="pl-10" />
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="description">Descripción</Label>
									<Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción opcional" />
								</div>

								<div className="flex items-center gap-3">
									<Switch
										id="required"
										checked={formData.required}
										onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
									/>
									<Label htmlFor="required" className="text-sm">Producto obligatorio</Label>
								</div>

								<div className="flex justify-end gap-2 pt-4">
									{editingProduct && (
										<Button type="button" variant="destructive" onClick={() => handleDelete(editingProduct)} disabled={deleteMutation.isPending} className="mr-auto">
											{deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
										</Button>
									)}
									<Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
									<Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
										{createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingProduct ? "Actualizar" : "Crear"}
									</Button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</DesktopShell>
	);
}
