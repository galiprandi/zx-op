import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certPath = path.resolve(__dirname, "ui/certs/cert.pem");
const keyPath = path.resolve(__dirname, "ui/certs/key.pem");

export default defineConfig({
	server: {
		host: "0.0.0.0",
		https: {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath),
		},
		port: 8080,
		strictPort: true,
	},
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
	],
});
