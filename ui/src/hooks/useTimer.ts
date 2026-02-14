import { TimeFormatter } from "@/components/TimeFormatter";

export interface UseTimerOptions {
	onTimeUpdate?: (seconds: number) => void;
}

export function useTimer(options: UseTimerOptions = {}) {
	const { onTimeUpdate } = options;

	return {
		TimeFormatter,
		onTimeUpdate,
	};
}
