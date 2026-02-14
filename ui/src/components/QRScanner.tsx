import { Scan, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QRScannerProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	onSubmit?: () => void;
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
}: QRScannerProps) {
	const [isScanning, setIsScanning] = useState(false);
	const [showScanner, setShowScanner] = useState(false);
	const scannerRef = useRef<Html5QrcodeScanner | null>(null);
	const scannerContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		return () => {
			if (scannerRef.current) {
				try {
					scannerRef.current.stop();
				} catch {
					console.log("Scanner already stopped");
				}
			}
		};
	}, []);

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
					onChange(decodedText);
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
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') onSubmit?.(); }}
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
