import type { ActiveSessionResponse } from "@/api/playerSession";
import type { SessionVisualState } from "@/lib/sessionVisual";

type DateLike = string | Date | null | undefined;

type SessionForCalc = Pick<
	ActiveSessionResponse,
	"barcodeId" | "isActive" | "remainingSeconds" | "lastStartAt" | "accumulatedSeconds" | "createdAt" | "updatedAt"
>;

type PartialSessionForCalc = {
	barcodeId: string;
	isActive: boolean;
	remainingSeconds: number;
	lastStartAt: DateLike;
	accumulatedSeconds: number;
	createdAt: DateLike;
	updatedAt?: DateLike;
};

const toMs = (value: DateLike, fallbackTs: number): number => {
	if (!value) return fallbackTs;
	if (value instanceof Date) return value.getTime();
	return new Date(value).getTime();
};

const normalizeBarcode = (value: string): string => value.trim().toLowerCase();

export function isWaitingSession(session: PartialSessionForCalc): boolean {
	return (
		!session.isActive &&
		session.remainingSeconds > 0 &&
		session.lastStartAt === null &&
		session.accumulatedSeconds === 0
	);
}

export function resolveVisualState(session: PartialSessionForCalc): SessionVisualState {
	if (session.remainingSeconds <= 0) return "expired";
	if (isWaitingSession(session)) return "waiting";
	if (session.isActive && session.remainingSeconds <= 60) return "expiring";
	if (session.isActive) return "playing";
	return "paused";
}

export function resolveWaitingElapsedSeconds(
	session: PartialSessionForCalc,
	nowTs: number,
	waitingSessions?: SessionForCalc[]
): number {
	const waitingSource = waitingSessions?.find(
		(s) => normalizeBarcode(s.barcodeId) === normalizeBarcode(session.barcodeId)
	);
	const createdAt = waitingSource?.createdAt ?? session.createdAt;
	const createdAtMs = toMs(createdAt, nowTs);
	return Math.max(0, Math.floor((nowTs - createdAtMs) / 1000));
}

export function resolvePausedElapsedSeconds(session: SessionForCalc, nowTs: number): number {
	const updatedAtMs = toMs(session.updatedAt, nowTs);
	return Math.max(0, Math.floor((nowTs - updatedAtMs) / 1000));
}

export function resolveDisplaySeconds(
	session: PartialSessionForCalc,
	nowTs: number,
	waitingSessions?: SessionForCalc[]
): number {
	const visualState = resolveVisualState(session);
	if (visualState === "waiting") {
		return resolveWaitingElapsedSeconds(session, nowTs, waitingSessions);
	}
	return session.remainingSeconds;
}
