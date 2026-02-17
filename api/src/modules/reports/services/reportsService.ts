import { PrismaClient } from '@prisma/client';
import { getOperationalDayRange } from '../../dashboard/services/operationalDay';

const prisma = new PrismaClient();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface RecentOperationalDaySales {
  operationalDate: string;
  occupancyPct: number;
  sessionCount: number;
  totalTimeSeconds: number;
  timeRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
}

export interface ReportsSummaryResponse {
  topKpis: {
    operationalRevenue: number;
    soldMinutes: number;
    occupancyPct: number;
  };
  salesPeriods: {
    last7OperationalDays: number;
    last30OperationalDays: number;
    lifetime: number;
    weekOverWeekPct: number | null;
    monthOverMonthPct: number | null;
  };
  recentOperationalDaySales: RecentOperationalDaySales[];
}

interface ReportsContext {
  startUtc: Date;
  maxOccupancy: number;
  timezone: string;
}

async function getReportsContext(now: Date = new Date()): Promise<ReportsContext> {
  const settings = await prisma.systemSetting.findUnique({ where: { id: 'system' } });
  const timezone = settings?.timezone || 'America/Argentina/Tucuman';
  const operationalDayStart = settings?.operationalDayStart || '07:00';
  const maxOccupancy = settings?.maxOccupancy || 100;

  const { startUtc } = getOperationalDayRange(now, timezone, operationalDayStart);
  return { startUtc, maxOccupancy, timezone };
}

async function getRevenueBetween(start: Date, end: Date): Promise<number> {
  const revenue = await prisma.transaction.aggregate({
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      totalPrice: true,
    },
  });

  return Number(revenue._sum.totalPrice || 0);
}

function calculateComparisonPct(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function formatOperationalDate(startUtc: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(startUtc);
}

async function getOperationalDaySales(
  windowStart: Date,
  windowEnd: Date,
  timezone: string,
  maxOccupancy: number,
): Promise<RecentOperationalDaySales | null> {
  const txs = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: windowStart,
        lt: windowEnd,
      },
    },
    select: {
      playerSessionId: true,
      quantity: true,
      totalPrice: true,
      product: {
        select: {
          timeValueSeconds: true,
        },
      },
    },
  });

  if (txs.length === 0) {
    return null;
  }

  const sessions = new Set<string>();
  let totalTimeSeconds = 0;
  let timeRevenue = 0;
  let otherRevenue = 0;

  for (const tx of txs) {
    sessions.add(tx.playerSessionId);
    const isTimeProduct = tx.product.timeValueSeconds !== null;

    if (isTimeProduct) {
      totalTimeSeconds += (tx.product.timeValueSeconds || 0) * tx.quantity;
      timeRevenue += tx.totalPrice;
    } else {
      otherRevenue += tx.totalPrice;
    }
  }

  const totalRevenue = timeRevenue + otherRevenue;
  const dayCapacitySeconds = Math.max(1, maxOccupancy) * ONE_DAY_MS / 1000;
  const occupancyPct = Number(Math.min(100, (totalTimeSeconds / dayCapacitySeconds) * 100).toFixed(2));

  return {
    operationalDate: formatOperationalDate(windowStart, timezone),
    occupancyPct,
    sessionCount: sessions.size,
    totalTimeSeconds,
    timeRevenue: Number(timeRevenue.toFixed(2)),
    otherRevenue: Number(otherRevenue.toFixed(2)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
  };
}

async function getRecentOperationalDaySales(
  closedDayStartUtc: Date,
  timezone: string,
  maxOccupancy: number,
): Promise<RecentOperationalDaySales[]> {
  const windows = Array.from({ length: 10 }).map((_, index) => {
    const windowStart = new Date(closedDayStartUtc.getTime() - index * ONE_DAY_MS);
    const windowEnd = new Date(windowStart.getTime() + ONE_DAY_MS);
    return { windowStart, windowEnd };
  });

  const rows = await Promise.all(
    windows.map(({ windowStart, windowEnd }) =>
      getOperationalDaySales(windowStart, windowEnd, timezone, maxOccupancy),
    ),
  );

  return rows.filter((row): row is RecentOperationalDaySales => row !== null);
}

export async function getReportsSummary(): Promise<ReportsSummaryResponse> {
  const { startUtc, maxOccupancy, timezone } = await getReportsContext();

  // Reports must use closed operational days only.
  const closedDayEndUtc = startUtc;
  const closedDayStartUtc = new Date(startUtc.getTime() - ONE_DAY_MS);

  const [
    closedDayStats,
    recentOperationalDaySales,
    last7OperationalDays,
    prev7OperationalDays,
    last30OperationalDays,
    prev30OperationalDays,
    lifetimeRevenue,
  ] = await Promise.all([
    getOperationalDaySales(closedDayStartUtc, closedDayEndUtc, timezone, maxOccupancy),
    getRecentOperationalDaySales(closedDayStartUtc, timezone, maxOccupancy),
    getRevenueBetween(new Date(closedDayEndUtc.getTime() - 7 * ONE_DAY_MS), closedDayEndUtc),
    getRevenueBetween(new Date(closedDayEndUtc.getTime() - 14 * ONE_DAY_MS), new Date(closedDayEndUtc.getTime() - 7 * ONE_DAY_MS)),
    getRevenueBetween(new Date(closedDayEndUtc.getTime() - 30 * ONE_DAY_MS), closedDayEndUtc),
    getRevenueBetween(new Date(closedDayEndUtc.getTime() - 60 * ONE_DAY_MS), new Date(closedDayEndUtc.getTime() - 30 * ONE_DAY_MS)),
    getRevenueBetween(new Date(0), closedDayEndUtc),
  ]);

  return {
    topKpis: {
      operationalRevenue: Number((closedDayStats?.totalRevenue || 0).toFixed(2)),
      soldMinutes: Math.round((closedDayStats?.totalTimeSeconds || 0) / 60),
      occupancyPct: Number((closedDayStats?.occupancyPct || 0).toFixed(2)),
    },
    salesPeriods: {
      last7OperationalDays: Number(last7OperationalDays.toFixed(2)),
      last30OperationalDays: Number(last30OperationalDays.toFixed(2)),
      lifetime: Number(lifetimeRevenue.toFixed(2)),
      weekOverWeekPct: calculateComparisonPct(last7OperationalDays, prev7OperationalDays),
      monthOverMonthPct: calculateComparisonPct(last30OperationalDays, prev30OperationalDays),
    },
    recentOperationalDaySales,
  };
}
