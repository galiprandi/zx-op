import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scan, AlertCircle, Pause, Play, Plus } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { QRScanner } from "@/components/QRScanner";
import { ActionButton } from "@/components/ActionButton";
import { SessionTime } from "@/components/SessionTime";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { GlassCard } from "@/components/GlassCard";
import { useActiveSessions, usePlayerSession } from "@/hooks/usePlayerSession";
import { getCheckinHistory } from "@/api/checkin";
import { formatTimeValue } from "@/api/products";
import { useSocket } from "@/hooks/useSocket";
import { resolveDisplaySeconds, resolveVisualState } from "@/lib/sessionTimeCalc";
import { getSyncedNowMs } from "@/lib/serverClock";

interface ProductSummaryItem {
	productId: string;
	name: string;
	quantity: number;
	isTimeProduct: boolean;
}

export function OperationView() {
	useSocket();

	const [barcodeId, setBarcodeId] = useState("");
	const [inputValue, setInputValue] = useState("");
	const [showConfirm, setShowConfirm] = useState(false);
	const [pendingAction, setPendingAction] = useState<'play' | 'pause' | null>(null);
	const [nowTs, setNowTs] = useState(() => getSyncedNowMs());

	useEffect(() => {
		const id = setInterval(() => setNowTs(getSyncedNowMs()), 1000);
		return () => clearInterval(id);
	}, []);

	// Get current session status for the scanned barcode
	const { 
		session, 
		isLoading: sessionLoading, 
		error: sessionError,
		canPlay,
		canPause,
		playMutation,
		pauseMutation,
		lapMutation
	} = usePlayerSession(barcodeId);
	const { waitingSessions } = useActiveSessions();

	const {
		data: checkinHistory = [],
		isLoading: historyLoading,
		error: historyError,
	} = useQuery({
		queryKey: ["checkinHistory", barcodeId],
		queryFn: () => getCheckinHistory(barcodeId, 100),
		enabled: Boolean(barcodeId && session),
		retry: 1,
	});

	const purchaseSummary = useMemo(() => {
		const grouped = new Map<string, ProductSummaryItem>();

		for (const transaction of checkinHistory) {
			if (!transaction.product) continue;

			const existing = grouped.get(transaction.productId);
			const isTimeProduct = transaction.product.timeValueSeconds !== null && transaction.product.timeValueSeconds !== undefined;

			if (existing) {
				existing.quantity += transaction.quantity;
				continue;
			}

			grouped.set(transaction.productId, {
				productId: transaction.productId,
				name: transaction.product.name,
				quantity: transaction.quantity,
				isTimeProduct,
			});
		}

		const products = Array.from(grouped.values());
		return {
			timeProducts: products.filter((item) => item.isTimeProduct),
			accessories: products.filter((item) => !item.isTimeProduct),
		};
	}, [checkinHistory]);

	const displayedTimerSeconds = useMemo(() => {
		if (!session) return 0;
		return resolveDisplaySeconds(session, nowTs, waitingSessions);
	}, [session, nowTs, waitingSessions]);

	// Handle QR scanner submit
	const handleScannerSubmit = (value: string) => {
		const normalized = value.trim();
		setBarcodeId(normalized);
		setInputValue(normalized);
	};

	// Handle play/pause with confirmation modal
	const handlePlayPause = (action: 'play' | 'pause') => {
		if (action === 'play' && !canPlay) return;
		if (action === 'pause' && !canPause) return;
		
		setPendingAction(action);
		setShowConfirm(true);
	};

	// Execute the confirmed action
	const executeAction = () => {
		if (!pendingAction || !barcodeId) return;

		if (pendingAction === 'play') {
			playMutation.mutate();
		} else if (pendingAction === 'pause') {
			pauseMutation.mutate();
		}

		setShowConfirm(false);
		setPendingAction(null);
	};

	// Get button configuration
	const getButtonConfig = () => {
		if (!session || sessionLoading) {
			return {
				variant: "danger" as const,
				icon: AlertCircle,
				text: "Cargando...",
				disabled: true,
				loading: false,
			};
		}

		if (session.remainingSeconds <= 0) {
			return {
				variant: "danger" as const,
				icon: AlertCircle,
				text: "Tiempo Agotado",
				disabled: true,
				loading: false,
			};
		}

		if (session.isActive) {
			return {
				variant: "cta" as const,
				tone: "warning" as const,
				icon: Pause,
				text: "PAUSAR",
				disabled: !canPause,
				loading: pauseMutation.isPending,
			};
		}

		return {
			variant: "cta" as const,
			tone: "success" as const,
			icon: Play,
			text: "PLAY",
			disabled: !canPlay,
			loading: playMutation.isPending,
		};
	};

	const buttonConfig = getButtonConfig();
	const visualState = session ? resolveVisualState(session) : "expired";
	const timeState = visualState === "waiting" || visualState === "paused" ? "stop" : undefined;
	const isSessionNotFound = sessionError?.message === "Session not found";

	return (
		<MobileShell
			title="Operación"
			footer={
				barcodeId && session ? (
					<div className="space-y-3">
						<div className="rounded-lg border border-border/30 bg-card/40 p-3 space-y-2">
							{historyLoading ? (
								<p className="text-xs text-muted-foreground">Cargando productos...</p>
							) : historyError ? (
								<p className="text-xs text-muted-foreground">No se pudo cargar el resumen de productos.</p>
							) : checkinHistory.length === 0 ? (
								<p className="text-xs text-muted-foreground">Sin productos registrados aún.</p>
							) : (
								<div className="space-y-2">
									<div className="flex items-center justify-between text-xs">
										<span className="text-muted-foreground">Tiempo comprado total</span>
										<span className="font-semibold text-foreground">
											{formatTimeValue(session.totalAllowedSeconds)}
										</span>
									</div>

									{purchaseSummary.timeProducts.length > 0 && (
										<div className="space-y-1">
											<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tiempo</p>
											{purchaseSummary.timeProducts.map((item) => (
												<div key={item.productId} className="flex items-center justify-between text-xs">
													<span className="text-foreground">{item.name}</span>
													<span className="text-muted-foreground">x{item.quantity}</span>
												</div>
											))}
										</div>
									)}

									{purchaseSummary.accessories.length > 0 && (
										<div className="space-y-1">
											<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Accesorios</p>
											{purchaseSummary.accessories.map((item) => (
												<div key={item.productId} className="flex items-center justify-between text-xs">
													<span className="text-foreground">{item.name}</span>
													<span className="text-muted-foreground">x{item.quantity}</span>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>

						{session.isActive && session.remainingSeconds > 0 && (
							<ActionButton
								variant="secondary"
								icon={Plus}
								className="h-12 text-base"
								onClick={() => lapMutation.mutate()}
								disabled={lapMutation.isPending}
							>
								{lapMutation.isPending ? `Registrando... (Total: ${session.lapsCount})` : `+1 Vuelta (Total: ${session.lapsCount})`}
							</ActionButton>
						)}

						<ActionButton
							variant={buttonConfig.variant}
							tone={buttonConfig.tone}
							icon={buttonConfig.icon}
							onClick={() => session && handlePlayPause(session.isActive ? "pause" : "play")}
							disabled={buttonConfig.disabled}
							loading={buttonConfig.loading}
							size="lg"
						>
							{buttonConfig.text}
						</ActionButton>
						{session.remainingSeconds <= 0 && (
							<p className="text-xs text-amber-300 text-center">
								Tiempo agotado. Realiza check-in para agregar tiempo.
							</p>
						)}
					</div>
				) : null
			}
		>
			<div className="flex flex-col h-full space-y-6">
				{/* Scan Input */}
				<div className="px-4">
					<QRScanner
						value={inputValue}
						onChange={setInputValue}
						onSubmit={() => handleScannerSubmit(inputValue)}
						placeholder="Escanea una pulsera"
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1 flex flex-col justify-center px-4">
					{barcodeId ? (
						sessionLoading ? (
							<div className="text-center">
								<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
								<p className="text-muted-foreground">Cargando sesión...</p>
							</div>
						) : sessionError ? (
							isSessionNotFound ? (
								<GlassCard className="text-center">
									<Scan className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
									<h3 className="text-lg font-medium mb-2">La sesión no existe</h3>
									<p className="text-muted-foreground">Verifica el código o realiza el check-in primero.</p>
								</GlassCard>
							) : (
								<GlassCard className="text-center">
									<AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
									<p className="text-destructive font-medium">Error de conexión</p>
								</GlassCard>
							)
						) : session ? (
							<div className="text-center space-y-6">
								<div className="flex flex-col items-center gap-3">
									<SessionTime
										seconds={displayedTimerSeconds}
										visualState={visualState}
										state={timeState}
										format="adaptive"
										size="xl"
									/>
									<StatusBadge status={visualState} size="lg" />
								</div>

							</div>
						) : (
							<GlassCard className="text-center">
								<Scan className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">
									No existe sesión activa
								</h3>
								<p className="text-muted-foreground">
									Escanea una pulsera para ver el estado
								</p>
							</GlassCard>
						)
					) : (
						<div className="text-center">
							<Scan className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
							<h2 className="text-2xl font-bold text-foreground mb-2">
								Operación de Juego
							</h2>
							<p className="text-muted-foreground">
								Escanea una pulsera para iniciar o pausar el juego
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Confirmation Sheet */}
			<ConfirmSheet
				isOpen={showConfirm}
				onClose={() => setShowConfirm(false)}
				onConfirm={executeAction}
				action={pendingAction || 'play'}
				loading={playMutation.isPending || pauseMutation.isPending}
				barcodeId={barcodeId}
			/>
		</MobileShell>
	);
}
