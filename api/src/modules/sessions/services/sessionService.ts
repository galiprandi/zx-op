import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

export class SessionService {
  constructor(
    private prisma: PrismaClient,
    private io: SocketIOServer
  ) {}

  async getAllSessions() {
    return await this.prisma.session.findMany({
      include: {
        wristband: true,
        events: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSession(wristbandId: string, purchasedMinutes: number) {
    const session = await this.prisma.session.create({
      data: {
        wristbandId,
        purchasedMinutes,
        status: 'IDLE',
      },
      include: {
        wristband: true,
        events: true,
      },
    });

    this.io.emit('session:created', session);
    return session;
  }

  async startSession(id: string) {
    const session = await this.prisma.session.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startTime: new Date(),
      },
      include: {
        wristband: true,
        events: true,
      },
    });

    this.io.emit('session:started', session);
    return session;
  }

  async pauseSession(id: string) {
    const session = await this.prisma.session.update({
      where: { id },
      data: {
        status: 'PAUSED',
        lastPauseTime: new Date(),
      },
      include: {
        wristband: true,
        events: true,
      },
    });

    this.io.emit('session:paused', session);
    return session;
  }

  async endSession(id: string) {
    const session = await this.prisma.session.update({
      where: { id },
      data: {
        status: 'ENDED',
        endTime: new Date(),
      },
      include: {
        wristband: true,
        events: true,
      },
    });

    this.io.emit('session:ended', session);
    return session;
  }

  async deleteSession(id: string) {
    const session = await this.prisma.session.delete({
      where: { id },
      include: {
        wristband: true,
        events: true,
      },
    });

    this.io.emit('session:deleted', session);
    return session;
  }

  async findActiveSessionByWristband(wristbandId: string) {
    return await this.prisma.session.findFirst({
      where: {
        wristbandId,
        status: { in: ['IDLE', 'ACTIVE', 'PAUSED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveSessionByQrCode(qrCode: string) {
    // First find the wristband by QR code
    const wristband = await this.prisma.wristband.findUnique({
      where: { qrCode },
    });

    if (!wristband) {
      throw new Error('Wristband not found');
    }

    const session = await this.findActiveSessionByWristband(wristband.id);

    if (!session) {
      throw new Error('No active session found for this wristband');
    }

    // Compute remaining time
    const now = new Date();
    let elapsedSeconds = 0;

    if (session.startTime) {
      elapsedSeconds = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);

      // Subtract paused time
      if (session.status === 'PAUSED' && session.lastPauseTime) {
        // Paused time is from lastPauseTime to now, but since it's paused, elapsed is up to pause
        // Actually, need to track total paused time, but for simplicity, assume single pause
        const pauseStart = session.lastPauseTime.getTime();
        elapsedSeconds = Math.floor((pauseStart - session.startTime.getTime()) / 1000);
      }
    }

    const totalPurchasedSeconds = session.purchasedMinutes * 60;
    const remainingSeconds = Math.max(0, totalPurchasedSeconds - elapsedSeconds);

    return {
      ...session,
      remainingMinutes: Math.floor(remainingSeconds / 60),
      remainingSeconds: remainingSeconds % 60,
      wristband,
    };
  }
}
