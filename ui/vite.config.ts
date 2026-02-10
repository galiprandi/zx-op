import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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
		port: 3000,
		host: true, // Permitir acceso desde cualquier dispositivo en la red local
		https: {
			// Generar certificados automáticamente si no existen
			key: './certs/key.pem',
			cert: './certs/cert.pem'
		}
	},
	build: {
		outDir: "dist",
		sourcemap: true,
	},
});
