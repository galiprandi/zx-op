import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { QRScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSocket } from "@/hooks/useSocket";
import { useWristbandSession } from "@/hooks/useWristbands";
import { pauseSession, startSession } from "../api/operation";

type ActionTone = "primary" | "success" | "warning";

export function OperationView() {
	const [wristbandCode, setWristbandCode] = useState("");
	const [inputValue, setInputValue] = useState("");

	useSocket(); // Initialize socket connection for real-time updates

	const queryClient = useQueryClient();

	const { wristband, isLoading, error } = useWristbandSession(wristbandCode);

	const startMutation = useMutation({
		mutationFn: startSession,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session", wristbandCode] });
		},
	});

	const pauseMutation = useMutation({
		mutationFn: pauseSession,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session", wristbandCode] });
		},
	});

	// Use API data

	const getTimeColor = (minutes: number) => {
		if (minutes > 5) return "text-green-500";
		if (minutes >= 0) return "text-yellow-500";
		return "text-red-500";
	};

	const getActionButton = () => {
		const status = wristband?.status || "IDLE";
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
		if (!wristbandCode || !wristband) return;
		if (wristband.status === "ACTIVE") {
			pauseMutation.mutate(wristband.id);
		} else {
			startMutation.mutate(wristband.id);
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
						disabled={
							!wristbandCode ||
							!wristband ||
							startMutation.isPending ||
							pauseMutation.isPending
						}
						onClick={handlePrimaryAction}
						className={`h-16 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed ${actionToneClass[actionButton.tone]}`}
					>
						{startMutation.isPending || pauseMutation.isPending
							? "Procesando..."
							: actionButton.text}
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
						<Card className={!wristband ? "border-0 bg-transparent" : ""}>
							{wristband && (
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
									<Titles
										text="No es posible conectarse al servidor"
										type="error"
									/>
								) : wristband ? (
									<>
										{(() => {
											const remainingSeconds =
												(wristband.remainingMinutes || 0) * 60 +
												(wristband.remainingSeconds || 0);
											const totalSeconds = wristband.purchasedMinutes * 60;
											const progressValue = Math.min(
												100,
												(remainingSeconds / totalSeconds) * 100,
											);
											return (
												<>
													<div className="text-center">
														<div
															className={`text-6xl font-bold font-mono ${getTimeColor(wristband.remainingMinutes || 0)}`}
														>
															{String(wristband.remainingMinutes || 0).padStart(
																2,
																"0",
															)}
															:
															{String(wristband.remainingSeconds || 0).padStart(
																2,
																"0",
															)}
														</div>
														<div className="text-sm text-muted-foreground mt-2">
															Estado:{" "}
															<span className="font-medium">
																{wristband.status || "IDLE"}
															</span>
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
													<Progress
														value={progressValue}
														className="mt-4 h-3"
													/>
												</>
											);
										})()}
									</>
								) : (
									<Titles text="No existe" type="error" />
								)}
							</CardContent>
						</Card>

						{wristband && (
							<div className="grid gap-3 sm:grid-cols-2">
								<Card className="border-green-100 bg-green-50/70">
									<CardContent className="space-y-2 p-4">
										<p className="text-xs font-semibold text-green-700">
											Próxima ventana
										</p>
										<p className="text-3xl font-bold text-green-800">
											{(wristband.remainingMinutes || 0) > 5 ? "+5" : "-5"} min
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

const Titles = ({
	text,
	type,
}: {
	text: string;
	type?: "warning" | "info" | "error";
}) => {
	return (
		<div>
			<h1
				className={
					type === "warning"
						? "text-red-500"
						: type === "error"
							? "text-red-500"
							: "text-blue-500"
				}
			>
				{text}
			</h1>
		</div>
	);
};
