import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
	getSessionStatus, 
	playSession, 
	pauseSession, 
	getAllActiveSessions,
	getSessionColor,
	isSessionExpired,
	isSessionActive,
	type SessionStatusResponse,
	type ActiveSessionResponse
} from "../api/playerSession";

export function usePlayerSession(barcodeId: string) {
	const queryClient = useQueryClient();

	const { 
		data: session, 
		isLoading, 
		error,
		refetch 
	} = useQuery<SessionStatusResponse, Error>({
		queryKey: ["playerSession", barcodeId],
		queryFn: () => getSessionStatus(barcodeId),
		enabled: !!barcodeId,
		retry: 1,
		refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
	});

	const playMutation = useMutation({
		mutationFn: () => playSession(barcodeId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["playerSession", barcodeId] });
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
		},
	});

	const pauseMutation = useMutation({
		mutationFn: () => pauseSession(barcodeId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["playerSession", barcodeId] });
			queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
		},
	});

	const handlePlay = () => {
		if (session && !isSessionExpired(session)) {
			playMutation.mutate();
		}
	};

	const handlePause = () => {
		if (session && session.isActive) {
			pauseMutation.mutate();
		}
	};

	// Computed properties
	const isExpired = session ? isSessionExpired(session) : false;
	const isActive = session ? isSessionActive(session) : false;
	const color = session ? getSessionColor(session.remainingSeconds) : 'red';
	const canPlay = session && !isExpired && !isActive;
	const canPause = session && isActive;

	return {
		session,
		isLoading,
		error,
		isExpired,
		isActive,
		color,
		canPlay,
		canPause,
		handlePlay,
		handlePause,
		playMutation,
		pauseMutation,
		refetch,
	};
}

export function useActiveSessions() {
	const queryClient = useQueryClient();

	const { 
		data: sessions = [], 
		isLoading, 
		error 
	} = useQuery<ActiveSessionResponse[], Error>({
		queryKey: ["activeSessions"],
		queryFn: getAllActiveSessions,
		retry: 1,
		refetchInterval: 3000, // Auto-refresh every 3 seconds for monitor
	});

	// Computed properties
	const activePlayingSessions = sessions.filter(session => 
		isSessionActive(session)
	);

	// Sessions that have time but have never started (waiting to enter)
	const waitingSessions = sessions.filter(session => 
		!session.isActive &&
		session.remainingSeconds > 0 &&
		session.lastStartAt === null &&
		session.accumulatedSeconds === 0
	);

	// Paused sessions that have already been in play (exclude never-started waiting)
	const pausedSessions = sessions.filter(session => 
		!session.isActive &&
		session.remainingSeconds > 0 &&
		!(session.lastStartAt === null && session.accumulatedSeconds === 0)
	);

	const expiringSoonSessions = sessions.filter(session => 
		session.remainingSeconds > 0 && session.remainingSeconds <= 300 // <= 5 minutes
	);

	const expiredSessions = sessions.filter(session => 
		isSessionExpired(session)
	);

	// Statistics
	const totalActive = sessions.length;
	const totalPlaying = activePlayingSessions.length;
	const totalPaused = pausedSessions.length;
	const totalWaiting = waitingSessions.length;
	const totalExpiringSoon = expiringSoonSessions.length;

	const occupancyRate = totalActive > 0 ? (totalPlaying / totalActive) * 100 : 0;

	// Auto-refetch on interval
	const refreshSessions = () => {
		queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
	};

	return {
		sessions,
		activePlayingSessions,
		waitingSessions,
		pausedSessions,
		expiringSoonSessions,
		expiredSessions,
		totalActive,
		totalPlaying,
		totalPaused,
		totalWaiting,
		totalExpiringSoon,
		occupancyRate,
		isLoading,
		error,
		refreshSessions,
	};
}

export function useSessionHistory(barcodeId: string) {
	const { 
		session, 
		isLoading: sessionLoading 
	} = usePlayerSession(barcodeId);

	const { 
		data: history = [], 
		isLoading: historyLoading 
	} = useQuery({
		queryKey: ["sessionHistory", barcodeId],
		queryFn: async () => {
			// This would need to be implemented in the API
			// For now, return empty array
			return [];
		},
		enabled: !!barcodeId,
	});

	return {
		session,
		history,
		isLoading: sessionLoading || historyLoading,
	};
}
