import Axios from "axios";
import { updateServerClockFromHeader } from "@/lib/serverClock";

export const API = Axios.create({
	baseURL: "",
});

API.interceptors.response.use((response) => {
	const serverDate = response.headers?.date as string | undefined;
	updateServerClockFromHeader(serverDate);
	return response;
});
