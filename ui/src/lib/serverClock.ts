let serverOffsetMs = 0;

export function updateServerClockFromHeader(dateHeader?: string | null): void {
	if (!dateHeader) return;
	const serverMs = new Date(dateHeader).getTime();
	if (Number.isNaN(serverMs)) return;

	serverOffsetMs = serverMs - Date.now();
}

export function getSyncedNowMs(): number {
	return Date.now() + serverOffsetMs;
}

