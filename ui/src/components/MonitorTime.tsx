import { SessionTime } from "@/components/SessionTime";
import type { TimerState } from "@/components/TimeFormatter";
import type { SessionVisualState } from "@/lib/sessionVisual";

interface MonitorTimeProps {
	seconds: number | null | undefined;
	state?: TimerState;
	className?: string;
	showHours?: boolean;
	visualState?: SessionVisualState;
}

export function MonitorTime({ seconds, state = "stop", className = "", showHours = true, visualState }: MonitorTimeProps) {
	return (
		<SessionTime
			seconds={seconds}
			state={state}
			visualState={visualState}
			colorize={false}
			format={showHours ? "hms" : "mmss"}
			size="sm"
			className={className}
		/>
	);
}
