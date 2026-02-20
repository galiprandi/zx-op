export type SessionVisualState = "waiting" | "playing" | "paused" | "expiring" | "expired";

export type SessionTimerDirection = "stop" | "asc" | "desc";

export const sessionTextColorClass: Record<SessionVisualState, string> = {
	waiting: "text-blue-400",
	playing: "text-green-400",
	paused: "text-orange-400",
	expiring: "text-yellow-400",
	expired: "text-red-500",
};

export const sessionBadgeColorClass: Record<SessionVisualState, string> = {
	waiting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
	playing: "bg-green-500/20 text-green-400 border-green-500/30",
	paused: "bg-orange-500/20 text-orange-400 border-orange-500/30",
	expiring: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
	expired: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const sessionRowTone: Record<SessionVisualState, "green" | "blue" | "yellow" | "orange" | "red" | "muted"> = {
	waiting: "blue",
	playing: "green",
	paused: "orange",
	expiring: "orange",
	expired: "red",
};

export function getTimerDirectionByState(state: SessionVisualState): SessionTimerDirection {
	if (state === "waiting" || state === "paused") return "asc";
	if (state === "playing" || state === "expiring") return "desc";
	return "stop";
}
