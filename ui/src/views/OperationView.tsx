import { useState } from "react";
import { Play, Pause, AlertCircle, Clock, X } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { QRScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import { getSessionColor } from "@/api/playerSession";

export function OperationView() {
	const [barcodeId, setBarcodeId] = useState("");
	const [inputValue, setInputValue] = useState("");
	const [showConfirmModal, setShowConfirmModal] = useState(false);
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
		setInputValue("");
	};

	// Handle play/pause with confirmation modal
	const handlePlayPause = (action: 'play' | 'pause') => {
		if (action === 'play' && !canPlay) return;
		if (action === 'pause' && !canPause) return;
		
		setPendingAction(action);
		setShowConfirmModal(true);
	};

	// Execute the confirmed action
	const executeAction = () => {
		if (!pendingAction || !barcodeId) return;

		if (pendingAction === 'play') {
			playMutation.mutate();
		} else if (pendingAction === 'pause') {
			pauseMutation.mutate();
		}

		setShowConfirmModal(false);
		setPendingAction(null);
	};

	// Format time display
	const formatTimeDisplay = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	// Get session color for UI
	const sessionColor = session ? getSessionColor(session.remainingSeconds) : 'gray';

	// Check if session is expired
	const isSessionExpired = session ? session.remainingSeconds <= 0 : false;

	// Get button configuration based on session state
	const getButtonConfig = () => {
		if (!session || sessionLoading) {
			return {
				text: "Cargando...",
				disabled: true,
				bgColor: "bg-gray-500",
				hoverColor: "hover:bg-gray-600",
				icon: <Clock className="w-5 h-5" />
			};
		}

		if (isSessionExpired) {
			return {
				text: "Tiempo Agotado",
				disabled: true,
				bgColor: "bg-red-500",
				hoverColor: "hover:bg-red-600",
				icon: <AlertCircle className="w-5 h-5" />
			};
		}

		if (session.isActive) {
			return {
				text: pauseMutation.isPending ? "Pausando..." : "Pausar",
				disabled: !canPause || pauseMutation.isPending,
				bgColor: "bg-yellow-500",
				hoverColor: "hover:bg-yellow-600",
				icon: pauseMutation.isPending ? 
					<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 
					<Pause className="w-5 h-5" />
			};
		}

		return {
			text: playMutation.isPending ? "Iniciando..." : "Play",
			disabled: !canPlay || playMutation.isPending,
			bgColor: "bg-green-500",
			hoverColor: "hover:bg-green-600",
			icon: playMutation.isPending ? 
				<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 
				<Play className="w-5 h-5" />
		};
	};

	const buttonConfig = getButtonConfig();

	return (
		<MobileLayout
			footer={
				<div className="flex gap-2">
					<Button
						type="button"
						size="lg"
						disabled={buttonConfig.disabled}
						onClick={() => session && handlePlayPause(session.isActive ? 'pause' : 'play')}
						className={`h-16 ${buttonConfig.bgColor} ${buttonConfig.hoverColor} text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
					>
						{buttonConfig.icon}
						{buttonConfig.text}
					</Button>
				</div>
			}
		>
			<div className="p-4 space-y-6">
				{/* QR Scanner Section */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold text-muted-foreground">
							Escanear pulsera
						</span>
						{barcodeId && (
							<span className="text-xs font-semibold uppercase text-blue-600">
								Código listo
							</span>
						)}
					</div>
					<QRScanner
						value={inputValue}
						onChange={setInputValue}
						onSubmit={() => handleScannerSubmit(inputValue)}
						placeholder="Código de pulsera"
						className="text-lg pr-16 h-14"
					/>
					<p className="text-xs text-muted-foreground">
						Escanea o ingresa manualmente usando el botón del escáner
					</p>
				</div>

				{/* Session Status Card */}
				{barcodeId && (
					<Card className={`border-2 ${
						sessionColor === 'green' ? 'border-green-200' :
						sessionColor === 'yellow' ? 'border-yellow-200' :
						sessionColor === 'red' ? 'border-red-200' :
						'border-gray-200'
					}`}>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Estado de Sesión</span>
								{session && (
									<div className={`w-3 h-3 rounded-full ${
										sessionColor === 'green' ? 'bg-green-500' :
										sessionColor === 'yellow' ? 'bg-yellow-500' :
										sessionColor === 'red' ? 'bg-red-500' :
										'bg-gray-500'
									}`} />
								)}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{sessionLoading ? (
								<div className="text-center py-8">
									<div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
									<p className="text-gray-600">Cargando sesión...</p>
								</div>
							) : sessionError ? (
								<div className="text-center py-8">
									<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
									<p className="text-red-600 font-medium">Error de conexión</p>
								</div>
							) : session ? (
								<div className="text-center space-y-4">
									{/* Timer Display */}
									<div className={`text-6xl font-bold font-mono ${
										sessionColor === 'green' ? 'text-green-600' :
										sessionColor === 'yellow' ? 'text-yellow-600' :
										sessionColor === 'red' ? 'text-red-600' :
										'text-gray-600'
									}`}>
										{formatTimeDisplay(session.remainingSeconds)}
									</div>
									
									{/* Session Info */}
									<div className="space-y-2">
										<div className="flex items-center justify-center gap-2">
											{session.isActive ? (
												<>
													<Play className="w-4 h-4 text-green-600" />
													<span className="font-medium text-green-700">En Juego</span>
												</>
											) : (
												<>
													<Pause className="w-4 h-4 text-yellow-600" />
													<span className="font-medium text-yellow-700">Pausado</span>
												</>
											)}
										</div>
										
										<div className="text-sm text-gray-600">
											{session.remainingMinutes} min restantes
										</div>
										
										<div className="text-xs text-gray-500">
											Código: {barcodeId}
										</div>
									</div>

									{/* Status Messages */}
									{isSessionExpired && (
										<div className="bg-red-50 border border-red-200 rounded-lg p-3">
											<p className="text-red-700 text-sm font-medium">
												⚠️ Tiempo agotado. Se requiere agregar más tiempo para continuar.
											</p>
										</div>
									)}
									
									{!session.isActive && !isSessionExpired && (
										<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
											<p className="text-yellow-700 text-sm font-medium">
												ℹ️ Sesión pausada. Presiona Play para reanudar.
											</p>
										</div>
									)}
								</div>
							) : (
								<div className="text-center py-8">
									<AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-600 font-medium">No existe sesión activa</p>
									<p className="text-xs text-gray-500 mt-2">
										Escanea una pulsera para ver el estado
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Instructions */}
				{!barcodeId && (
					<Card className="bg-blue-50 border-blue-200">
						<CardContent className="p-4">
							<div className="flex items-start gap-3">
								<AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
								<div>
									<h3 className="font-semibold text-blue-800 text-sm">Instrucciones</h3>
									<ul className="text-xs text-blue-700 space-y-1 mt-2">
										<li>Escanea el código de pulsera del participante</li>
										<li>Verás el tiempo restante en tiempo real</li>
										<li>Usa Play para iniciar o reanudar el juego</li>
										<li>Usa Pausar para hacer una pausa temporal</li>
										<li>El tiempo se detiene al pausar</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Confirmation Modal */}
			{showConfirmModal && pendingAction && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
					<div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6 animate-fadeIn">
						<div className="text-center">
							<div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
								pendingAction === 'play' ? 'bg-green-100' : 'bg-yellow-100'
							}`}>
								{pendingAction === 'play' ? (
									<Play className="w-8 h-8 text-green-600" />
								) : (
									<Pause className="w-8 h-8 text-yellow-600" />
								)}
							</div>
							
							<h3 className="text-xl font-bold mb-2">
								{pendingAction === 'play' ? 'Iniciar Juego' : 'Pausar Juego'}
							</h3>
							
							<p className="text-gray-600 mb-6">
								{pendingAction === 'play' 
									? '¿Estás seguro de que quieres iniciar el juego para esta sesión?' 
									: '¿Estás seguro de que quieres pausar el juego? El tiempo se detendrá.'
								}
							</p>

							<div className="flex gap-3">
								<Button
									variant="outline"
									onClick={() => setShowConfirmModal(false)}
									className="flex-1"
								>
									<X className="w-4 h-4 mr-2" />
									Cancelar
								</Button>
								<Button
									onClick={executeAction}
									className={`flex-1 ${
										pendingAction === 'play' 
											? 'bg-green-600 hover:bg-green-700' 
											: 'bg-yellow-600 hover:bg-yellow-700'
									} text-white`}
								>
									{pendingAction === 'play' ? (
										<>
											<Play className="w-4 h-4 mr-2" />
											Iniciar
										</>
									) : (
										<>
											<Pause className="w-4 h-4 mr-2" />
											Pausar
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</MobileLayout>
	);
}
