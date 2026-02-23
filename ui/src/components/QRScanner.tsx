import { Scan, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QRScannerProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	onSubmit?: () => void;
	inputRef?: React.RefObject<HTMLInputElement | null>;
	autoFocus?: boolean;
	selectOnFocus?: boolean;
	onScannerVisibilityChange?: (visible: boolean) => void;
	onScannedSubmit?: (value: string) => void;
	enableGlobalKeyboardWedge?: boolean;
	globalKeyboardDisabled?: boolean;
	keyboardWedgeInactivityMs?: number;
}

interface Html5QrcodeScanner {
	start: (
		config: { facingMode: string },
		config2: { fps: number; qrbox: { width: number; height: number } },
		onSuccess: (decodedText: string) => void,
		onError: (error: unknown) => void,
	) => Promise<null>;
	stop: () => Promise<void>;
}

export function QRScanner({
	value,
	onChange,
	placeholder = "Código de pulsera",
	className = "",
	disabled = false,
	onSubmit,
	inputRef,
	autoFocus = false,
	selectOnFocus = false,
	onScannerVisibilityChange,
	onScannedSubmit,
	enableGlobalKeyboardWedge = false,
	globalKeyboardDisabled = false,
	keyboardWedgeInactivityMs = 1500,
}: QRScannerProps) {
	const [isScanning, setIsScanning] = useState(false);
	const [showScanner, setShowScanner] = useState(false);
	const scannerRef = useRef<Html5QrcodeScanner | null>(null);
	const scannerContainerRef = useRef<HTMLDivElement>(null);
	const internalInputRef = useRef<HTMLInputElement | null>(null);
	const scannerBufferRef = useRef("");
	const scannerBufferTimeoutRef = useRef<number | null>(null);

	const setInputRefs = (node: HTMLInputElement | null) => {
		internalInputRef.current = node;
		if (inputRef) {
			inputRef.current = node;
		}
	};

	const focusAndSelectInput = () => {
		const target = internalInputRef.current;
		if (!target || disabled) return;
		target.focus();
		target.select();
	};

	const resetScannerBuffer = useCallback(() => {
		scannerBufferRef.current = "";
		if (scannerBufferTimeoutRef.current !== null) {
			window.clearTimeout(scannerBufferTimeoutRef.current);
			scannerBufferTimeoutRef.current = null;
		}
	}, []);

	const submitScannedValue = useCallback((rawValue: string) => {
		const normalized = rawValue.trim();
		if (!normalized) return;
		onChange(normalized);
		if (onScannedSubmit) {
			onScannedSubmit(normalized);
			return;
		}
		onSubmit?.();
	}, [onChange, onScannedSubmit, onSubmit]);

	useEffect(() => {
		return () => {
			if (scannerRef.current) {
				try {
					scannerRef.current.stop();
				} catch {
					console.log("Scanner already stopped");
				}
			}
			resetScannerBuffer();
		};
	}, [resetScannerBuffer]);

	useEffect(() => {
		if (!autoFocus || showScanner) return;
		focusAndSelectInput();
	}, [autoFocus, disabled, showScanner]);

	useEffect(() => {
		onScannerVisibilityChange?.(showScanner);
	}, [onScannerVisibilityChange, showScanner]);

	useEffect(() => {
		if (!enableGlobalKeyboardWedge || globalKeyboardDisabled || disabled || showScanner) {
			resetScannerBuffer();
			return;
		}

		const handleGlobalKeyboardWedge = (event: KeyboardEvent) => {
			if (event.ctrlKey || event.altKey || event.metaKey) return;
			if (document.activeElement === internalInputRef.current) return;
			if (event.target instanceof HTMLElement) {
				if (event.target.isContentEditable) return;
				if (
					event.target.tagName === "INPUT" ||
					event.target.tagName === "TEXTAREA" ||
					event.target.tagName === "SELECT"
				) return;
			}

			if (event.key === "Enter") {
				const bufferedValue = scannerBufferRef.current.trim();
				if (bufferedValue) {
					event.preventDefault();
					submitScannedValue(bufferedValue);
				}
				resetScannerBuffer();
				return;
			}

			if (event.key.length !== 1 || event.repeat) return;
			scannerBufferRef.current += event.key;

			if (scannerBufferTimeoutRef.current !== null) {
				window.clearTimeout(scannerBufferTimeoutRef.current);
			}
			scannerBufferTimeoutRef.current = window.setTimeout(() => {
				scannerBufferRef.current = "";
				scannerBufferTimeoutRef.current = null;
			}, keyboardWedgeInactivityMs);
		};

		window.addEventListener("keydown", handleGlobalKeyboardWedge);
		return () => {
			window.removeEventListener("keydown", handleGlobalKeyboardWedge);
			resetScannerBuffer();
		};
	}, [
		enableGlobalKeyboardWedge,
		globalKeyboardDisabled,
		disabled,
		showScanner,
		keyboardWedgeInactivityMs,
		submitScannedValue,
		resetScannerBuffer,
	]);

	const startScanner = async () => {
		if (disabled) return;

		setShowScanner(true);

		// Enhanced camera support detection for local development
		// Allow camera access in development environments (localhost, 127.0.0.x, local IPs)
		const hostname = window.location.hostname;
		const isLocalDevelopment =
			hostname === "localhost" ||
			hostname.startsWith("127.0.") ||
			hostname.startsWith("192.168.") ||
			hostname.startsWith("10.") ||
			hostname.startsWith("172.16.") ||
			hostname.endsWith(".local");

		// For local development, skip the restrictive check and try camera access directly
		// For production, maintain the security check
		if (
			!isLocalDevelopment &&
			(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
		) {
			console.log("Camera not supported");
			return;
		}

		// Dynamically import html5-qrcode to avoid SSR issues
		const { Html5Qrcode } = await import("html5-qrcode");

		try {
			const scanner = new Html5Qrcode("qr-scanner");
			scannerRef.current = scanner;

			// Check if BarcodeDetector API is supported
			if ('BarcodeDetector' in window) {
				console.log("✅ Native BarcodeDetector API is supported");
			} else {
				console.log("❌ Native BarcodeDetector API not supported, using ZXing");
			}

			await scanner.start(
				{ facingMode: "environment" },
				{
					fps: 10,
					qrbox: { width: 250, height: 250 },
				},
				(decodedText: string) => {
					submitScannedValue(decodedText);
					stopScanner();
				},
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				(_error: unknown) => {
					// Don't log errors during normal scanning
					// console.warn("QR scan error:", error);
				},
			);
		} catch (error: unknown) {
			console.log(
				"Camera access failed:",
				error instanceof Error ? error.message : String(error),
			);
		}
	};

	const stopScanner = () => {
		if (scannerRef.current) {
			try {
				scannerRef.current.stop();
			} catch {
				console.log("Scanner already stopped");
			}
			scannerRef.current = null;
		}
		setIsScanning(false);
		setShowScanner(false);
	};

	const handleScanClick = () => {
		setIsScanning(true);
		startScanner();
	};


	return (
		<div className="relative">
			{/* Main Input */}
			<div className="relative">
				<Input
					ref={setInputRefs}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							if (onScannedSubmit) {
								e.preventDefault();
								submitScannedValue(value);
								return;
							}
							onSubmit?.();
						}
					}}
					onFocus={(e) => {
						if (selectOnFocus) {
							e.currentTarget.select();
						}
					}}
					placeholder={placeholder}
					disabled={disabled}
					className={`text-lg pr-16 h-14 text-center ${disabled ? 'bg-muted/50' : ''} ${className}`}
				/>
				{/* Loading indicator when disabled */}
				{disabled && (
					<div className="absolute right-2 top-1/2 -translate-y-1/2">
						<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				)}
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleScanClick}
					disabled={isScanning}
					className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0"
				>
					{isScanning ? (
						<div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
					) : (
						<Scan className="w-5 h-5 text-blue-600" />
					)}
				</Button>
			</div>

			{/* Scanner Modal */}
			{showScanner && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100">
						<div className="flex items-center justify-between px-4 py-1 border-b">
							<p className="text-sm font-semibold text-gray-900">
								Escanear código
							</p>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={stopScanner}
								className="h-6 w-6 p-0"
							>
								<X className="w-5 h-5" />
							</Button>
						</div>
						<div
							ref={scannerContainerRef}
							id="qr-scanner"
							className="w-full aspect-[4/3] bg-black overflow-hidden border-2 border-white rounded-lg"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
