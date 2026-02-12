import { PrismaClient, LogAction, PlayerSession, Prisma } from '@prisma/client';
import { emitSessionEvent } from './socketService';

const prisma = new PrismaClient();

export type SessionWithRemaining = PlayerSession & {
  remainingSeconds: number;
  remainingMinutes: number;
};

export class PlayerSessionService {
  private computeRemainingSeconds(session: {
    totalAllowedSeconds: number;
    accumulatedSeconds: number;
    isActive: boolean;
    lastStartAt: Date | null;
  }): number {
    const now = new Date();
    const running = session.isActive && session.lastStartAt 
      ? Math.floor((now.getTime() - session.lastStartAt.getTime()) / 1000) 
      : 0;
    const consumed = session.accumulatedSeconds + running;
    return Math.max(0, session.totalAllowedSeconds - consumed);
  }

  private calcExpiry(session: {
    totalAllowedSeconds: number;
    accumulatedSeconds: number;
    isActive: boolean;
    lastStartAt: Date | null;
  }): Date {
    const remaining = this.computeRemainingSeconds(session);
    const now = new Date();
    return remaining > 0 ? new Date(now.getTime() + remaining * 1000) : now;
  }

  private async logAction(playerSessionId: string, action: LogAction, data?: Prisma.InputJsonValue) {
    await prisma.sessionLog.create({ 
      data: { playerSessionId, action, data } 
    });
  }

  async getOrCreateSession(barcodeId: string): Promise<PlayerSession> {
    let session = await prisma.playerSession.findUnique({ where: { barcodeId } });
    
    if (!session) {
      session = await prisma.playerSession.create({ data: { barcodeId } });
      await this.logAction(session.id, LogAction.CHECKIN, { created: true });
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
    
    await this.logAction(updated.id, LogAction.PLAY);
    
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
    
    await this.logAction(updated.id, LogAction.PAUSE, { extra });
    
    // Emit Socket.IO event
    emitSessionEvent('session:pause', { barcodeId, session: updated });
    
    return updated;
  }

  async getStatus(barcodeId: string): Promise<SessionWithRemaining> {
    const session = await prisma.playerSession.findUnique({ where: { barcodeId } });
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    let remainingSeconds = this.computeRemainingSeconds(session);
    let current = session;
    
    // Auto-pause if expired and still active
    if (session.isActive && remainingSeconds <= 0) {
      current = await prisma.playerSession.update({ 
        where: { id: session.id }, 
        data: { 
          isActive: false, 
          lastStartAt: null, 
          accumulatedSeconds: session.accumulatedSeconds + remainingSeconds 
        } 
      });
      await this.logAction(current.id, LogAction.AUTO_EXPIRE);
      remainingSeconds = 0;
    }
    
    return { 
      ...current, 
      remainingSeconds, 
      remainingMinutes: Math.floor(remainingSeconds / 60) 
    };
  }

  async addTime(barcodeId: string, seconds: number): Promise<PlayerSession> {
    const session = await this.getOrCreateSession(barcodeId);
    
    const updated = await prisma.playerSession.update({
      where: { id: session.id },
      data: { totalAllowedSeconds: { increment: seconds } },
    });
    
    const expiresAt = this.calcExpiry(updated);
    const finalUpdated = await prisma.playerSession.update({ 
      where: { id: session.id }, 
      data: { expiresAt } 
    });
    
    await this.logAction(finalUpdated.id, LogAction.TIME_ADDED, { totalSecondsToAdd: seconds });
    
    // Emit Socket.IO event
    emitSessionEvent('session:updated', { barcodeId, session: finalUpdated });
    
    return finalUpdated;
  }

  async getAllActive(): Promise<SessionWithRemaining[]> {
    const sessions = await prisma.playerSession.findMany();
    
    return sessions
      .map((session) => {
        const remainingSeconds = this.computeRemainingSeconds(session);
        return { 
          ...session, 
          remainingSeconds, 
          remainingMinutes: Math.floor(remainingSeconds / 60) 
        };
      })
      .filter((session) => session.remainingSeconds > 0);
  }
}

export const playerSessionService = new PlayerSessionService();
