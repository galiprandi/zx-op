import { API } from "./api";

export interface SystemSettings {
	id: string;
	maxOccupancy: number;
	siteName?: string | null;
	logoUrl?: string | null;
	operationalDayStart?: string;
	timezone?: string;
	createdAt: string;
	updatedAt: string;
}

export const getSystemSettings = async (): Promise<SystemSettings> => {
	const { data } = await API.get<SystemSettings>("/api/system/settings");
	return data;
};

export const updateSystemSettings = async (
	params: Partial<Pick<SystemSettings, "maxOccupancy" | "siteName" | "logoUrl" | "operationalDayStart" | "timezone">>
): Promise<SystemSettings> => {
	const { data } = await API.put<SystemSettings>("/api/system/settings", params);
	return data;
};
