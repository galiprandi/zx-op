import { SessionStatus } from './sessionStatus';

export interface PlayerSession {
  id: string;
  barcodeId: string;
  totalAllowedSeconds: number;
  accumulatedSeconds: number;
  lastStartAt: Date | null;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerSessionStatus extends PlayerSession {
  remainingSeconds: number;
  remainingMinutes: number;
  status: SessionStatus;
}

export interface SessionWithComputedFields extends PlayerSessionStatus {
  isExpired: boolean;
  timeProgress: number; // percentage 0-100
}

export interface SessionCreateRequest {
  barcodeId: string;
}

export interface SessionPlayRequest {
  barcodeId: string;
}

export interface SessionPauseRequest {
  barcodeId: string;
}
