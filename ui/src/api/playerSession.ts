import { AxiosError } from "axios";
import { API } from "./api";
import type { PlayerSession, PlayerSessionStatus } from "@shared/types";

export interface SessionStatusResponse extends PlayerSessionStatus {
  remainingSeconds: number;
  remainingMinutes: number;
}

export interface ActiveSessionResponse {
  id: string;
  barcodeId: string;
  totalAllowedSeconds: number;
  accumulatedSeconds: number;
  lastStartAt: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  remainingSeconds: number;
  remainingMinutes: number;
}

export const getSessionStatus = async (barcodeId: string): Promise<SessionStatusResponse> => {
  try {
    const { data } = await API.get<SessionStatusResponse>(`/api/sessions/status/${barcodeId}`);
    return data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      throw new Error("Session not found");
    }
    throw error;
  }
};

export const playSession = async (barcodeId: string): Promise<PlayerSession> => {
  const { data } = await API.post<PlayerSession>(`/api/sessions/play`, { barcodeId });
  return data;
};

export const pauseSession = async (barcodeId: string): Promise<PlayerSession> => {
  const { data } = await API.post<PlayerSession>(`/api/sessions/pause`, { barcodeId });
  return data;
};

export const getAllActiveSessions = async (): Promise<ActiveSessionResponse[]> => {
  const { data } = await API.get<ActiveSessionResponse[]>(`/api/sessions/active`);
  return data;
};

// Helper functions for UI
export const formatTimeRemaining = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const getSessionProgress = (session: ActiveSessionResponse): number => {
  if (session.totalAllowedSeconds === 0) return 0;
  const consumed = session.accumulatedSeconds + (session.isActive ? 
    Math.floor((new Date().getTime() - new Date(session.lastStartAt!).getTime()) / 1000) : 0);
  return Math.min(100, (consumed / session.totalAllowedSeconds) * 100);
};

export const getSessionColor = (remainingSeconds: number): 'green' | 'yellow' | 'red' => {
  if (remainingSeconds > 300) return 'green'; // > 5 minutes
  if (remainingSeconds > 60) return 'yellow';  // > 1 minute
  return 'red'; // <= 1 minute
};

export const isSessionExpired = (session: ActiveSessionResponse): boolean => {
  return session.remainingSeconds <= 0;
};

export const isSessionActive = (session: ActiveSessionResponse): boolean => {
  return session.isActive && !isSessionExpired(session);
};
