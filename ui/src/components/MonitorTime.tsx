import { TimeFormatter, type TimerState } from "@/components/TimeFormatter";

interface MonitorTimeProps {
	seconds: number | null | undefined;
	state?: TimerState;
	className?: string;
	showHours?: boolean;
}

export function MonitorTime({ seconds, state = "stop", className = "", showHours = true }: MonitorTimeProps) {
	if (seconds === null || seconds === undefined) return "--";

	return (
		<TimeFormatter seconds={seconds} state={state}>
			{({ formatted, raw }) => {
				if (showHours) {
					// Format with hours: H:MM:SS
					const h = Math.floor(raw / 3600);
					const m = Math.floor((raw % 3600) / 60).toString().padStart(2, "0");
					const s = (raw % 60).toString().padStart(2, "0");
					return <span className={className}>{`${h}:${m}:${s}`}</span>;
				} else {
					// Format without hours: MM:SS
					return <span className={className}>{formatted}</span>;
				}
			}}
		</TimeFormatter>
	);
}
