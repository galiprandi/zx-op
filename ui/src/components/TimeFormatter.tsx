import { useState, useEffect, useRef } from "react";

export type TimerState = "stop" | "asc" | "desc";

export interface TimeFormatterProps {
	seconds: number;
	state?: TimerState;
	onTimeUpdate?: (seconds: number) => void;
	children: (formattedTime: {
		raw: number;
		minutes: number;
		seconds: number;
		formatted: string;
		isExpired: boolean;
	}) => React.ReactNode;
}

export function TimeFormatter({ seconds, state = "stop", onTimeUpdate, children }: TimeFormatterProps) {
	const [displaySeconds, setDisplaySeconds] = useState<number>(seconds);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		// Clear any existing interval
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		// Handle different timer states
		if (state === "desc" && seconds > 0) {
			// Countdown mode
			const initTimer = setTimeout(() => {
				setDisplaySeconds(seconds);
			}, 0);
			
			intervalRef.current = setInterval(() => {
				setDisplaySeconds(prev => {
					const newValue = prev - 1;
					if (newValue <= 0) {
						// Clear interval when time runs out
						if (intervalRef.current) {
							clearInterval(intervalRef.current);
							intervalRef.current = null;
						}
						onTimeUpdate?.(0);
						return 0;
					}
					onTimeUpdate?.(newValue);
					return newValue;
				});
			}, 1000);

			return () => {
				clearTimeout(initTimer);
			};
		} else if (state === "asc") {
			// Count up mode
			const initTimer = setTimeout(() => {
				setDisplaySeconds(0);
			}, 0);
			
			intervalRef.current = setInterval(() => {
				setDisplaySeconds(prev => {
					const newValue = prev + 1;
					onTimeUpdate?.(newValue);
					return newValue;
				});
			}, 1000);

			return () => {
				clearTimeout(initTimer);
			};
		} else {
			// Stop mode - just display the provided seconds
			const stopTimer = setTimeout(() => {
				setDisplaySeconds(seconds);
			}, 0);
			
			return () => {
				clearTimeout(stopTimer);
			};
		}

		// Cleanup function
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [seconds, state, onTimeUpdate]);

	// Calculate time values
	const minutes = Math.floor(displaySeconds / 60);
	const secs = displaySeconds % 60;
	const isExpired = displaySeconds <= 0;

	// Format time string
	const formatTime = () => {
		if (displaySeconds <= 0) return "00:00";
		return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const formattedTime = {
		raw: displaySeconds,
		minutes,
		seconds: secs,
		formatted: formatTime(),
		isExpired,
	};

	return <>{children(formattedTime)}</>;
}
