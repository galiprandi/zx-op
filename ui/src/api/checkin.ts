import { API } from "./api";

export interface CheckinProductPayload {
	id: string;
	quantity: number;
}

export interface CheckinPayload {
	wristbandCode: string;
	products: CheckinProductPayload[];
	transactionNumber?: string;
}

export interface CheckinResponse {
	wristband: {
		id: string;
		qrCode: string;
	};
	session: {
		id: string;
		wristbandId: string;
		status: string;
		purchasedMinutes: number;
	};
	transactions: { id: string }[];
	totalPrice: number;
}

export const createCheckin = async (payload: CheckinPayload) => {
	const { data } = await API.post<CheckinResponse>("/api/checkin", payload);
	return data;
};
