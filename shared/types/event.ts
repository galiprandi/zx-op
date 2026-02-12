import type { Session } from "./session";
import type { EventType } from "./enums";

export interface Event {
  id: string;
  sessionId: string;
  session?: Session;
  type: EventType;
  data?: unknown;
  createdAt: Date;
}
