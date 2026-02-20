import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Product, Transaction } from "@shared/types";
import type { SessionStatusResponse } from "@/api/playerSession";
import { io } from "socket.io-client";

interface SessionPayload {
	playerSession: SessionStatusResponse;
	activeSessions?: SessionStatusResponse[];
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
		const socket = io("/", {
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

		socket.on("session:play", ({ playerSession }: SessionPayload) => {
			// OPTIMIZED: Only update specific session, not all sessions
			if (playerSession) {
				queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
			}
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
			queryClient.invalidateQueries({ queryKey: ["reportsSummary"] });
			queryClient.invalidateQueries({ queryKey: ["reportsDays"] });
			queryClient.invalidateQueries({ queryKey: ["reportsDayDetail"] });
		});

		socket.on("session:pause", ({ playerSession }: SessionPayload) => {
			// OPTIMIZED: Only update specific session, not all sessions
			if (playerSession) {
				queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
			}
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
			queryClient.invalidateQueries({ queryKey: ["reportsSummary"] });
			queryClient.invalidateQueries({ queryKey: ["reportsDays"] });
			queryClient.invalidateQueries({ queryKey: ["reportsDayDetail"] });
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
			queryClient.invalidateQueries({ queryKey: ["reportsSummary"] });
			queryClient.invalidateQueries({ queryKey: ["reportsDays"] });
			queryClient.invalidateQueries({ queryKey: ["reportsDayDetail"] });
		});

		socket.on("session:lap", ({ playerSession }: SessionPayload) => {
			if (playerSession) {
				queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
			}
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
			queryClient.invalidateQueries({ queryKey: ["performanceMetrics"] });
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
			queryClient.invalidateQueries({ queryKey: ["reportsSummary"] });
			queryClient.invalidateQueries({ queryKey: ["reportsDays"] });
			queryClient.invalidateQueries({ queryKey: ["reportsDayDetail"] });
		});

		// Eventos de carrito
		socket.on("cart:updated", () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			queryClient.invalidateQueries({ queryKey: ["playerSession"] });
		});

		socket.on("system:settings-updated", () => {
			queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
			queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
			queryClient.invalidateQueries({ queryKey: ["performanceMetrics"] });
		});

		// Cleanup
		return () => {
			socket.disconnect();
		};
	}, [queryClient]);
}
