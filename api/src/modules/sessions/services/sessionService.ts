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
}
