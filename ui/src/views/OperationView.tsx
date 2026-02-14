import { useState } from "react";
import { Scan, AlertCircle } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { QRScanner } from "@/components/QRScanner";
import { ActionButton } from "@/components/ActionButton";
import { BigTimer } from "@/components/BigTimer";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { GlassCard } from "@/components/GlassCard";
import { usePlayerSession } from "@/hooks/usePlayerSession";

export function OperationView() {
	const [barcodeId, setBarcodeId] = useState("");
	const [inputValue, setInputValue] = useState("");
	const [showConfirm, setShowConfirm] = useState(false);
	const [pendingAction, setPendingAction] = useState<'play' | 'pause' | null>(null);

	// Get current session status for the scanned barcode
	const { 
		session, 
		isLoading: sessionLoading, 
		error: sessionError,
		canPlay,
		canPause,
		playMutation,
		pauseMutation
	} = usePlayerSession(barcodeId);

	// Handle QR scanner submit
	const handleScannerSubmit = (value: string) => {
		setBarcodeId(value);
		setInputValue(value);
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
				type: "danger" as const,
				text: "Cargando...",
				disabled: true,
				loading: false,
			};
		}

		if (session.remainingSeconds <= 0) {
			return {
				type: "danger" as const,
				text: "Tiempo Agotado",
				disabled: true,
				loading: false,
			};
		}

		if (session.isActive) {
			return {
				type: "pause" as const,
				text: "PAUSAR",
				disabled: !canPause,
				loading: pauseMutation.isPending,
			};
		}

		return {
			type: "play" as const,
			text: "PLAY",
			disabled: !canPlay,
			loading: playMutation.isPending,
		};
	};

	const buttonConfig = getButtonConfig();

	return (
		<MobileShell title="Operación">
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
							<GlassCard className="text-center">
								<AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
								<p className="text-destructive font-medium">Error de conexión</p>
							</GlassCard>
						) : session ? (
							<div className="text-center space-y-6">
								{/* Timer Display */}
								<BigTimer 
									seconds={session.remainingSeconds} 
									size="md"
									showMinutes={false}
								/>
								
								{/* Status Badge */}
								<StatusBadge 
									status={
										session.remainingSeconds <= 0 ? "expired" :
										session.remainingSeconds <= 60 ? "expiring" :
										session.status
									}
									size="lg"
								/>
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

				{/* Action Button */}
				{barcodeId && session && (
					<div className="px-4 pb-4">
						<ActionButton
							type={buttonConfig.type}
							onClick={() => session && handlePlayPause(session.isActive ? 'pause' : 'play')}
							disabled={buttonConfig.disabled}
							loading={buttonConfig.loading}
							size="xl"
						>
							{buttonConfig.text}
						</ActionButton>
					</div>
				)}

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
