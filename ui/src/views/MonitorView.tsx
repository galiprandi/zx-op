import { Play, Pause, AlertCircle, Users, DollarSign, BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DesktopShell } from "@/components/DesktopShell";
import { KPICard } from "@/components/KPICard";
import { AnimatedSessionRow } from "@/components/AnimatedSessionRow";
import { GlassCard } from "@/components/GlassCard";
import { MonitorTime } from "@/components/MonitorTime";
import { useSocket } from "@/hooks/useSocket";
import { useActiveSessions } from "@/hooks/usePlayerSession";
import { useDashboardStats, usePerformanceMetrics } from "@/hooks/useDashboardStats";
import { useSystemSettings } from "@/hooks/useSystemSettingsQuery";
import { formatCurrency } from "@/lib/currency";
import { sessionRowTone } from "@/lib/sessionVisual";
import { resolvePausedElapsedSeconds, resolveVisualState, resolveWaitingElapsedSeconds } from "@/lib/sessionTimeCalc";
import { getSyncedNowMs } from "@/lib/serverClock";

export function MonitorView() {
	useSocket(); // Initialize socket connection for real-time updates
	const [nowTs, setNowTs] = useState(() => getSyncedNowMs());

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

	const { settings: systemSettings } = useSystemSettings();

	useEffect(() => {
		const id = setInterval(() => setNowTs(getSyncedNowMs()), 1000);
		return () => clearInterval(id);
	}, []);

	// Debug logging for session conflicts
	useEffect(() => {
		const activeIds = new Set(activePlayingSessions.map(s => s.id));
		const pausedIds = new Set(pausedSessions.map(s => s.id));
		const conflicts = [...activeIds].filter(id => pausedIds.has(id));
		
		if (conflicts.length > 0) {
			console.warn("⚠️ Session conflicts detected:", conflicts);
			console.log("Active sessions:", activePlayingSessions.map(s => ({ id: s.id, barcodeId: s.barcodeId, isActive: s.isActive })));
			console.log("Paused sessions:", pausedSessions.map(s => ({ id: s.id, barcodeId: s.barcodeId, isActive: s.isActive })));
		}
	}, [activePlayingSessions, pausedSessions]);

	const maxOccupancy = systemSettings?.maxOccupancy ?? 0;
	const occupancyPercentage = maxOccupancy > 0 ? (totalPlaying / maxOccupancy) * 100 : 0;

	
	const sortedActive = useMemo(() => {
		return [...activePlayingSessions].sort((a, b) => a.remainingSeconds - b.remainingSeconds);
	}, [activePlayingSessions]);

	const waitingWithElapsed = useMemo(() => {
		return waitingSessions.map((s) => {
			const elapsedSec = resolveWaitingElapsedSeconds(s, nowTs, waitingSessions);
			return { ...s, waitingElapsed: elapsedSec };
		});
	}, [waitingSessions, nowTs]);

	// Remove any sessions that appear in both active and paused lists (data inconsistency fix)
	const activeSessionIds = new Set(activePlayingSessions.map(s => s.id));
	const pausedSessionsClean = pausedSessions.filter(session => !activeSessionIds.has(session.id));
	const pausedSessionIdsClean = new Set(pausedSessionsClean.map(s => s.id));
	const expiringSoonNotPaused = expiringSoonSessions.filter(session => !pausedSessionIdsClean.has(session.id));

	// Additional fix: Remove sessions with same barcodeId from paused lists (barcode conflicts)
	const activeBarcodes = new Set(activePlayingSessions.map(s => s.barcodeId));
	const pausedSessionsFinal = pausedSessionsClean.filter(session => !activeBarcodes.has(session.barcodeId));
	const expiringSoonFinal = expiringSoonNotPaused.filter(session => !activeBarcodes.has(session.barcodeId));

	const pausedWithElapsed = useMemo(() => {
		return pausedSessionsFinal.map((s) => {
			const elapsedSec = resolvePausedElapsedSeconds(s, nowTs);
			return { ...s, pausedElapsed: elapsedSec };
		});
	}, [pausedSessionsFinal, nowTs]);

	// Debug logging for cleaned arrays
	useEffect(() => {
		console.log("🔧 Cleaned paused sessions:", pausedSessionsClean.map(s => ({ id: s.id, barcodeId: s.barcodeId })));
		console.log("🔧 Expiring soon not paused:", expiringSoonNotPaused.map(s => ({ id: s.id, barcodeId: s.barcodeId })));
		console.log("🔧 Final paused sessions (barcode filtered):", pausedSessionsFinal.map(s => ({ id: s.id, barcodeId: s.barcodeId })));
		console.log("🔧 Final expiring sessions (barcode filtered):", expiringSoonFinal.map(s => ({ id: s.id, barcodeId: s.barcodeId })));
		console.log("🔧 Final combined array for 'En Pausa':", [...pausedSessionsFinal, ...expiringSoonFinal].map(s => ({ id: s.id, barcodeId: s.barcodeId })));
		console.log("🔧 Active sessions for 'En Juego':", activePlayingSessions.map(s => ({ id: s.id, barcodeId: s.barcodeId })));
		
		// Check for barcodeId conflicts (same barcode in both lists but different session IDs)
		const activeBarcodes = new Set(activePlayingSessions.map(s => s.barcodeId));
		const pausedBarcodes = new Set([...pausedSessionsFinal, ...expiringSoonFinal].map(s => s.barcodeId));
		const barcodeConflicts = [...activeBarcodes].filter(barcode => pausedBarcodes.has(barcode));
		
		if (barcodeConflicts.length > 0) {
			console.warn("🚨 Barcode conflicts STILL detected after filtering:", barcodeConflicts);
			barcodeConflicts.forEach(barcode => {
				const activeSession = activePlayingSessions.find(s => s.barcodeId === barcode);
				const pausedSession = [...pausedSessionsFinal, ...expiringSoonFinal].find(s => s.barcodeId === barcode);
				console.log(`Barcode ${barcode}: Active=${activeSession?.id}, Paused=${pausedSession?.id}`);
			});
		} else {
			console.log("✅ No barcode conflicts detected - filtering successful!");
		}
	}, [pausedSessionsFinal, expiringSoonFinal, activePlayingSessions, pausedSessionsClean, expiringSoonNotPaused]);

	// Calculate waiting count from dashboard stats or fallback
	const waitingCount = totalWaiting;

	const resolveCategoryLabel = (category: string) => {
		const normalized = category.toLowerCase();
		if (normalized === "time") return "Tiempo";
		if (normalized === "accessory" || normalized === "accessories") return "Accesorios";
		if (normalized === "required") return "Requeridos";
		return category.charAt(0).toUpperCase() + category.slice(1);
	};

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
			<div className="space-y-6">
				{/* Header */}
				<div className="text-center">
					<h2 className="text-3xl font-bold mb-2">Centro de Control</h2>
				</div>

				{/* Stats Overview (right-to-left priority: Esperando, En Juego, En Pausa) */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<KPICard
						title="Esperando"
						value={waitingCount}
						icon={Users}
						description="Con check-in, sin activar"
						color="primary"
					/>

					<KPICard
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

					<KPICard
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
										rightText={<MonitorTime seconds={session.waitingElapsed} state="stop" visualState="waiting" />}
										tone={sessionRowTone.waiting}
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
										rightText={
											<MonitorTime
												seconds={session.remainingSeconds}
												state="desc"
												visualState={resolveVisualState(session)}
											/>
										}
										tone={sessionRowTone[resolveVisualState(session)]}
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
								Tiempo de pausa transcurrido · Sesiones por expirar
							</p>
						</div>
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{[...pausedSessionsFinal, ...expiringSoonFinal].length === 0 ? (
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
											rightText={<MonitorTime seconds={session.pausedElapsed} state="stop" visualState="paused" />}
											tone={sessionRowTone.paused}
											className={index === 0 ? "animate-in slide-in-from-top-2 duration-300" : ""}
										/>
									))}
									{expiringSoonFinal.slice(0, 10).map((session, index) => (
										<AnimatedSessionRow
											key={`${session.id}-expiring`}
											barcodeId={session.barcodeId}
											rightText={<MonitorTime seconds={session.remainingSeconds} state="desc" visualState="expiring" />}
											tone={sessionRowTone.expiring}
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
								<p className="text-sm text-muted-foreground">Estadísticas de la jornada operativa · Actualiza por eventos y verificación cada 1 min</p>
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
												<MonitorTime seconds={performanceMetrics.averageWaitTime} state="stop" />
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Tiempo juego promedio
											</span>
											<span className="text-base">
												<MonitorTime seconds={performanceMetrics.averagePlayTime} state="stop" />
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Tiempo promedio por vuelta
											</span>
											<span className="text-base">
												{performanceMetrics.averageSecondsPerLap === null ? (
													"N/A"
												) : (
													<MonitorTime seconds={performanceMetrics.averageSecondsPerLap} state="stop" />
												)}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Juegos completados (jornada)
											</span>
											<span className="text-base">
												{performanceMetrics.totalCompletedSessions}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-foreground">
												Ocupación promedio (jornada)
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
												<MonitorTime seconds={performanceMetrics.totalPlayTimeConsumed} state="stop" />
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
									Ventas de la jornada
								</h3>
								<p className="text-sm text-muted-foreground">Total facturado en la jornada operativa</p>
							</div>
							<span className="text-lg font-bold text-green-400 whitespace-nowrap">
								{formatCurrency(dashboardStats?.todayRevenue || 0)}
							</span>
						</div>

						<div className="mt-4">
							<div className="space-y-2">
								{dashboardStats?.salesByCategory?.length ? (
									dashboardStats.salesByCategory.map((item) => (
										<div
											key={item.category}
											className="flex items-center justify-between"
										>
											<span className="text-sm font-medium text-foreground truncate">
												{resolveCategoryLabel(item.category)}
											</span>
											<div className="flex items-center gap-4">
												<span className="text-base text-muted-foreground">
													{item.totalQuantity} un
												</span>
												<span className="text-base font-bold whitespace-nowrap">
													{formatCurrency(item.totalRevenue)}
												</span>
											</div>
										</div>
									))
								) : (
									<p className="text-muted-foreground text-sm">Sin ventas en esta jornada</p>
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
					<span>Sistema en línea</span>
				</div>
			</div>

		</DesktopShell>
	);
}
