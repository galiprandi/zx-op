import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SystemService {
  async getSettings() {
    const setting = await prisma.systemSetting.findUnique({ where: { id: 'system' } });
    if (setting) return setting;
    return prisma.systemSetting.create({ data: { id: 'system', maxOccupancy: 100 } });
  }

  async updateSettings(maxOccupancy?: number, siteName?: string, logoUrl?: string | null) {
    const updateData: {
      maxOccupancy?: number;
      siteName?: string;
      logoUrl?: string | null;
    } = {};
    
    if (maxOccupancy !== undefined) {
      const parsed = Number(maxOccupancy);
      if (!Number.isFinite(parsed)) {
        throw new Error('maxOccupancy must be a number');
      }
      updateData.maxOccupancy = parsed;
    }
    
    if (siteName !== undefined) {
      if (typeof siteName !== 'string' || siteName.trim() === '') {
        throw new Error('siteName must be a non-empty string');
      }
      updateData.siteName = siteName.trim();
    }
    
    if (logoUrl !== undefined) {
      if (logoUrl !== null && logoUrl !== '') {
        // Basic URL validation
        try {
          new URL(logoUrl);
          updateData.logoUrl = logoUrl;
        } catch {
          throw new Error('logoUrl must be a valid URL or null');
        }
      } else {
        updateData.logoUrl = null;
      }
    }

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'system' },
      update: updateData,
      create: { 
        id: 'system', 
        maxOccupancy: updateData.maxOccupancy || 100,
        siteName: updateData.siteName || 'Zona Xtreme',
        logoUrl: updateData.logoUrl || null
      },
    });

    return updated;
  }
}

export const systemService = new SystemService();
