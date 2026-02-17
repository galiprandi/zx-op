import { PrismaClient, PlayerSession, Prisma } from '@prisma/client';
import { emitSessionEvent } from './socketService';
import { SessionStatus } from '../../../types/sessionStatus';
import { getOperationalContext } from '../../system/services/operationalContextService';

const prisma = new PrismaClient();
const SessionLogAction = {
  CHECKIN: 'CHECKIN',
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  TIME_ADDED: 'TIME_ADDED',
  AUTO_EXPIRE: 'AUTO_EXPIRE',
} as const;
type SessionLogAction = (typeof SessionLogAction)[keyof typeof SessionLogAction];

export type SessionWithRemaining = PlayerSession & {
  remainingSeconds: number;
  remainingMinutes: number;
  status: SessionStatus;
};

export class PlayerSessionService {
  private computeRemainingSeconds(session: {
    totalAllowedSeconds: number | null | undefined;
    accumulatedSeconds: number | null | undefined;
    isActive: boolean;
    lastStartAt: Date | null;
    expiresAt?: Date | null;
  }): number {
    const now = new Date();

    if (session.expiresAt) {
      const remainingFromExpiry = Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000);
      return Math.max(0, Number.isFinite(remainingFromExpiry) ? remainingFromExpiry : 0);
    }

