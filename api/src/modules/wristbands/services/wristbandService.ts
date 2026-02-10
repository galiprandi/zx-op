import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

export class WristbandService {
  constructor(
    private prisma: PrismaClient,
    private io: SocketIOServer
  ) {}

  async getAllWristbands() {
    return await this.prisma.wristband.findMany({
      include: {
        user: true,
        sessions: {
          where: { status: { in: ['ACTIVE', 'PAUSED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async createWristband(qrCode: string, userId?: string) {
    const data: any = { qrCode };
    if (userId !== undefined && userId !== null) {
      data.userId = userId;
    }

    const wristband = await this.prisma.wristband.create({
      data,
      include: {
        user: true,
        sessions: true,
      },
    });

    this.io.emit('wristband:created', wristband);
    return wristband;
  }

  async updateWristband(id: string, userId?: string) {
    const wristband = await this.prisma.wristband.update({
      where: { id },
      data: { userId },
      include: {
        user: true,
        sessions: true,
      },
    });

    this.io.emit('wristband:updated', wristband);
    return wristband;
  }

  async deleteWristband(id: string) {
    const wristband = await this.prisma.wristband.delete({
      where: { id },
      include: {
        user: true,
        sessions: true,
      },
    });

    this.io.emit('wristband:deleted', wristband);
    return wristband;
  }

  async findByQrCode(qrCode: string) {
    return await this.prisma.wristband.findUnique({
      where: { qrCode },
    });
  }
}
