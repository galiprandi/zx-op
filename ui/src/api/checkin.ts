import { API } from "./api";
import type { PlayerSession, Transaction } from "@shared/types";

export interface CheckinProductPayload {
	id: string;
	quantity: number;
}

export interface CheckinPayload {
	barcodeId: string;
	products: CheckinProductPayload[];
}

export interface CheckinResponse {
	playerSession: PlayerSession & {
		remainingSeconds: number;
		remainingMinutes: number;
	};
	transactions: Transaction[];
	totalSecondsAdded: number;
}

export const createCheckin = async (payload: CheckinPayload): Promise<CheckinResponse> => {
	const { data } = await API.post<CheckinResponse>("/api/checkin", payload);
	return data;
};

export const getCheckinHistory = async (barcodeId: string, limit = 10): Promise<Transaction[]> => {
	const { data } = await API.get<Transaction[]>(`/api/checkin/history/${barcodeId}?limit=${limit}`);
	return data;
};

// Helper functions for UI
export const calculateTotalPrice = (products: CheckinProductPayload[], productCatalog: Array<{ id: string; price: number }>): number => {
	return products.reduce((total, item) => {
		const product = productCatalog.find(p => p.id === item.id);
		return total + (product?.price || 0) * item.quantity;
	}, 0);
};

export const calculateTotalTime = (products: CheckinProductPayload[], productCatalog: Array<{ id: string; timeValueSeconds?: number | null }>): number => {
	return products.reduce((total, item) => {
		const product = productCatalog.find(p => p.id === item.id);
		const timeValue = product?.timeValueSeconds || 0;
		return total + timeValue * item.quantity;
	}, 0);
};
