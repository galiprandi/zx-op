import Axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

console.log({baseURL});

export const API = Axios.create({
	baseURL,
});
