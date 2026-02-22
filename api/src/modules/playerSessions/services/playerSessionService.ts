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
  LAP: 'LAP',
} as const;
type SessionLogAction = (typeof SessionLogAction)[keyof typeof SessionLogAction];

export type SessionWithRemaining = PlayerSession & {
  remainingSeconds: number;
  remainingMinutes: number;
  status: SessionStatus;
  avgSecondsPerLap: number | null;
};

export class PlayerSessionService {
  private computeConsumedSeconds(session: {
    accumulatedSeconds: number | null | undefined;
    isActive: boolean;
    lastStartAt: Date | null;
  }): number {
    const now = new Date();
    const running = session.isActive && session.lastStartAt
      ? Math.floor((now.getTime() - session.lastStartAt.getTime()) / 1000)
      : 0;
    return Math.max(0, (session.accumulatedSeconds ?? 0) + running);
  }

  private computeRemainingSeconds(session: {
    totalAllowedSeconds: number | null | undefined;
    accumulatedSeconds: number | null | undefined;
    isActive: boolean;
    lastStartAt: Date | null;
  }): number {
    const totalAllowed = session.totalAllowedSeconds ?? 0;
    const consumed = this.computeConsumedSeconds(session);
    const remaining = totalAllowed - consumed;
    return Math.max(0, Number.isFinite(remaining) ? remaining : 0);
  }

  private computeAvgSecondsPerLap(session: {
    lapsCount: number | null | undefined;
    accumulatedSeconds: number | null | undefined;
    isActive: boolean;
    lastStartAt: Date | null;
  }): number | null {
    const lapsCount = session.lapsCount ?? 0;
    if (lapsCount <= 0) {
      return null;
    }

    const consumed = this.computeConsumedSeconds(session);
    return Math.max(1, Math.round(consumed / lapsCount));
  }

  private computeSessionStatus(session: {
    isActive: boolean;
    lastStartAt: Date | null;
    accumulatedSeconds: number | null | undefined;
    remainingSeconds: number;
  }): SessionStatus {
    if (!session.isActive &&
        session.lastStartAt === null &&
        (session.accumulatedSeconds ?? 0) === 0 &&
        session.remainingSeconds > 0) {
      return SessionStatus.WAITING;
    }

    if (session.isActive && session.remainingSeconds > 0) {
      return SessionStatus.PLAYING;
    }

    if (!session.isActive &&
        session.remainingSeconds > 0 &&
        (session.lastStartAt !== null || (session.accumulatedSeconds ?? 0) > 0)) {
      return SessionStatus.PAUSED;
    }

    return SessionStatus.PAUSED;
  }

  private async buildSessionWithRemaining(session: PlayerSession): Promise<SessionWithRemaining> {
    const remainingSeconds = this.computeRemainingSeconds(session);
    const status = this.computeSessionStatus({
      isActive: session.isActive,
      lastStartAt: session.lastStartAt,
      accumulatedSeconds: session.accumulatedSeconds,
      remainingSeconds,
    });

    return {
      ...session,
      remainingSeconds,
      remainingMinutes: Math.floor(remainingSeconds / 60),
      status,
      avgSecondsPerLap: this.computeAvgSecondsPerLap(session),
    };
  }

