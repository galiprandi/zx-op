import { API } from "./api";
import type { TransactionWithRelations, TransactionStats } from "@shared/types";

export const getTransactions = async (limit = 50): Promise<TransactionWithRelations[]> => {
	const { data } = await API.get<TransactionWithRelations[]>(`/api/transactions?limit=${limit}`);
	return data;
};

export const getTransactionById = async (id: string): Promise<TransactionWithRelations> => {
	const { data } = await API.get<TransactionWithRelations>(`/api/transactions/${id}`);
	return data;
};

export const getTransactionsByPlayerSession = async (playerSessionId: string, limit = 20): Promise<TransactionWithRelations[]> => {
	const { data } = await API.get<TransactionWithRelations[]>(`/api/transactions/player/${playerSessionId}?limit=${limit}`);
	return data;
};

export const getTransactionsByBarcodeId = async (barcodeId: string, limit = 20): Promise<TransactionWithRelations[]> => {
	const { data } = await API.get<TransactionWithRelations[]>(`/api/transactions/barcode/${barcodeId}?limit=${limit}`);
	return data;
};

export const createTransaction = async (payload: {
	playerSessionId: string;
	productId: string;
	quantity: number;
	totalPrice: number;
}): Promise<TransactionWithRelations> => {
	const { data } = await API.post<TransactionWithRelations>("/api/transactions", payload);
	return data;
};

export const getTransactionsByDateRange = async (startDate: Date, endDate: Date): Promise<TransactionWithRelations[]> => {
	const { data } = await API.get<TransactionWithRelations[]>(
		`/api/transactions/daterange?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
	);
	return data;
};

export const getTransactionStats = async (startDate?: Date, endDate?: Date): Promise<TransactionStats> => {
	const params = new URLSearchParams();
	if (startDate && endDate) {
		params.append('startDate', startDate.toISOString());
		params.append('endDate', endDate.toISOString());
	}
	
	const { data } = await API.get<TransactionStats>(`/api/transactions/stats?${params}`);
	return data;
};

// Helper functions for UI
export const formatTransactionDate = (dateString: string): string => {
	return new Date(dateString).toLocaleString('es-CL');
};

export const calculateTotalRevenue = (transactions: TransactionWithRelations[]): number => {
	return transactions.reduce((total, tx) => total + tx.totalPrice, 0);
};

export const getTopProducts = (transactions: TransactionWithRelations[]): Array<{
	product: { name: string; category: string };
	totalRevenue: number;
	quantity: number;
}> => {
	const productMap = new Map();
	
	transactions.forEach(tx => {
		const existing = productMap.get(tx.product.id) || {
			product: tx.product,
			totalRevenue: 0,
			quantity: 0
		};
		
		existing.totalRevenue += tx.totalPrice;
		existing.quantity += tx.quantity;
		
		productMap.set(tx.product.id, existing);
	});
	
	return Array.from(productMap.values())
		.sort((a, b) => b.totalRevenue - a.totalRevenue)
		.slice(0, 5);
};
