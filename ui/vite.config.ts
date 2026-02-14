import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certPath = path.resolve(__dirname, "certs/cert.pem");
const keyPath = path.resolve(__dirname, "certs/key.pem");

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
			},
			includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
			manifest: {
				name: "Zona Xtreme",
				short_name: "ZX",
				description: "Sistema de gestión de pulseras y ocupación",
				theme_color: "#000000",
				background_color: "#000000",
				display: "standalone",
				icons: [
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@shared": path.resolve(__dirname, "../shared"),
		},
	},
	server: {
		port: 8080,
		host: "0.0.0.0", // Permitir acceso desde cualquier dispositivo en la red local
		strictPort: true,
		https: {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath),
		},
		proxy: {
			"/api": {
				target: "https://192.168.68.51:3000",
				changeOrigin: true,
				// Allow self-signed certs on the local mesh API endpoint
				secure: false,
			},
		},
	},
	build: {
		outDir: "dist",
		sourcemap: true,
	},
});
