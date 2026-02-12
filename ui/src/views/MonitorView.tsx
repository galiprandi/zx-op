import { MonitorLayout } from "@/components/MonitorLayout";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	Play,
	Pause,
	AlertCircle,
	Users,
	Clock,
	TrendingUp,
	Settings,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useActiveSessions } from "@/hooks/usePlayerSession";
import { getSessionColor, getSessionProgress } from "@/api/playerSession";
import { getSystemSettings, updateSystemSettings, type SystemSettings } from "@/api/system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface ActiveSession {
	id: string;
	barcodeId: string;
	remainingSeconds: number;
	remainingMinutes: number;
	totalAllowedSeconds: number;
	accumulatedSeconds: number;
	lastStartAt: string | null;
	isActive: boolean;
	expiresAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export function MonitorView() {
	useSocket(); // Initialize socket connection for real-time updates
	const queryClient = useQueryClient();
	const [isConfigOpen, setIsConfigOpen] = useState(false);
	const [localMax, setLocalMax] = useState<number | "">("");
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(null), 3000);
		return () => clearTimeout(timer);
	}, [toast]);

	// Get real-time active sessions data
	const {
		activePlayingSessions,
		pausedSessions,
		expiringSoonSessions,
		expiredSessions,
		totalActive,
		totalPlaying,
		totalPaused,
		totalExpiringSoon,
		isLoading,
		error,
		refreshSessions
	} = useActiveSessions();

	const { data: systemSettings, isLoading: loadingSettings } = useQuery<SystemSettings>({
		queryKey: ["systemSettings"],
		queryFn: getSystemSettings,
		staleTime: 1000 * 60,
	});

	if (systemSettings && localMax === "") {
		setLocalMax(systemSettings.maxOccupancy);
	}

	const { mutate: saveSettings, isPending: saving } = useMutation({
		mutationFn: updateSystemSettings,
		onSuccess: (data) => {
			setToast({ message: "Capacidad actualizada", type: "success" });
			setIsConfigOpen(false);
			setLocalMax(data.maxOccupancy);
			queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
		},
		onError: () => {
			setToast({ message: "Error al guardar", type: "error" });
		},
	});

	const maxOccupancy = systemSettings?.maxOccupancy ?? 0;
	const occupancyPercentage = maxOccupancy > 0 ? Math.min(100, (totalPlaying / maxOccupancy) * 100) : 0;

	const handleSave = () => {
		if (localMax === "") return;
		const parsed = Number(localMax);
		if (!Number.isFinite(parsed)) {
			setToast({ message: "Ingresa un número válido", type: "error" });
			return;
		}
		saveSettings({ maxOccupancy: parsed });
	};

	// Helper functions for UI
	const getTimeColor = (remainingSeconds: number) => {
		const color = getSessionColor(remainingSeconds);
		switch (color) {
			case 'green': return 'text-green-500';
			case 'yellow': return 'text-yellow-500';
			case 'red': return 'text-red-500';
			default: return 'text-gray-500';
		}
	};

	const formatTimeDisplay = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const getProgressValue = (session: ActiveSession) => {
		return getSessionProgress(session);
	};

	// Loading state
	if (isLoading || loadingSettings) {
		return (
			<MonitorLayout>
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="text-center">
						<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
						<p className="text-xl text-gray-600">Cargando monitor...</p>
					</div>
				</div>
			</MonitorLayout>
		);
	}

	// Error state
	if (error) {
		return (
			<MonitorLayout>
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="text-center">
						<AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
						<p className="text-xl text-red-600 font-medium">Error de conexión</p>
						<p className="text-gray-600 mt-2">No se pueden cargar las sesiones activas</p>
						<button 
							onClick={refreshSessions}
							className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							Reintentar
						</button>
					</div>
				</div>
			</MonitorLayout>
		);
	}

	return (
		<MonitorLayout>
			{toast && (
				<div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg text-sm text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
					{toast.message}
				</div>
			)}
			<div className="space-y-6">
				{/* Header */}
				<div className="text-center">
					<h2 className="text-3xl font-bold mb-2">Monitor Público</h2>
					<p className="text-muted-foreground">
						Visualización en tiempo real de sesiones activas
					</p>
					<div className="flex items-center justify-center gap-2 mt-4">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
						<span className="text-sm text-gray-600">
							Actualización en tiempo real cada 3 segundos
						</span>
					</div>
				</div>

				{/* Stats Overview */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-lg flex items-center gap-2">
								<Play className="w-5 h-5 text-green-600" />
								En Juego
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-green-500">
								{totalPlaying}
							</div>
							<p className="text-xs text-gray-600 mt-1">
								Sesiones activas
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-lg flex items-center gap-2">
								<Pause className="w-5 h-5 text-yellow-600" />
								Pausados
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-yellow-500">
								{totalPaused}
							</div>
							<p className="text-xs text-gray-600 mt-1">
								Sesiones en pausa
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-lg flex items-center gap-2">
								<Clock className="w-5 h-5 text-orange-600" />
								Expirando
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-orange-500">
								{totalExpiringSoon}
							</div>
							<p className="text-xs text-gray-600 mt-1">
								Menos de 5 min
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-lg flex items-center gap-2">
								<TrendingUp className="w-5 h-5 text-blue-600" />
								Ocupación
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between gap-2 mb-2">
								<div>
									<div className="text-3xl font-bold text-blue-500">
										{Math.round(occupancyPercentage)}%
									</div>
									<p className="text-xs text-gray-600 mt-1">
										En juego: {totalPlaying} / Capacidad: {maxOccupancy || "-"}
									</p>
								</div>
								<button
									onClick={() => setIsConfigOpen(true)}
									className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
								>
									<Settings className="w-4 h-4" />
									Configurar
								</button>
							</div>
							<Progress value={occupancyPercentage} className="h-2" />
							<p className="text-xs text-gray-600 mt-1">
								Sesiones totales: {totalActive}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Active Sessions Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* In the Air - Active Playing Sessions */}
					<Card>
						<CardHeader>
							<CardTitle className="text-green-500 flex items-center gap-2">
								<Users className="w-5 h-5" />
								En el Aire
							</CardTitle>
							<CardDescription>
								Sesiones activas consumiendo tiempo
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{activePlayingSessions.length === 0 ? (
								<div className="text-center py-8">
									<Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-600">No hay sesiones en juego</p>
								</div>
							) : (
								activePlayingSessions.map((session) => (
									<div key={session.id} className="space-y-2">
										<div className="flex justify-between items-center">
											<span className="font-mono text-lg font-medium">
												{session.barcodeId}
											</span>
											<div className="flex items-center gap-2">
												<Play className="w-4 h-4 text-green-600" />
												<span
													className={`font-mono text-lg font-bold ${getTimeColor(session.remainingSeconds)}`}
												>
													{formatTimeDisplay(session.remainingSeconds)}
												</span>
											</div>
										</div>
										<Progress
											value={getProgressValue(session)}
											className="h-2"
										/>
										<div className="flex justify-between text-xs text-gray-500">
											<span>Progreso: {Math.round(getProgressValue(session))}%</span>
											<span>{session.remainingMinutes} min restantes</span>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>

					{/* Preparing for Landing - Paused or Expiring */}
					<Card>
						<CardHeader>
							<CardTitle className="text-yellow-500 flex items-center gap-2">
								<Clock className="w-5 h-5" />
								Preparando Aterrizaje
							</CardTitle>
							<CardDescription>
								Sesiones pausadas o con tiempo bajo
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{[...pausedSessions, ...expiringSoonSessions].length === 0 ? (
								<div className="text-center py-8">
									<Pause className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-600">No hay sesiones pausadas o expirando</p>
								</div>
							) : (
								[...pausedSessions, ...expiringSoonSessions].map((session) => (
									<div key={session.id} className="space-y-2">
										<div className="flex justify-between items-center">
											<span className="font-mono text-lg font-medium">
												{session.barcodeId}
											</span>
											<div className="flex items-center gap-2">
												{!session.isActive && (
													<span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
														<Pause className="w-3 h-3" />
														PAUSADO
													</span>
												)}
												{session.remainingSeconds <= 300 && session.isActive && (
													<span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
														EXPIRANDO
													</span>
												)}
												<span
													className={`font-mono text-lg font-bold ${getTimeColor(session.remainingSeconds)}`}
												>
													{formatTimeDisplay(session.remainingSeconds)}
												</span>
											</div>
										</div>
										<Progress
											value={getProgressValue(session)}
											className="h-2"
										/>
										<div className="flex justify-between text-xs text-gray-500">
											<span>Progreso: {Math.round(getProgressValue(session))}%</span>
											<span>{session.remainingMinutes} min restantes</span>
										</div>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>

				{/* Expired Sessions */}
				{expiredSessions.length > 0 && (
					<Card className="border-red-200">
						<CardHeader>
							<CardTitle className="text-red-500 flex items-center gap-2">
								<AlertCircle className="w-5 h-5" />
								Tiempo Agotado
							</CardTitle>
							<CardDescription>
								Sesiones que necesitan más tiempo
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{expiredSessions.map((session) => (
								<div key={session.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
									<span className="font-mono text-lg font-medium text-red-700">
										{session.barcodeId}
									</span>
									<div className="flex items-center gap-2">
										<AlertCircle className="w-4 h-4 text-red-600" />
										<span className="font-mono text-lg font-bold text-red-600">
											00:00
										</span>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				)}

				{/* Color Legend */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="w-5 h-5" />
							Leyenda de Estados
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="flex items-center gap-3">
								<div className="w-4 h-4 bg-green-500 rounded-full"></div>
								<div>
									<div className="font-medium">Verde</div>
									<div className="text-sm text-gray-600">+5 minutos</div>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
								<div>
									<div className="font-medium">Amarillo</div>
									<div className="text-sm text-gray-600">1-5 minutos</div>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-4 h-4 bg-orange-500 rounded-full"></div>
								<div>
									<div className="font-medium">Naranja</div>
									<div className="text-sm text-gray-600">Expirando</div>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="w-4 h-4 bg-red-500 rounded-full"></div>
								<div>
									<div className="font-medium">Rojo</div>
									<div className="text-sm text-gray-600">Tiempo agotado</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

			{isConfigOpen && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center px-4">
					<div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
						<button
							onClick={() => setIsConfigOpen(false)}
							className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
						>
							×
						</button>
						<h3 className="text-lg font-semibold mb-1">Capacidad máxima</h3>
						<p className="text-sm text-gray-600 mb-4">Define la cantidad máxima de jugadores en juego.</p>
						<label className="text-sm text-gray-700 mb-2 block" htmlFor="maxOccupancy">Número de jugadores</label>
						<input
							id="maxOccupancy"
							type="number"
							className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base bg-white text-gray-900"
							value={localMax}
							onChange={(e) => setLocalMax(e.target.value === "" ? "" : Number(e.target.value))}
						/>
						<div className="flex justify-end gap-2 mt-6">
							<button
								onClick={() => setIsConfigOpen(false)}
								className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
							>
								Cancelar
							</button>
							<button
								onClick={handleSave}
								disabled={saving}
								className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
							>
								{saving ? "Guardando..." : "Guardar"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
		</MonitorLayout>
	);
}
