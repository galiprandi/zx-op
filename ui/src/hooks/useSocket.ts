import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";

export function useSocket() {
	const queryClient = useQueryClient();

	useEffect(() => {
		// Conectar al servidor de Socket.IO
		const socket = io("http://" + window.location.hostname + ":" + (import.meta.env.VITE_API_SOCKET_PORT || '4000'), {
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

		// Eventos de sesiones (nuevo modelo PlayerSession)
		socket.on("session:play", () => {
			queryClient.invalidateQueries({ queryKey: ["playerSession"] });
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
		});

		socket.on("session:pause", () => {
			queryClient.invalidateQueries({ queryKey: ["playerSession"] });
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
		});

		socket.on("session:updated", () => {
			queryClient.invalidateQueries({ queryKey: ["playerSession"] });
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
		});

		// Eventos de transacciones
		socket.on("transaction:created", () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			queryClient.invalidateQueries({ queryKey: ["checkinHistory"] });
		});

		// Cleanup
		return () => {
			socket.disconnect();
		};
	}, [queryClient]);
}
