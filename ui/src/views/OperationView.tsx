import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/MobileLayout";
import { QRScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWristband } from "@/hooks/useWristbands";
import { pauseSession } from "../api/operation";

export function OperationView() {
	const [wristbandCode, setWristbandCode] = useState("");
	const [inputValue, setInputValue] = useState("");
	const [now, setNow] = useState(() => Date.now());

	const queryClient = useQueryClient();

	const { wristband, isLoading, error } = useWristband(wristbandCode);

	const pauseMutation = useMutation({
		mutationFn: pauseSession,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session", wristbandCode] });
		},
	});

	const expirationTimestamp = wristband?.startTime
		? new Date(wristband.startTime).getTime() + (wristband.purchasedMinutes || 0) * 60 * 1000
		: null;
	const isTimerRunning = wristband?.status === "ACTIVE" && expirationTimestamp !== null;

	useEffect(() => {
		if (!isTimerRunning) return;
		const interval = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(interval);
	}, [isTimerRunning]);

	const remainingMs = expirationTimestamp ? Math.max(expirationTimestamp - now, 0) : 0;
	const minutes = Math.floor(remainingMs / (60 * 1000));
	const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

	const handlePause = () => {
		if (!wristband || wristband.status !== "ACTIVE") return;
		pauseMutation.mutate(wristband.id);
	};

	return (
		<MobileLayout
			footer={
				<div className="flex gap-2">
					<Button
						type="button"
						size="lg"
						disabled={
							!wristbandCode ||
							!wristband ||
							!isTimerRunning ||
							pauseMutation.isPending
						}
						onClick={handlePause}
						className="h-16 bg-yellow-500 hover:bg-yellow-600 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{pauseMutation.isPending ? "Pausando..." : "Pausar"}
					</Button>
				</div>
			}
		>
			<div className="p-4 space-y-6">
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

				{wristbandCode && (
					<Card>
						<CardHeader>
							<CardTitle>Estado de Sesión</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{isLoading ? (
								<div className="text-center">
									<p>Cargando sesión...</p>
								</div>
							) : error ? (
								<Titles text="No es posible conectarse al servidor" type="error" />
							) : wristband ? (
								<div className="text-center space-y-3">
									<div className="text-6xl font-bold font-mono">
										{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
									</div>
									<p className="text-sm text-muted-foreground">
										Estado: <span className="font-medium">{wristband.status}</span>
									</p>
								</div>
							) : (
								<Titles text="No existe" type="error" />
							)}
						</CardContent>
						{wristband?.status !== "ACTIVE" && (
							<p className="text-xs text-muted-foreground">
								La sesión no está activa.
							</p>
						)}
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
