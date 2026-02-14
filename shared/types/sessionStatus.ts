export enum SessionStatus {
  WAITING = 'waiting',
  PLAYING = 'playing', 
  PAUSED = 'paused'
}

export type SessionStatusType = keyof typeof SessionStatus;
