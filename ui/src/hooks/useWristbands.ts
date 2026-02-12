import { useQuery } from "@tanstack/react-query";
import { getActiveSession } from "../api/operation";
import type { SessionData } from "@shared/types";
import DayJs from "@/lib/dayjs";

export function useWristband(wristbandCode: string) {
	const { data: wristband, isLoading, error } = useQuery<SessionData, Error>({
		queryKey: ["session", wristbandCode],
		queryFn: () => getActiveSession(wristbandCode),
		enabled: !!wristbandCode,
		retry: 1,
	});

	// Check if startTime + purchasedMinutes is less than now
	const isExpired = ()=> wristband?.startTime ?DayJs().isAfter(DayJs(wristband?.startTime || "").add(wristband?.purchasedMinutes || 0, "minute")) : false;
	return {  wristband, isExpired, isLoading, error };
}
