import { PrismaClient } from '@prisma/client';
import { getOperationalDayRange } from '../../dashboard/services/operationalDay';

const prisma = new PrismaClient();

const DEFAULT_TIMEZONE = 'America/Argentina/Tucuman';
const DEFAULT_OPERATIONAL_DAY_START = '07:00';
const DEFAULT_MAX_OCCUPANCY = 100;

export interface OperationalContext {
  startUtc: Date;
  endUtc: Date;
  timezone: string;
  operationalDayStart: string;
  maxOccupancy: number;
}

export async function getOperationalContext(now: Date = new Date()): Promise<OperationalContext> {
  const settings = await prisma.systemSetting.findUnique({ where: { id: 'system' } });
  const timezone = settings?.timezone || DEFAULT_TIMEZONE;
  const operationalDayStart = settings?.operationalDayStart || DEFAULT_OPERATIONAL_DAY_START;
  const maxOccupancy = settings?.maxOccupancy || DEFAULT_MAX_OCCUPANCY;
  const { startUtc, endUtc } = getOperationalDayRange(now, timezone, operationalDayStart);

  return {
    startUtc,
    endUtc,
    timezone,
    operationalDayStart,
    maxOccupancy,
  };
}
