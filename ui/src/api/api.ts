import Axios from "axios";
import { updateServerClockFromHeader } from "@/lib/serverClock";

const baseURL = `${import.meta.env.VITE_API_BASE_URL}:${import.meta.env.VITE_API_BASE_PORT}`;

export const API = Axios.create({
	baseURL,
});

API.interceptors.response.use((response) => {
	const serverDate = response.headers?.date as string | undefined;
	updateServerClockFromHeader(serverDate);
	return response;
});
