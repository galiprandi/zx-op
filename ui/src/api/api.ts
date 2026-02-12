import Axios from "axios";
const { VITE_API_BASE_URL, VITE_API_BASE_PORT } = import.meta.env;

export const API = Axios.create({
	baseURL: `${VITE_API_BASE_URL}:${VITE_API_BASE_PORT}`,
});