    const running = session.isActive && session.lastStartAt 
      ? Math.floor((now.getTime() - session.lastStartAt.getTime()) / 1000) 
      : 0;
    const totalAllowed = session.totalAllowedSeconds ?? 0;
    const consumedBase = session.accumulatedSeconds ?? 0;
    const consumed = consumedBase + running;
    const remaining = totalAllowed - consumed;
    return Math.max(0, Number.isFinite(remaining) ? remaining : 0);
  }

  private computeSessionStatus(session: {
    isActive: boolean;
    lastStartAt: Date | null;
    accumulatedSeconds: number | null | undefined;
    remainingSeconds: number;
  }): SessionStatus {
    // Waiting: never started sessions
    if (!session.isActive && 
        session.lastStartAt === null && 
        (session.accumulatedSeconds ?? 0) === 0 && 
        session.remainingSeconds > 0) {
      return SessionStatus.WAITING;
    }
    
    // Playing: currently active sessions
    if (session.isActive && session.remainingSeconds > 0) {
      return SessionStatus.PLAYING;
    }
    
    // Paused: inactive sessions with evidence of prior play
    if (!session.isActive && 
        session.remainingSeconds > 0 && 
        (session.lastStartAt !== null || (session.accumulatedSeconds ?? 0) > 0)) {
      return SessionStatus.PAUSED;
    }
    
    // Default to paused for edge cases
    return SessionStatus.PAUSED;
  }

  private calcExpiry(session: {
    expiresAt: Date | null;
  }, addedSeconds: number): Date {
    const now = new Date();
    const baseTime = session.expiresAt && session.expiresAt.getTime() > now.getTime()
      ? session.expiresAt.getTime()
      : now.getTime();
    return new Date(baseTime + addedSeconds * 1000);
  }

  private async logAction(playerSessionId: string, action: SessionLogAction, data?: Prisma.InputJsonValue) {
    await prisma.sessionLog.create({ 
      data: { playerSessionId, action, data } 
    });
  }

  async getOrCreateSession(barcodeId: string): Promise<PlayerSession> {
    let session = await prisma.playerSession.findFirst({
      where: { barcodeId: { equals: barcodeId, mode: 'insensitive' } },
    });
    
    if (!session) {
      session = await prisma.playerSession.create({ data: { barcodeId } });
      await this.logAction(session.id, SessionLogAction.CHECKIN, { created: true });
    }
    
    return session;
  }

  async play(barcodeId: string): Promise<PlayerSession> {
    const session = await this.getOrCreateSession(barcodeId);
    const remaining = this.computeRemainingSeconds(session);
    
    if (remaining <= 0) {
      throw new Error('No remaining time');
    }
    
    if (session.isActive) {
      return session;
    }
    
    const updated = await prisma.playerSession.update({ 
      where: { id: session.id }, 
      data: { isActive: true, lastStartAt: new Date() } 
    });
    
    await this.logAction(updated.id, SessionLogAction.PLAY);
    
    // Emit Socket.IO event
    emitSessionEvent('session:play', { barcodeId, session: updated });
    
    return updated;
  }

  async pause(barcodeId: string): Promise<PlayerSession> {
    const session = await prisma.playerSession.findUnique({ where: { barcodeId } });
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (!session.isActive) {
      return session;
    }
    
    const now = new Date();
    const extra = session.lastStartAt 
      ? Math.floor((now.getTime() - session.lastStartAt.getTime()) / 1000) 
      : 0;
    
    const updated = await prisma.playerSession.update({
      where: { id: session.id },
      data: { 
        isActive: false, 
        lastStartAt: null, 
        accumulatedSeconds: { increment: extra } 
      },
    });
    
    await this.logAction(updated.id, SessionLogAction.PAUSE, { extra });
    
    // Emit Socket.IO event
    emitSessionEvent('session:pause', { barcodeId, session: updated });
    
    return updated;
  }

  async getStatus(barcodeId: string): Promise<SessionWithRemaining> {
    const session = await prisma.playerSession.findFirst({
      where: { barcodeId: { equals: barcodeId, mode: 'insensitive' } },
    });
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    let remainingSeconds = this.computeRemainingSeconds(session);
    let current = session;
    
    // Auto-pause if expired and still active
    if (session.isActive && remainingSeconds <= 0) {
      const extra = session.lastStartAt
        ? Math.max(0, Math.floor((new Date().getTime() - session.lastStartAt.getTime()) / 1000))
        : 0;

      current = await prisma.playerSession.update({ 
        where: { id: session.id }, 
        data: { 
          isActive: false, 
          lastStartAt: null, 
          accumulatedSeconds: { increment: extra },
        } 
      });
      await this.logAction(current.id, SessionLogAction.AUTO_EXPIRE);
      remainingSeconds = 0;
    }
    
    const status = this.computeSessionStatus({
      isActive: current.isActive,
      lastStartAt: current.lastStartAt,
      accumulatedSeconds: current.accumulatedSeconds,
      remainingSeconds
    });
    
    return { 
      ...current, 
      remainingSeconds, 
      remainingMinutes: Math.floor(remainingSeconds / 60),
      status
    };
  }

  async addTime(barcodeId: string, seconds: number): Promise<PlayerSession> {
    const session = await this.getOrCreateSession(barcodeId);
    
    const updated = await prisma.playerSession.update({
      where: { id: session.id },
      data: { totalAllowedSeconds: { increment: seconds } },
    });
    
    const expiresAt = this.calcExpiry(updated, seconds);
    const finalUpdated = await prisma.playerSession.update({ 
      where: { id: session.id }, 
      data: { expiresAt } 
    });
    
    await this.logAction(finalUpdated.id, SessionLogAction.TIME_ADDED, { totalSecondsToAdd: seconds });
    
    // Emit Socket.IO event
    emitSessionEvent('session:updated', { barcodeId, session: finalUpdated });
    
    return finalUpdated;
  }

  async getAllActive(): Promise<SessionWithRemaining[]> {
    const now = new Date();
    const { startUtc, endUtc } = await getOperationalContext(now);
    const sessions = await prisma.playerSession.findMany({
      where: {
        createdAt: {
          gte: startUtc,
          lt: endUtc,
        },
        expiresAt: {
          gt: now,
        },
      },
    });
    
    return sessions
      .map((session) => {
        const remainingSeconds = this.computeRemainingSeconds(session);
        const status = this.computeSessionStatus({
          isActive: session.isActive,
          lastStartAt: session.lastStartAt,
          accumulatedSeconds: session.accumulatedSeconds,
          remainingSeconds
        });
        return { 
          ...session, 
          remainingSeconds, 
          remainingMinutes: Math.floor(remainingSeconds / 60),
          status
        };
      })
      .filter((session) => session.remainingSeconds > 0);
  }
}

export const playerSessionService = new PlayerSessionService();
