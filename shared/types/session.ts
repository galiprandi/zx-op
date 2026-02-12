import type { Wristband } from "./wristband";
import type { Event } from "./event";
import { SessionStatus } from "./enums";

export interface Session {
  id: string;
  wristbandId: string;
  wristband?: Wristband;
  status: SessionStatus;
  purchasedMinutes: number;
  startTime?: Date;
  endTime?: Date;
  lastPauseTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  events?: Event[];
}

export interface SessionData extends Session {
  remainingMinutes: number;
  remainingSeconds: number;
}

export interface TimeRemaining {
  minutes: number;
  seconds: number;
  isExpired: boolean;
  colorCode: "green" | "yellow" | "red";
}

export function calculateRemainingTime(session: Session): TimeRemaining {
  if (!session.startTime || session.status !== SessionStatus.ACTIVE) {
    return { minutes: 0, seconds: 0, isExpired: true, colorCode: "red" };
  }

  const now = new Date();
  const elapsed = now.getTime() - session.startTime.getTime();
  const remainingMs = session.purchasedMinutes * 60 * 1000 - elapsed;

  if (remainingMs <= 0) {
    return { minutes: 0, seconds: 0, isExpired: true, colorCode: "red" };
  }

  const minutes = Math.floor(remainingMs / (60 * 1000));
  const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
  const isExpired = remainingMs <= 0;
  const colorCode = remainingMs > 5 * 60 * 1000 ? "green" : "yellow";

  return { minutes, seconds, isExpired, colorCode };
}
