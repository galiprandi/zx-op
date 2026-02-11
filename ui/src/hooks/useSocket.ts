import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";

export function useSocket() {
	const queryClient = useQueryClient();

	useEffect(() => {
		// Conectar al servidor de Socket.IO
		const socket = io("http://" + window.location.hostname + ":3002", {
			transports: ["polling", "websocket"],
			timeout: 10000,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			withCredentials: false,
		});

		// Eventos de productos
		socket.on("product:created", () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		});

		socket.on("product:updated", () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		});

		socket.on("product:deleted", () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		});

		// Eventos de pulseras
		socket.on("wristband:created", () => {
			queryClient.invalidateQueries({ queryKey: ["wristbands"] });
		});

		socket.on("wristband:updated", () => {
			queryClient.invalidateQueries({ queryKey: ["wristbands"] });
		});

		// Eventos de sesiones
		socket.on("session:created", () => {
			queryClient.invalidateQueries({ queryKey: ["wristbands"] });
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
		});

		socket.on("session:updated", () => {
			queryClient.invalidateQueries({ queryKey: ["wristbands"] });
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
		});

		socket.on("session:started", () => {
			queryClient.invalidateQueries({ queryKey: ["wristbands"] });
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["session"] });
		});

		socket.on("session:paused", () => {
			queryClient.invalidateQueries({ queryKey: ["wristbands"] });
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["session"] });
		});

		socket.on("session:ended", () => {
			queryClient.invalidateQueries({ queryKey: ["wristbands"] });
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["session"] });
		});

		// Eventos de transacciones
		socket.on("transaction:created", () => {
			queryClient.invalidateQueries({ queryKey: ["wristbands"] });
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		});

		// Eventos de eventos del sistema
		socket.on("event:created", () => {
			queryClient.invalidateQueries({ queryKey: ["events"] });
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
		});

		// Cleanup
		return () => {
			socket.disconnect();
		};
	}, [queryClient]);
}
