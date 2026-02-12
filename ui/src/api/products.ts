import type { Product as SharedProduct } from "@shared/types";
import { API } from "./api";

export type Product = SharedProduct & {
	required?: boolean;
	isDeleted?: boolean;
};

export interface ProductPayload {
	name: string;
	description?: string;
	price: number;
	category: string;
	required: boolean;
}

export const getProducts = async () => {
	const { data } = await API.get<Product[]>("/api/products");
	return data;
};

export const createProduct = async (payload: ProductPayload) => {
	const { data } = await API.post<Product>("/api/products", payload);
	return data;
};

export const updateProduct = async (id: string, payload: ProductPayload) => {
	const { data } = await API.put<Product>(`/api/products/${id}`, payload);
	return data;
};

export const deleteProduct = async (id: string) => {
	const { data } = await API.delete<Product>(`/api/products/${id}`);
	return data;
};
