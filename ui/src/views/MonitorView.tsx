import { Play, Pause, AlertCircle, Users, Clock, TrendingUp, Settings, DollarSign } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesktopShell } from "@/components/DesktopShell";
import { StatCard } from "@/components/StatCard";
import { SessionRow } from "@/components/SessionRow";
import { GlassCard } from "@/components/GlassCard";
import { RevealValue } from "@/components/RevealValue";
import { useSocket } from "@/hooks/useSocket";
import { useActiveSessions } from "@/hooks/usePlayerSession";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { getSystemSettings, updateSystemSettings, type SystemSettings } from "@/api/system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function MonitorView() {
	useSocket(); // Initialize socket connection for real-time updates
	const queryClient = useQueryClient();
	const [isConfigOpen, setIsConfigOpen] = useState(false);
	const [localMax, setLocalMax] = useState<number | "">("");
	const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

	// Get real-time active sessions data
	const {
		activePlayingSessions,
		pausedSessions,
		expiringSoonSessions,
		expiredSessions,
		totalPlaying,
		totalPaused,
		error,
		refreshSessions
	} = useActiveSessions();

	// Get dashboard stats
	const { data: dashboardStats } = useDashboardStats();

	const { data: systemSettings } = useQuery<SystemSettings>({
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

	// Calculate waiting count from dashboard stats or fallback
	const waitingCount = dashboardStats?.waitingCount ?? 0;

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
					<div className="flex items-center justify-center gap-2 mt-4">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
						<span className="text-sm text-muted-foreground">
							Sistema en línea · Actualización cada 3 segundos
						</span>
					</div>
				</div>

				{/* Stats Overview */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<StatCard
						title="En Juego"
						value={totalPlaying}
						icon={Play}
						description="Sesiones activas"
						color="success"
					/>

					<StatCard
						title="En Pausa"
						value={totalPaused}
						icon={Pause}
						description="Sesiones pausadas"
						color="warning"
					/>

					<StatCard
						title="Esperando"
						value={waitingCount}
						icon={Users}
						description="Con check-in, sin activar"
						color="primary"
					/>

					<StatCard
						title="Ocupación"
						value={`${Math.round(occupancyPercentage)}%`}
						icon={TrendingUp}
						description={`En juego: ${totalPlaying} / Capacidad: ${maxOccupancy || "-"}`}
						color={occupancyPercentage > 80 ? "danger" : occupancyPercentage > 60 ? "warning" : "success"}
					/>
				</div>

				{/* Secondary Metrics */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<GlassCard>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
									<DollarSign className="w-5 h-5 text-green-400" />
									Ventas del día
								</h3>
								<p className="text-sm text-muted-foreground">Total facturado hoy</p>
							</div>
							<RevealValue
								value={dashboardStats?.todayRevenue || 0}
								format="currency"
								size="lg"
							/>
						</div>
					</GlassCard>

					<GlassCard>
						<div>
							<h3 className="text-lg font-semibold text-foreground mb-3">
								Top 4 Productos (por cantidad)
							</h3>
							<div className="space-y-2">
								{dashboardStats?.topProducts?.length ? (
									dashboardStats.topProducts.map((product, index) => (
										<div key={product.productId} className="flex items-center justify-between p-2 bg-card/30 rounded">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-muted-foreground w-4">
													{index + 1}
												</span>
												<div>
													<div className="font-medium text-foreground text-sm">
														{product.name}
													</div>
													<div className="text-xs text-muted-foreground">
														{product.category}
													</div>
												</div>
											</div>
											<span className="text-sm font-bold text-primary">
												{product.totalQuantity} vendidos
											</span>
										</div>
									))
								) : (
									<p className="text-muted-foreground text-sm">Sin ventas hoy</p>
								)}
							</div>
						</div>
					</GlassCard>
				</div>

				{/* Active Sessions Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* In the Air - Active Playing Sessions */}
					<GlassCard>
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
								<Users className="w-5 h-5 text-green-400" />
								En Juego
							</h3>
							<p className="text-sm text-muted-foreground">
								Sesiones activas consumiendo tiempo
							</p>
						</div>
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{activePlayingSessions.length === 0 ? (
								<div className="text-center py-8">
									<Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">No hay sesiones en juego</p>
								</div>
							) : (
								activePlayingSessions.map((session) => (
									<SessionRow
										key={session.id}
										barcodeId={session.barcodeId}
										remainingSeconds={session.remainingSeconds}
										isActive={session.isActive}
										progress={Math.round((session.totalAllowedSeconds - session.remainingSeconds) / session.totalAllowedSeconds * 100)}
									/>
								))
							)}
						</div>
					</GlassCard>

					{/* Preparing for Landing - Paused or Expiring */}
					<GlassCard>
						<div className="mb-4">
							<h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
								<Clock className="w-5 h-5 text-yellow-400" />
								En Pausa
							</h3>
							<p className="text-sm text-muted-foreground">
								Sesiones pausadas o con tiempo bajo
							</p>
						</div>
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{[...pausedSessions, ...expiringSoonSessions].length === 0 ? (
								<div className="text-center py-8">
									<Pause className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">No hay sesiones pausadas o expirando</p>
								</div>
							) : (
								[...pausedSessions, ...expiringSoonSessions].map((session) => (
									<SessionRow
										key={session.id}
										barcodeId={session.barcodeId}
										remainingSeconds={session.remainingSeconds}
										isActive={session.isActive}
										progress={Math.round((session.totalAllowedSeconds - session.remainingSeconds) / session.totalAllowedSeconds * 100)}
									/>
								))
							)}
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

				{/* Color Legend */}
				<GlassCard>
					<div className="mb-4">
						<h3 className="text-lg font-semibold text-foreground">Leyenda de Estados</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="flex items-center gap-3">
							<div className="w-4 h-4 bg-green-500 rounded-full"></div>
							<div>
								<div className="font-medium text-foreground">Verde</div>
								<div className="text-sm text-muted-foreground">+5 minutos</div>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
							<div>
								<div className="font-medium text-foreground">Amarillo</div>
								<div className="text-sm text-muted-foreground">1-5 minutos</div>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-4 h-4 bg-orange-500 rounded-full"></div>
							<div>
								<div className="font-medium text-foreground">Naranja</div>
								<div className="text-sm text-muted-foreground">Expirando</div>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="w-4 h-4 bg-red-500 rounded-full"></div>
							<div>
								<div className="font-medium text-foreground">Rojo</div>
								<div className="text-sm text-muted-foreground">Tiempo agotado</div>
							</div>
						</div>
					</div>
				</GlassCard>
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
