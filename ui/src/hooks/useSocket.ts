import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Product, Transaction, PlayerSession } from "@shared/types";
import { io } from "socket.io-client";
const { VITE_API_BASE_URL, VITE_API_BASE_PORT } = import.meta.env;

interface SessionPayload {
	playerSession: PlayerSession;
	activeSessions?: PlayerSession[];
	dashboardStats?: unknown;
}

interface TransactionPayload {
	transaction: Transaction;
	dashboardStats?: unknown;
}

export function useSocket() {
	const queryClient = useQueryClient();

	useEffect(() => {
		// Conectar al servidor de Socket.IO
		const socket = io(`${VITE_API_BASE_URL}:${VITE_API_BASE_PORT}`, {
			transports: ["polling", "websocket"],
			timeout: 10000,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			withCredentials: false,
		});

		// Eventos de productos - OPTIMIZED
		socket.on("product:created", ({ product }: { product: Product }) => {
			// OPTIMIZED: Use setQueryData for immediate update
			queryClient.setQueryData(["products"], (old: any[] = []) => [...old, product]);
		});

		socket.on("product:updated", ({ product }: { product: Product }) => {
			// OPTIMIZED: Use setQueryData for immediate update
			queryClient.setQueryData(["products"], (old: any[] = []) => 
				old.map((p: any) => p.id === product.id ? product : p)
			);
		});

		socket.on("product:deleted", ({ productId }: { productId: string }) => {
			// OPTIMIZED: Use setQueryData for immediate update
			queryClient.setQueryData(["products"], (old: any[] = []) => 
				old.filter((p: any) => p.id !== productId)
			);
		});

		// Eventos de sesiones (nuevo modelo PlayerSession) - OPTIMIZED
		socket.on("session:created", ({ playerSession, activeSessions }: SessionPayload) => {
			// OPTIMIZED: Use setQueryData for immediate updates
			queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
			if (activeSessions) {
				queryClient.setQueryData(["activeSessions"], activeSessions);
			}
		});

		socket.on("session:play", ({ playerSession }: { playerSession: PlayerSession }) => {
			// OPTIMIZED: Only update specific session, not all sessions
			if (playerSession) {
				queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
			}
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
		});

		socket.on("session:pause", ({ playerSession }: { playerSession: PlayerSession }) => {
			// OPTIMIZED: Only update specific session, not all sessions
			if (playerSession) {
				queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
			}
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
		});

		socket.on("session:updated", ({ playerSession, dashboardStats }: SessionPayload) => {
			// OPTIMIZED: Only update specific session, not all sessions
			if (playerSession) {
				queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
			}
			
			// OPTIMIZED: Use setQueryData for dashboard if partial data provided
			if (dashboardStats) {
				queryClient.setQueryData(["dashboardStats"], dashboardStats);
			} else {
				queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
			}
			
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
		});

		// Eventos de transacciones - OPTIMIZED
		socket.on("transaction:created", ({ transaction, dashboardStats }: TransactionPayload) => {
			void transaction;
			// Update transaction history
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			queryClient.invalidateQueries({ queryKey: ["checkinHistory"] });
			
			// OPTIMIZED: Use setQueryData for dashboard if partial data provided
			if (dashboardStats) {
				queryClient.setQueryData(["dashboardStats"], dashboardStats);
			} else {
				queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
			}
		});

		// Eventos de carrito
		socket.on("cart:updated", () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			queryClient.invalidateQueries({ queryKey: ["playerSession"] });
		});

		// Cleanup
		return () => {
			socket.disconnect();
		};
	}, [queryClient]);
}
