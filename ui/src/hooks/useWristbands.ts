import { useQuery } from "@tanstack/react-query";
import { getActiveSession, type SessionData } from "../api/operation";

export function useWristbandSession(wristbandCode: string) {
	const { data:wristband, isLoading, error } = useQuery<SessionData, Error>({
		queryKey: ["session", wristbandCode],
		queryFn: () => getActiveSession(wristbandCode),
		enabled: !!wristbandCode,
		retry: 1,
	});

	return { wristband, isLoading, error };
}
