import { API } from "./api";

export interface Product {
	id: string;
	name: string;
	description?: string;
	price: number;
	category: string;
	required: boolean;
	timeValueSeconds?: number;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateProductRequest {
	name: string;
	description?: string;
	price: number;
	category: string;
	required: boolean;
	timeValueSeconds?: number;
}

export interface UpdateProductRequest {
	name?: string;
	description?: string;
	price?: number;
	category?: string;
	required?: boolean;
	timeValueSeconds?: number;
}

export interface ProductPayload {
	name: string;
	description?: string;
	price: number;
	category: string;
	required?: boolean;
	timeValueSeconds?: number;
}

export interface ProductUpdatePayload {
	name?: string;
	description?: string;
	price?: number;
	category?: string;
	required?: boolean;
	timeValueSeconds?: number;
}

export const getProducts = async (): Promise<Product[]> => {
	const { data } = await API.get<Product[]>("/api/products");
	return data;
};

export const getProductById = async (id: string): Promise<Product> => {
	const { data } = await API.get<Product>(`/api/products/${id}`);
	return data;
};

export const createProduct = async (payload: ProductPayload): Promise<Product> => {
	const { data } = await API.post<Product>("/api/products", payload);
	return data;
};

export const updateProduct = async (id: string, payload: ProductUpdatePayload): Promise<Product> => {
	const { data } = await API.put<Product>(`/api/products/${id}`, payload);
	return data;
};

export const deleteProduct = async (id: string): Promise<Product> => {
	const { data } = await API.delete<Product>(`/api/products/${id}`);
	return data;
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
	const { data } = await API.get<Product[]>(`/api/products/category/${category}`);
	return data;
};

export const getTimeProducts = async (): Promise<Product[]> => {
	const { data } = await API.get<Product[]>("/api/products/time");
	return data;
};

// Helper functions for UI
export const formatPrice = (price: number): string => {
	return new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS'
	}).format(price);
};

export const formatTimeValue = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	
	if (hours > 0) {
		return `${hours}h ${minutes % 60}m`;
	} else if (minutes > 0) {
		return `${minutes}m`;
	} else {
		return `${seconds}s`;
	}
};

export const isTimeProduct = (product: Product): boolean => {
	return product.timeValueSeconds !== null && product.timeValueSeconds !== undefined;
};

export const getProductTypeLabel = (product: Product): string => {
	if (isTimeProduct(product)) {
		return `Tiempo: ${formatTimeValue(product.timeValueSeconds!)}`;
	}
	return product.category;
};
