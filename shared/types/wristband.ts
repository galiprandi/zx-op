import type { User } from "./user";
import type { Session } from "./session";
import type { Transaction } from "./transaction";

export interface Wristband {
  id: string;
  qrCode: string;
  userId?: string;
  user?: User;
  sessions?: Session[];
  transactions?: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}
