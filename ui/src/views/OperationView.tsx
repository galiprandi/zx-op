import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/MobileLayout";
import { QRScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ActionTone = "primary" | "success" | "warning";

interface SessionData {
	id: string;
	status: "IDLE" | "ACTIVE" | "PAUSED" | "ENDED";
	purchasedMinutes: number;
	remainingMinutes: number;
	remainingSeconds: number;
	wristband: {
		id: string;
		qrCode: string;
	};
}

// API functions
const api = {
	getActiveSession: async (qrCode: string): Promise<SessionData> => {
		const response = await fetch(`http://localhost:3001/api/sessions/active/${qrCode}`);
		if (!response.ok) throw new Error("Failed to fetch session");
		return response.json();
	},
	startSession: async (id: string) => {
		const response = await fetch(`http://localhost:3001/api/sessions/${id}/start`, {
			method: "PUT",
		});
		if (!response.ok) throw new Error("Failed to start session");
		return response.json();
	},
	pauseSession: async (id: string) => {
		const response = await fetch(`http://localhost:3001/api/sessions/${id}/pause`, {
			method: "PUT",
		});
		if (!response.ok) throw new Error("Failed to pause session");
		return response.json();
	},
};

export function OperationView() {
	const [wristbandCode, setWristbandCode] = useState("");
	const [inputValue, setInputValue] = useState("");

	useSocket(); // Initialize socket connection for real-time updates

	const queryClient = useQueryClient();

	const {
		data: sessionData,
		isLoading,
		error,
	} = useQuery<SessionData, Error>({
		queryKey: ["session", wristbandCode],
		queryFn: () => api.getActiveSession(wristbandCode),
		enabled: !!wristbandCode,
		retry: 1,
	});

	const startMutation = useMutation({
		mutationFn: api.startSession,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session", wristbandCode] });
		},
	});

	const pauseMutation = useMutation({
		mutationFn: api.pauseSession,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session", wristbandCode] });
		},
	});

	// Placeholder data until API integration arrives
	const mockSession: Partial<SessionData> & { totalMinutes: number } = {
		status: "ACTIVE",
		remainingMinutes: 12,
		remainingSeconds: 45,
		totalMinutes: 20,
	};

	// Use API data or fallback to mock for now
	const currentSession = sessionData || mockSession;

	const remainingSeconds =
		(currentSession.remainingMinutes || 0) * 60 + (currentSession.remainingSeconds || 0);
	const totalSeconds = sessionData ? sessionData.purchasedMinutes * 60 : mockSession.totalMinutes * 60;
	const progressValue = Math.min(100, (remainingSeconds / totalSeconds) * 100);

	const getTimeColor = (minutes: number) => {
		if (minutes > 5) return "text-green-500";
		if (minutes >= 0) return "text-yellow-500";
		return "text-red-500";
	};

	const getActionButton = () => {
		const status = sessionData?.status || "IDLE";
		if (status === "ACTIVE") {
			return { text: "⏸️ PAUSAR", tone: "warning" as ActionTone };
		}
		if (status === "PAUSED") {
			return { text: "▶️ REANUDAR", tone: "success" as ActionTone };
		}
		return { text: "🎯 INGRESAR", tone: "primary" as ActionTone };
	};

	const actionButton = getActionButton();

	const actionToneClass: Record<ActionTone, string> = {
		primary: "bg-blue-600 hover:bg-blue-700 text-white",
		success: "bg-green-600 hover:bg-green-700 text-white",
		warning: "bg-yellow-500 hover:bg-yellow-600 text-black",
	};

	const handlePrimaryAction = () => {
		if (!wristbandCode || !sessionData) return;
		if (sessionData.status === "ACTIVE") {
			pauseMutation.mutate(sessionData.id);
		} else {
			startMutation.mutate(sessionData.id);
		}
	};

	const handleReset = () => {
		setWristbandCode("");
		setInputValue("");
		queryClient.invalidateQueries({ queryKey: ["session", wristbandCode] });
	};

	return (
		<MobileLayout
			footer={
				<div className="flex flex-col gap-2">
					<Button
						type="button"
						size="lg"
						disabled={!wristbandCode || !sessionData || startMutation.isPending || pauseMutation.isPending}
						onClick={handlePrimaryAction}
						className={`h-16 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed ${actionToneClass[actionButton.tone]}`}
					>
						{startMutation.isPending || pauseMutation.isPending ? "Procesando..." : actionButton.text}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="lg"
						disabled={!wristbandCode}
						onClick={handleReset}
						className="h-12 text-lg font-bold"
					>
						🔄 Nueva Búsqueda
					</Button>
				</div>
			}
		>
			<div className="p-4 space-y-6">
				<div className="text-center space-y-1">
					<p className="text-xs uppercase tracking-[0.3em] text-blue-600">
						Zona Xtreme
					</p>
					<h2 className="text-2xl font-bold">Operación</h2>
					<p className="text-sm text-muted-foreground">
						Control de ingreso y monitoreo de pulseras
					</p>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-muted-foreground">
							Escanear pulsera
						</span>
						{wristbandCode && (
							<span className="text-xs font-semibold uppercase text-blue-600">
								Código listo
							</span>
						)}
					</div>
					<QRScanner
						value={inputValue}
						onChange={setInputValue}
						onSubmit={() => setWristbandCode(inputValue)}
						placeholder="Código de pulsera"
						className="text-lg pr-16 h-14"
					/>
					<p className="text-xs text-muted-foreground">
						Escanea o ingresa manualmente usando el botón del escáner
					</p>
				</div>

				{wristbandCode ? (
					<div className="space-y-4">
						<Card className={!sessionData ? "border-0 bg-transparent" : ""}>
							{sessionData && (
								<CardHeader>
									<CardTitle>Estado de Sesión</CardTitle>
									<CardDescription>
										Tiempo restante y estado actual
									</CardDescription>
								</CardHeader>
							)}
							<CardContent className="space-y-4">
								{isLoading ? (
									<div className="text-center">
										<p>Cargando sesión...</p>
									</div>
								) : error ? (
									<div className="text-center text-red-500">
										<p>Error al cargar la sesión</p>
										<p className="text-sm">{(error as Error).message}</p>
									</div>
								) : sessionData ? (
									<>
										<div className="text-center">
											<div
												className={`text-6xl font-bold font-mono ${getTimeColor(currentSession.remainingMinutes || 0)}`}
											>
												{String(currentSession.remainingMinutes || 0).padStart(2, "0")}:
												{String(currentSession.remainingSeconds || 0).padStart(2, "0")}
											</div>
											<div className="text-sm text-muted-foreground mt-2">
												Estado: <span className="font-medium">{sessionData?.status || "IDLE"}</span>
											</div>
										</div>

										<div className="grid grid-cols-3 gap-3 text-sm">
											<div className="flex flex-col items-center gap-1">
												<div className="w-3 h-3 bg-green-500 rounded-full" />
												<span>+5 min</span>
											</div>
											<div className="flex flex-col items-center gap-1">
												<div className="w-3 h-3 bg-yellow-500 rounded-full" />
												<span>-5 min</span>
											</div>
											<div className="flex flex-col items-center gap-1">
												<div className="w-3 h-3 bg-red-500 rounded-full" />
												<span>Excedido</span>
											</div>
										</div>
										<Progress value={progressValue} className="mt-4 h-3" />
									</>
								) : (
									<div className="text-center text-muted-foreground">
										<p>No encontrado</p>
									</div>
								)}
							</CardContent>
						</Card>

						{sessionData && (
							<div className="grid gap-3 sm:grid-cols-2">
								<Card className="border-green-100 bg-green-50/70">
									<CardContent className="space-y-2 p-4">
										<p className="text-xs font-semibold text-green-700">
											Próxima ventana
										</p>
										<p className="text-3xl font-bold text-green-800">
											{(currentSession.remainingMinutes || 0) > 5 ? "+5" : "-5"} min
										</p>
										<p className="text-sm text-green-700/80">
											Actualiza el semáforo según prioridad
										</p>
									</CardContent>
								</Card>
								<Card className="border-amber-100 bg-amber-50/70">
									<CardContent className="space-y-2 p-4">
										<p className="text-xs font-semibold text-amber-800">
											Salida automática
										</p>
										<p className="text-3xl font-bold text-amber-900">5 min</p>
										<p className="text-sm text-amber-900/80">
											Liberación automática al expirar el crédito
										</p>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				) : (
					<Card className="border-dashed">
						<CardContent className="py-8 text-center text-muted-foreground">
							Escanea una pulsera para ver su estado en tiempo real.
						</CardContent>
					</Card>
				)}
			</div>
		</MobileLayout>
	);
}
