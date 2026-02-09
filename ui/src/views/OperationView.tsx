import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OperationView() {
	const [wristbandCode, setWristbandCode] = useState("");
	const [useScanner, setUseScanner] = useState(false); // Default to manual input
	const [sessionStatus, setSessionStatus] = useState<
		"IDLE" | "ACTIVE" | "PAUSED" | "ENDED"
	>("IDLE");
	const [remainingTime, setRemainingTime] = useState({
		minutes: 0,
		seconds: 0,
	});

	// Mock data - replace with real API call
	const mockSession = {
		status: "ACTIVE" as const,
		remainingMinutes: 12,
		remainingSeconds: 45,
	};

	const getTimeColor = (minutes: number) => {
		if (minutes > 5) return "text-green-500";
		if (minutes >= 0) return "text-yellow-500";
		return "text-red-500";
	};

	const getActionButton = () => {
		if (sessionStatus === "ACTIVE") {
			return { text: "⏸️ PAUSAR", variant: "secondary" as const };
		}
		if (sessionStatus === "PAUSED") {
			return { text: "▶️ REANUDAR", variant: "default" as const };
		}
		return { text: "🎯 INGRESAR", variant: "default" as const };
	};

	const actionButton = getActionButton();

	return (
		<MobileLayout>
			<div className="p-4 space-y-6">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-2">Operación</h2>
					<p className="text-muted-foreground">
						Control de ingreso y monitoreo de pulseras
					</p>
				</div>

				{/* Input Mode Toggle */}
				<Card>
					<CardHeader>
						<CardTitle>Modo de Ingreso</CardTitle>
						<CardDescription>
							Selecciona cómo ingresar el código de pulsera
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex gap-4">
							<Button
								variant={!useScanner ? "default" : "outline"}
								onClick={() => setUseScanner(false)}
								className="flex-1 h-14"
							>
								⌨️ Manual (ahorra batería)
							</Button>
							<Button
								variant={useScanner ? "default" : "outline"}
								onClick={() => setUseScanner(true)}
								className="flex-1 h-14"
							>
								📷 Escáner
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Wristband Input */}
				<Card>
					<CardHeader>
						<CardTitle>{useScanner ? "Escáner" : "Ingreso Manual"}</CardTitle>
						<CardDescription>
							{useScanner
								? "Apunta la cámara al código QR"
								: "Ingresa el código de pulsera manualmente"}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{!useScanner ? (
							<div className="space-y-2">
								<Label htmlFor="wristband">Código de Pulsera</Label>
								<Input
									id="wristband"
									placeholder="Ingrese código (formato grande)"
									value={wristbandCode}
									onChange={(e) => setWristbandCode(e.target.value)}
									className="text-2xl h-16 text-center font-mono"
								/>
							</div>
						) : (
							<div className="bg-muted rounded-lg h-64 flex items-center justify-center">
								<div className="text-center text-muted-foreground">
									<div className="text-4xl mb-2">📷</div>
									<div>Escáner próximamente</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Session Status */}
				{wristbandCode && (
					<Card>
						<CardHeader>
							<CardTitle>Estado de Sesión</CardTitle>
							<CardDescription>Tiempo restante y estado actual</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="text-center">
								<div
									className={`text-6xl font-bold font-mono ${getTimeColor(mockSession.remainingMinutes)}`}
								>
									{String(mockSession.remainingMinutes).padStart(2, "0")}:
									{String(mockSession.remainingSeconds).padStart(2, "0")}
								</div>
								<div className="text-sm text-muted-foreground mt-2">
									Estado:{" "}
									<span className="font-medium">{mockSession.status}</span>
								</div>
							</div>

							{/* Color Legend */}
							<div className="flex justify-center gap-6 text-sm">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-green-500 rounded-full"></div>
									<span>+5 min</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
									<span>-5 min</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-red-500 rounded-full"></div>
									<span>Excedido</span>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Action Buttons */}
				{wristbandCode && (
					<div className="flex gap-4">
						<Button
							variant={actionButton.variant}
							size="lg"
							className="flex-1 h-16 text-lg"
						>
							{actionButton.text}
						</Button>
						<Button
							variant="outline"
							size="lg"
							className="flex-1 h-16 text-lg"
							onClick={() => {
								setWristbandCode("");
								setSessionStatus("IDLE");
							}}
						>
							🔄 Nueva Búsqueda
						</Button>
					</div>
				)}
			</div>
		</MobileLayout>
	);
}
