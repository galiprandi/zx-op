import { API } from "./api";

interface ApiResponse<T> {
  data: T;
}

export const getActiveSession = async (code: string): Promise<SessionData> =>
  API.get<ApiResponse<SessionData>>(`/api/sessions/active/${code}`).then(({ data }) => data.data);

export const startSession = async (id: string): Promise<SessionData> =>
  API.put<ApiResponse<SessionData>>(`/api/sessions/${id}/start`).then(({ data }) => data.data);

export const pauseSession = async (id: string): Promise<SessionData> =>
  API.put<ApiResponse<SessionData>>(`/api/sessions/${id}/pause`).then(({ data }) => data.data);

export interface SessionData {
  id: string;
  status: "IDLE" | "ACTIVE" | "PAUSED" | "ENDED";
  purchasedMinutes: number;
  remainingMinutes: number;
  remainingSeconds: number;
  wristband: {
    id: string;
    qrCode: string;
  };
}
