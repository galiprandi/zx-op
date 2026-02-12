export type LogAction = 'CHECKIN' | 'PLAY' | 'PAUSE' | 'TIME_ADDED' | 'AUTO_EXPIRE';

export interface SessionLog {
  id: string;
  playerSessionId: string;
  action: LogAction;
  data?: unknown;
  createdAt: Date;
}

export interface SessionLogWithSession extends SessionLog {
  playerSession: {
    id: string;
    barcodeId: string;
  };
}

export interface SessionLogData {
  created?: boolean;
  extra?: number;
  totalSecondsToAdd?: number;
  products?: Array<{ id: string; quantity: number }>;
}
