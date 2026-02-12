import { AxiosError } from "axios";
import { API } from "./api";
import type { SessionData } from "@shared/types";

export const getActiveSession = async (code: string): Promise<SessionData> => {
  try {
    const { data } = await API.get<SessionData>(`/api/sessions/active/${code}`);
    return data;
  } catch (error) {
    if (
      error instanceof AxiosError &&
      error.response?.status === 404 &&
      typeof error.response.data === "object"
    ) {
      const message = (error.response.data as { error?: string })?.error;
      throw new Error(message || "Session not found");
    }
    throw error;
  }
};

export const startSession = async (id: string) =>
  API.put<SessionData>(`/api/sessions/${id}/start`).then(({ data }) => data);

export const pauseSession = async (id: string) =>
  API.put<SessionData>(`/api/sessions/${id}/pause`).then(({ data }) => data);
