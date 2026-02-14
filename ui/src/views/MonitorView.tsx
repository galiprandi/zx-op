import { Play, Pause, AlertCircle, Users, Settings, DollarSign, BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesktopShell } from "@/components/DesktopShell";
import { StatCard } from "@/components/StatCard";
import { AnimatedSessionRow } from "@/components/AnimatedSessionRow";
import { GlassCard } from "@/components/GlassCard";
import { useSocket } from "@/hooks/useSocket";
import { useActiveSessions } from "@/hooks/usePlayerSession";
import { useDashboardStats, usePerformanceMetrics } from "@/hooks/useDashboardStats";
import { getSystemSettings, updateSystemSettings, type SystemSettings } from "@/api/system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function MonitorView() {
	useSocket(); // Initialize socket connection for real-time updates
	const queryClient = useQueryClient();
	const [isConfigOpen, setIsConfigOpen] = useState(false);
	const [localMax, setLocalMax] = useState<number | "">("");
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
	const [nowTs, setNowTs] = useState(() => Date.now());

	// Get real-time active sessions data
	const {
		activePlayingSessions,
		waitingSessions,
		pausedSessions,
		expiringSoonSessions,
		expiredSessions,
		totalPlaying,
		totalPaused,
		totalWaiting,
		error,
		refreshSessions
	} = useActiveSessions();

	// Get dashboard stats
	const { data: dashboardStats } = useDashboardStats();

	// Get performance metrics
	const { data: performanceMetrics } = usePerformanceMetrics();

	const { data: systemSettings } = useQuery<SystemSettings>({
		queryKey: ["systemSettings"],
		queryFn: getSystemSettings,
		staleTime: 1000 * 60,
	});

	useEffect(() => {
		const id = setInterval(() => setNowTs(Date.now()), 60000); // Update every 1 minute
		return () => clearInterval(id);
	}, []);

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
	const occupancyPercentage = maxOccupancy > 0 ? (totalPlaying / maxOccupancy) * 100 : 0;

	const formatSecondsShort = (seconds: number | null | undefined) => {
		if (seconds === null || seconds === undefined) return "--";
		const s = Math.max(0, Math.floor(seconds));
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
		const ss = (s % 60).toString().padStart(2, "0");
		return `${h}:${m}:${ss}`;
	};

	const formatDuration = (seconds: number | null | undefined) => {
		if (seconds === null || seconds === undefined) return "--";
		const s = Math.max(0, Math.floor(seconds));
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
		const ss = (s % 60).toString().padStart(2, "0");
		return `${h}:${m}:${ss}`;
	};

	
	const sortedActive = useMemo(() => {
		return [...activePlayingSessions].sort((a, b) => a.remainingSeconds - b.remainingSeconds);
	}, [activePlayingSessions]);

	const waitingWithElapsed = useMemo(() => {
		return waitingSessions.map((s) => {
			const createdAtMs = s.createdAt ? new Date(s.createdAt).getTime() : nowTs;
			const elapsedSec = Math.max(0, Math.floor((nowTs - createdAtMs) / 1000));
			return { ...s, waitingElapsed: elapsedSec };
		});
	}, [waitingSessions, nowTs]);

	const pausedWithElapsed = useMemo(() => {
		return pausedSessions.map((s) => {
			const updatedAtMs = s.updatedAt ? new Date(s.updatedAt).getTime() : nowTs;
			const elapsedSec = Math.max(0, Math.floor((nowTs - updatedAtMs) / 1000));
			return { ...s, pausedElapsed: elapsedSec };
		});
	}, [pausedSessions, nowTs]);

	const handleSave = () => {
		if (localMax === "") return;
		const parsed = Number(localMax);
		if (!Number.isFinite(parsed)) {
			setToast({ message: "Ingresa un número válido", type: "error" });
			return;
		}
		saveSettings({ maxOccupancy: parsed });
	};

	// Calculate waiting count from dashboard stats or fallback
	const waitingCount = totalWaiting;

	// Error state
	if (error) {
		return (
			<DesktopShell>
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="text-center">
						<AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
						<p className="text-xl text-destructive font-medium">Error de conexión</p>
						<p className="text-muted-foreground mt-2">No se pueden cargar las sesiones activas</p>
						<button 
							onClick={refreshSessions}
							className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
						>
							Reintentar
						</button>
					</div>
				</div>
			</DesktopShell>
		);
	}

	return (
		<DesktopShell>
			{toast && (
				<div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg text-sm text-white ${
					toast.type === "success" ? "bg-green-600" : "bg-destructive"
				}`}>
					{toast.message}
				</div>
			)}

			<div className="space-y-6">
				{/* Header */}
				<div className="text-center">
					<h2 className="text-3xl font-bold mb-2">Centro de Control</h2>
					<p className="text-muted-foreground">
						Monitoreo en tiempo real de la atracción
					</p>
				</div>

				{/* Stats Overview (right-to-left priority: Esperando, En Juego, En Pausa) */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<StatCard
						title="Esperando"
						value={waitingCount}
						icon={Users}
						description="Con check-in, sin activar"
						color="primary"
					/>

					<StatCard
						title="En Juego"
						value={totalPlaying}
						icon={Play}
						description="Sesiones activas"
						color="success"
						footer={
							<div className="space-y-2">
								<div className="flex items-center justify-between text-lg text-muted-foreground">
									<span className="text-sm">Ocupación</span>
									<span className="text-muted-foreground text-sm">
												({totalPlaying}/{maxOccupancy || 0}) {Math.round(occupancyPercentage)}%
											</span>
								</div>
								<div className="w-full h-2 rounded-full bg-border/40 overflow-hidden">
									<div
										className={`h-full transition-all duration-700 ease-out ${
											occupancyPercentage > 80
												? "bg-red-400"
												: occupancyPercentage > 60
													? "bg-yellow-400"
													: "bg-green-400"
										}`}
										style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
									/>
								</div>
							</div>
						}
					/>

					<StatCard
						title="En Pausa"
						value={totalPaused}
						icon={Pause}
						description="Sesiones pausadas"
						color="warning"
					/>
				</div>

				{/* Active Sessions Grid (Esperando, En Juego, En Pausa) */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Waiting to Enter - Never Started */}
					<GlassCard>
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
								<Users className="w-5 h-5 text-primary" />
								Esperando
							</h3>
							<p className="text-sm text-muted-foreground">
								Tiempo de espera trascurrido
							</p>
						</div>
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{waitingSessions.length === 0 ? (
								<div className="text-center py-8">
									<Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">Nadie esperando</p>
								</div>
							) : (
								waitingWithElapsed.slice(0, 10).map((session, index) => (
									<AnimatedSessionRow
										key={session.id}
										barcodeId={session.barcodeId}
										rightText={formatSecondsShort(session.waitingElapsed)}
										tone="yellow"
										className={index === 0 ? "animate-in slide-in-from-top-2 duration-300" : ""}
									/>
								))
							)}
						</div>
					</GlassCard>

					{/* In the Air - Active Playing Sessions */}
					<GlassCard>
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
								<Play className="w-5 h-5 text-green-400" />
								En Juego
							</h3>
							<p className="text-sm text-muted-foreground">
								Tiempo de juego restante
							</p>
						</div>
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{activePlayingSessions.length === 0 ? (
								<div className="text-center py-8">
									<Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">No hay sesiones en juego</p>
								</div>
							) : (
								sortedActive.slice(0, 10).map((session, index) => (
									<AnimatedSessionRow
										key={session.id}
										barcodeId={session.barcodeId}
										rightText={formatSecondsShort(session.remainingSeconds)}
										tone={session.remainingSeconds <= 60 ? "red" : session.remainingSeconds <= 300 ? "orange" : "green"}
										className={index === 0 ? "animate-in slide-in-from-top-2 duration-300" : ""}
									/>
								))
							)}
						</div>
					</GlassCard>

					{/* Preparing for Landing - Paused or Expiring */}
					<GlassCard>
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
								<Pause className="w-5 h-5 text-yellow-400" />
								En Pausa
							</h3>
							<p className="text-sm text-muted-foreground">
								Tiempo de pausa transcurrido
							</p>
						</div>
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{[...pausedSessions, ...expiringSoonSessions].length === 0 ? (
								<div className="text-center py-8">
									<Pause className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">No hay sesiones pausadas o expirando</p>
								</div>
							) : (
								<>
									{pausedWithElapsed.slice(0, 10).map((session, index) => (
										<AnimatedSessionRow
											key={`${session.id}-paused`}
											barcodeId={session.barcodeId}
											rightText={formatSecondsShort(session.pausedElapsed)}
											tone="orange"
											className={index === 0 ? "animate-in slide-in-from-top-2 duration-300" : ""}
										/>
									))}
									{expiringSoonSessions.slice(0, 10).map((session, index) => (
										<AnimatedSessionRow
											key={`${session.id}-expiring`}
											barcodeId={session.barcodeId}
											rightText={formatSecondsShort(session.remainingSeconds)}
											tone={session.remainingSeconds <= 60 ? "red" : session.remainingSeconds <= 300 ? "orange" : "green"}
											className={index === 0 ? "animate-in slide-in-from-top-2 duration-300" : ""}
										/>
									))}
								</>
							)}
						</div>
					</GlassCard>
				</div>

				{/* Secondary Metrics */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<GlassCard>
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
									<BarChart3 className="w-5 h-5 text-blue-400" />
									Métricas de Rendimiento
								</h3>
								<p className="text-sm text-muted-foreground">Estadísticas operativas del día · Se actualiza cada 1 min</p>
							</div>
						</div>

						<div className="mt-4">
							<div className="space-y-2">
								{performanceMetrics ? (
									<>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Tiempo espera promedio
											</span>
											<span className="text-base">
												{formatDuration(performanceMetrics.averageWaitTime)}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Tiempo juego promedio
											</span>
											<span className="text-base">
												{formatDuration(performanceMetrics.averagePlayTime)}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Juegos completados hoy
											</span>
											<span className="text-base">
												{performanceMetrics.totalCompletedSessions}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Ocupación promedio del día
											</span>
											<span className="text-base">
												{performanceMetrics.dailyOccupancyRate}%
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Máximo de jugadores simultáneos
											</span>
											<span className="text-base">
												{performanceMetrics.peakOccupancy}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Tiempo total de juego acumulado
											</span>
											<span className="text-base">
												{formatDuration(performanceMetrics.totalPlayTimeConsumed)}
											</span>
										</div>
									</>
								) : (
									<p className="text-muted-foreground text-sm">Cargando métricas...</p>
								)}
							</div>
						</div>
					</GlassCard>

					<GlassCard>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
									<DollarSign className="w-5 h-5 text-green-400" />
									Ventas del día
								</h3>
								<p className="text-sm text-muted-foreground">Total facturado hoy</p>
							</div>
							<span className="text-lg font-bold text-green-400 whitespace-nowrap">
								{new Intl.NumberFormat("es-CL", {
									style: "currency",
									currency: "CLP",
								}).format(dashboardStats?.todayRevenue || 0)}
							</span>
						</div>

						<div className="mt-4">
							<div className="space-y-2">
								{dashboardStats?.topProducts?.length ? (
									dashboardStats.topProducts.map((product) => (
										<div
											key={product.productId}
											className="flex items-center justify-between"
										>
											<span className="text-sm font-medium text-foreground truncate">
												{product.name}
											</span>
											<div className="flex items-center gap-4">
												<span className="text-base text-muted-foreground">
													{product.totalQuantity} un
												</span>
												<span className="text-base font-bold whitespace-nowrap">
													{new Intl.NumberFormat("es-CL", {
														style: "currency",
														currency: "CLP",
													}).format(product.totalRevenue)}
												</span>
											</div>
										</div>
									))
								) : (
									<p className="text-muted-foreground text-sm">Sin ventas hoy</p>
								)}
							</div>
						</div>
					</GlassCard>
				</div>

				{/* Expired Sessions Alert */}
				{expiredSessions.length > 0 && (
					<GlassCard className="border-destructive/30">
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
								<AlertCircle className="w-5 h-5" />
								Tiempo Agotado
							</h3>
							<p className="text-sm text-muted-foreground">
								Sesiones que necesitan más tiempo
							</p>
						</div>
						<div className="space-y-2">
							{expiredSessions.map((session) => (
								<div key={session.id} className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
									<span className="font-mono text-lg font-medium text-destructive">
										{session.barcodeId}
									</span>
									<div className="flex items-center gap-2">
										<AlertCircle className="w-4 h-4 text-destructive" />
										<span className="font-mono text-lg font-bold text-destructive">
											00:00
										</span>
									</div>
								</div>
							))}
						</div>
					</GlassCard>
				)}

					{/* Footer status */}
				<div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
					<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
					<span>Sistema en línea · Actualización cada 3 segundos</span>
				</div>
			</div>

			{/* Configuration Modal */}
			{isConfigOpen && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center px-4">
					<GlassCard className="w-full max-w-sm">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold">Capacidad máxima</h3>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setIsConfigOpen(false)}
								className="h-8 w-8 p-0"
							>
								×
							</Button>
						</div>
						<p className="text-sm text-muted-foreground mb-4">
							Define la cantidad máxima de jugadores en juego.
						</p>
						<label className="text-sm text-foreground mb-2 block" htmlFor="maxOccupancy">
							Número de jugadores
						</label>
						<Input
							id="maxOccupancy"
							type="number"
							value={localMax}
							onChange={(e) => setLocalMax(e.target.value === "" ? "" : Number(e.target.value))}
							className="w-full"
						/>
						<div className="flex justify-end gap-2 mt-6">
							<Button
								onClick={() => setIsConfigOpen(false)}
								variant="outline"
							>
								Cancelar
							</Button>
							<Button
								onClick={handleSave}
								disabled={saving}
							>
								{saving ? "Guardando..." : "Guardar"}
							</Button>
						</div>
					</GlassCard>
				</div>
			)}

			{/* Settings Button */}
			<Button
				onClick={() => setIsConfigOpen(true)}
				className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-30"
				size="icon"
			>
				<Settings className="w-5 h-5" />
			</Button>
		</DesktopShell>
	);
}


