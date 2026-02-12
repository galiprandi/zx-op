import { API } from "./api";

export interface SystemSettings {
	id: string;
	maxOccupancy: number;
	createdAt: string;
	updatedAt: string;
}

export const getSystemSettings = async (): Promise<SystemSettings> => {
	const { data } = await API.get<SystemSettings>("/api/system/settings");
	return data;
};

export const updateSystemSettings = async (
	params: Pick<SystemSettings, "maxOccupancy">
): Promise<SystemSettings> => {
	const { data } = await API.put<SystemSettings>("/api/system/settings", params);
	return data;
};
