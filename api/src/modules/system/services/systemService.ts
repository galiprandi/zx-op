import { PrismaClient } from '@prisma/client';
import { isValidTimeZone, parseOperationalDayStart } from '../../dashboard/services/operationalDay';

const prisma = new PrismaClient();

function isValidLogoReference(value: string): boolean {
  if (value.startsWith('/')) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'data:';
  } catch {
    return false;
  }
}

export class SystemService {
  async getSettings() {
    const setting = await prisma.systemSetting.findUnique({ where: { id: 'system' } });
    if (setting) return setting;
    return prisma.systemSetting.create({
      data: {
        id: 'system',
        maxOccupancy: 100,
        operationalDayStart: '07:00',
        timezone: 'America/Argentina/Tucuman',
      },
    });
  }

  async updateSettings(
    maxOccupancy?: number,
    siteName?: string,
    logoUrl?: string | null,
    operationalDayStart?: string,
    timezone?: string,
    autoExpireGraceMinutes?: number,
  ) {
    const updateData: {
      maxOccupancy?: number;
      siteName?: string;
      logoUrl?: string | null;
      operationalDayStart?: string;
      timezone?: string;
      autoExpireGraceMinutes?: number;
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
        if (!isValidLogoReference(logoUrl)) {
          throw new Error('logoUrl must be an http(s) URL, data URL, root-relative path, or null');
        }

        updateData.logoUrl = logoUrl;
      } else {
        updateData.logoUrl = null;
      }
    }

    if (operationalDayStart !== undefined) {
      parseOperationalDayStart(operationalDayStart);
      updateData.operationalDayStart = operationalDayStart;
    }

    if (timezone !== undefined) {
      if (!isValidTimeZone(timezone)) {
        throw new Error('timezone must be a valid IANA timezone');
      }
      updateData.timezone = timezone;
    }

    if (autoExpireGraceMinutes !== undefined) {
      const parsed = Number(autoExpireGraceMinutes);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error('autoExpireGraceMinutes must be an integer >= 0');
      }
      updateData.autoExpireGraceMinutes = parsed;
    }

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'system' },
      update: updateData,
      create: { 
        id: 'system', 
        maxOccupancy: updateData.maxOccupancy || 100,
        siteName: updateData.siteName || 'Zona Xtreme',
        logoUrl: updateData.logoUrl || null,
        operationalDayStart: updateData.operationalDayStart || '07:00',
        timezone: updateData.timezone || 'America/Argentina/Tucuman',
        autoExpireGraceMinutes: updateData.autoExpireGraceMinutes ?? 5,
      },
    });

    return updated;
  }
}

export const systemService = new SystemService();
