import { API } from "./api";
import { formatCurrency } from "@/lib/currency";

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
	timeValueSeconds?: number | null;
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
	timeValueSeconds?: number | null;
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

export const getProductCategories = async (): Promise<string[]> => {
	const { data } = await API.get<string[]>("/api/products/categories");
	return data;
};

export const createProductCategory = async (name: string): Promise<{ name: string }> => {
	const { data } = await API.post<{ name: string }>("/api/products/categories", { name });
	return data;
};

export const renameProductCategory = async (
	currentName: string,
	newName: string,
): Promise<{ name: string }> => {
	const { data } = await API.put<{ name: string }>(`/api/products/categories/${encodeURIComponent(currentName)}`, { newName });
	return data;
};

export const deleteProductCategory = async (name: string): Promise<{ success: boolean }> => {
	const { data } = await API.delete<{ success: boolean }>(`/api/products/categories/${encodeURIComponent(name)}`);
	return data;
};

export const getTimeProducts = async (): Promise<Product[]> => {
	const { data } = await API.get<Product[]>("/api/products/time");
	return data;
};

// Helper functions for UI
export const formatPrice = (price: number): string => formatCurrency(price);

export const formatTimeValue = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	
	if (hours > 0) {
		if (remainingMinutes > 0) {
			return `${hours}h ${remainingMinutes}m`;
		} else {
			return `${hours}h`;
		}
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