  private async logAction(playerSessionId: string, action: SessionLogAction, data?: Prisma.InputJsonValue) {
    await prisma.sessionLog.create({
      data: { playerSessionId, action, data },
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

  async play(barcodeId: string): Promise<SessionWithRemaining> {
    const session = await this.getOrCreateSession(barcodeId);
    const remaining = this.computeRemainingSeconds(session);

    if (remaining <= 0) {
      throw new Error('No remaining time');
    }

    const updated = session.isActive
      ? session
      : await prisma.playerSession.update({
          where: { id: session.id },
          data: { isActive: true, lastStartAt: new Date() },
        });

    if (!session.isActive) {
      await this.logAction(updated.id, SessionLogAction.PLAY);
    }

    const playerSession = await this.buildSessionWithRemaining(updated);
    emitSessionEvent('session:play', { barcodeId, playerSession });

    return playerSession;
  }

  async pause(barcodeId: string): Promise<SessionWithRemaining> {
    const session = await prisma.playerSession.findFirst({
      where: { barcodeId: { equals: barcodeId, mode: 'insensitive' } },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.isActive) {
      return this.buildSessionWithRemaining(session);
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
        accumulatedSeconds: { increment: extra },
      },
    });

    await this.logAction(updated.id, SessionLogAction.PAUSE, { extra });

    const playerSession = await this.buildSessionWithRemaining(updated);
    emitSessionEvent('session:pause', { barcodeId, playerSession });

    return playerSession;
  }

  async getStatus(barcodeId: string): Promise<SessionWithRemaining> {
    const session = await prisma.playerSession.findFirst({
      where: { barcodeId: { equals: barcodeId, mode: 'insensitive' } },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const remainingSeconds = this.computeRemainingSeconds(session);
    let current = session;

    if (session.isActive && remainingSeconds <= 0) {
      const settings = await prisma.systemSetting.findUnique({ where: { id: 'system' } });
      const graceMinutes = Math.max(0, settings?.autoExpireGraceMinutes ?? 5);
      const graceSeconds = graceMinutes * 60;
      const consumed = this.computeConsumedSeconds(session);
      const overrunSeconds = Math.max(0, consumed - (session.totalAllowedSeconds ?? 0));

      if (overrunSeconds < graceSeconds) {
        return this.buildSessionWithRemaining(current);
      }

      const extra = session.lastStartAt
        ? Math.max(0, Math.floor((new Date().getTime() - session.lastStartAt.getTime()) / 1000))
        : 0;

      current = await prisma.playerSession.update({
        where: { id: session.id },
        data: {
          isActive: false,
          lastStartAt: null,
          accumulatedSeconds: { increment: extra },
        },
      });

      await this.logAction(current.id, SessionLogAction.AUTO_EXPIRE);
    }

    return this.buildSessionWithRemaining(current);
  }

  async addTime(barcodeId: string, seconds: number): Promise<SessionWithRemaining> {
    const session = await this.getOrCreateSession(barcodeId);

    const updated = await prisma.playerSession.update({
      where: { id: session.id },
      data: { totalAllowedSeconds: { increment: seconds } },
    });

    await this.logAction(updated.id, SessionLogAction.TIME_ADDED, { totalSecondsToAdd: seconds });

    const playerSession = await this.buildSessionWithRemaining(updated);
    emitSessionEvent('session:updated', { barcodeId, playerSession });

    return playerSession;
  }

  async registerLap(barcodeId: string): Promise<SessionWithRemaining> {
    const session = await prisma.playerSession.findFirst({
      where: { barcodeId: { equals: barcodeId, mode: 'insensitive' } },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const remainingSeconds = this.computeRemainingSeconds(session);
    if (!session.isActive || remainingSeconds <= 0) {
      throw new Error('Lap can only be registered while session is active with remaining time');
    }

    const updated = await prisma.playerSession.update({
      where: { id: session.id },
      data: { lapsCount: { increment: 1 } },
    });

    await this.logAction(updated.id, SessionLogAction.LAP, { lapsCount: updated.lapsCount });

    const playerSession = await this.buildSessionWithRemaining(updated);
    emitSessionEvent('session:lap', { barcodeId, playerSession });
    emitSessionEvent('session:updated', { barcodeId, playerSession });

    return playerSession;
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
      },
    });

    const withRemaining = await Promise.all(sessions.map((session) => this.buildSessionWithRemaining(session)));

    return withRemaining.filter((session) => session.remainingSeconds > 0);
  }
}

export const playerSessionService = new PlayerSessionService();
