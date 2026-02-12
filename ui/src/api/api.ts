import Axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const baseURL = rawBaseURL.startsWith("http")
	? rawBaseURL
	: `http://${rawBaseURL.replace(/^\/\//, "")}`;

export const API = Axios.create({
	baseURL,
});
