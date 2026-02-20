import { TimeFormatter, type TimerState } from "@/components/TimeFormatter";
import { formatTimeValue } from "@/api/products";
import { cn } from "@/lib/utils";
import { getTimerDirectionByState, type SessionVisualState, sessionTextColorClass } from "@/lib/sessionVisual";

interface SessionTimeProps {
	seconds: number | null | undefined;
	visualState?: SessionVisualState;
	state?: TimerState;
	format?: "mmss" | "hms" | "adaptive";
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
	colorize?: boolean;
}

const sizeClassMap: Record<NonNullable<SessionTimeProps["size"]>, string> = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-4xl",
	xl: "text-6xl",
};

export function SessionTime({
	seconds,
	visualState,
	state,
	format = "mmss",
	size = "md",
	className,
	colorize = true,
}: SessionTimeProps) {
	if (seconds === null || seconds === undefined) return <>--</>;

	const timerState = state ?? (visualState ? getTimerDirectionByState(visualState) : "stop");
	const colorClass = visualState && colorize ? sessionTextColorClass[visualState] : "";

	return (
		<TimeFormatter seconds={seconds} state={timerState}>
			{({ raw, formatted }) => {
				const h = Math.floor(raw / 3600);
				const m = Math.floor((raw % 3600) / 60).toString().padStart(2, "0");
				const s = (raw % 60).toString().padStart(2, "0");

				let rendered = formatted;
				if (format === "hms") rendered = `${h}:${m}:${s}`;
				if (format === "adaptive") rendered = raw >= 3600 ? formatTimeValue(raw) : formatted;

				return (
					<span className={cn("font-mono tabular-nums font-semibold", sizeClassMap[size], colorClass, className)}>
						{rendered}
					</span>
				);
			}}
		</TimeFormatter>
	);
}

