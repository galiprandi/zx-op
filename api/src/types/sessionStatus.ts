// Session Status enum - Shared across API modules
// This aligns with the frontend shared types but avoids TypeScript rootDir issues

export enum SessionStatus {
  WAITING = 'waiting',
  PLAYING = 'playing', 
  PAUSED = 'paused'
}

export type SessionStatusType = keyof typeof SessionStatus;
