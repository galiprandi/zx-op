import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SystemService {
  async getSettings() {
    const setting = await prisma.systemSetting.findUnique({ where: { id: 'system' } });
    if (setting) return setting;
    return prisma.systemSetting.create({ data: { id: 'system', maxOccupancy: 100 } });
  }

  async updateSettings(maxOccupancy?: number) {
    const parsed = Number(maxOccupancy);
    if (!Number.isFinite(parsed)) {
      throw new Error('maxOccupancy must be a number');
    }

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'system' },
      update: { maxOccupancy: parsed },
      create: { id: 'system', maxOccupancy: parsed },
    });

    return updated;
  }
}

export const systemService = new SystemService();
