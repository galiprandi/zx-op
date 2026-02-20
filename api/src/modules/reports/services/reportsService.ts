import { Prisma, PrismaClient } from '@prisma/client';
import { getOperationalDayRange } from '../../dashboard/services/operationalDay';

const prisma = new PrismaClient();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface RecentOperationalDaySales {
  operationalDate: string;
  occupancyPct: number;
  sessionCount: number;
  totalTimeSeconds: number;
  averageSecondsPerLap: number | null;
  totalLaps: number;
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

export interface OperationalDayListItem {
  operationalDateKey: string;
  operationalDateLabel: string;
  occupancyPct: number;
  sessionCount: number;
  totalTimeSeconds: number;
  averageSecondsPerLap: number | null;
  totalLaps: number;
  timeRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
}

export interface OperationalDaysPageResponse {
  items: OperationalDayListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OperationalDayTopProduct {
  productId: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface OperationalDayDetailResponse {
  operationalDateKey: string;
  operationalDateLabel: string;
  operationalWindow: {
    startTimeLabel: string;
    endTimeLabel: string;
  };
  revenue: {
    timeRevenue: number;
    otherRevenue: number;
    totalRevenue: number;
  };
  operations: {
    soldMinutes: number;
    occupancyPct: number;
    sessionCount: number;
    totalTimeSeconds: number;
    totalLaps: number;
    averageSecondsPerLap: number | null;
  };
  topProducts: OperationalDayTopProduct[];
}

function formatOperationalTime(date: Date, timezone: string): string {
  const time = new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${time}hs`;
}

interface ReportsContext {
  startUtc: Date;
  maxOccupancy: number;
  timezone: string;
  operationalDayStart: string;
}

class ReportsNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportsNotFoundError';
  }
}

interface ParsedOperationalStart {
  hours: number;
  minutes: number;
}

interface DailyAggregateRow {
  operationalDateKey: string;
  operationalDateLabel: string;
  sessionCount: number;
  totalTimeSeconds: number;
  timeRevenue: number;
  otherRevenue: number;
  totalLaps: number;
  totalLapSeconds: number;
}

function parseOperationalDayStart(value: string): ParsedOperationalStart {
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value);
  if (!match) {
    return { hours: 7, minutes: 0 };
  }

  const [hoursText, minutesText] = value.split(':');
  return {
    hours: Number(hoursText),
    minutes: Number(minutesText),
  };
}

function getOperationalDateKey(startUtc: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(startUtc);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Failed to derive operational date key');
  }

  return `${year}-${month}-${day}`;
}

async function getReportsContext(now: Date = new Date()): Promise<ReportsContext> {
  const settings = await prisma.systemSetting.findUnique({ where: { id: 'system' } });
  const timezone = settings?.timezone || 'America/Argentina/Tucuman';
  const operationalDayStart = settings?.operationalDayStart || '07:00';
  const maxOccupancy = settings?.maxOccupancy || 100;

  const { startUtc } = getOperationalDayRange(now, timezone, operationalDayStart);
  return { startUtc, maxOccupancy, timezone, operationalDayStart };
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

function toAggregateSql(tableAlias: 't' | 's', timezone: string, start: ParsedOperationalStart): Prisma.Sql {
  const shiftMinutes = start.hours * 60 + start.minutes;
  return Prisma.sql`(((${Prisma.raw(`"${tableAlias}"."createdAt"`)} AT TIME ZONE ${timezone}) - (${shiftMinutes} * interval '1 minute'))::date)`;
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

  const sessionsWithLaps = await prisma.playerSession.findMany({
    where: {
      createdAt: {
        gte: windowStart,
        lt: windowEnd,
      },
      lapsCount: {
        gt: 0,
      },
    },
    select: {
      lapsCount: true,
      accumulatedSeconds: true,
    },
  });

  const sessions = new Set<string>();
  let totalTimeSeconds = 0;
  let totalLaps = 0;
  let totalLapSeconds = 0;
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
  for (const session of sessionsWithLaps) {
    totalLaps += session.lapsCount;
    totalLapSeconds += session.accumulatedSeconds || 0;
  }
  const dayCapacitySeconds = Math.max(1, maxOccupancy) * ONE_DAY_MS / 1000;
  const occupancyPct = Number(Math.min(100, (totalTimeSeconds / dayCapacitySeconds) * 100).toFixed(2));

  return {
    operationalDate: formatOperationalDate(windowStart, timezone),
    occupancyPct,
    sessionCount: sessions.size,
    totalTimeSeconds,
    averageSecondsPerLap: totalLaps > 0 ? Math.round(totalLapSeconds / totalLaps) : null,
    totalLaps,
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

async function getDailyAggregates(
  timezone: string,
  operationalDayStart: string,
  currentOperationalDateKey: string,
  limit: number,
  offset: number,
): Promise<DailyAggregateRow[]> {
  const parsedStart = parseOperationalDayStart(operationalDayStart);
  const txOperationalDateExpr = toAggregateSql('t', timezone, parsedStart);
  const sessionOperationalDateExpr = toAggregateSql('s', timezone, parsedStart);

  const rows = await prisma.$queryRaw<DailyAggregateRow[]>`
    WITH tx_by_day AS (
      SELECT
        ${txOperationalDateExpr} AS operational_date,
        COUNT(DISTINCT t."playerSessionId")::int AS "sessionCount",
        COALESCE(SUM(CASE WHEN p."timeValueSeconds" IS NOT NULL THEN p."timeValueSeconds" * t."quantity" ELSE 0 END), 0)::int AS "totalTimeSeconds",
        COALESCE(SUM(CASE WHEN p."timeValueSeconds" IS NOT NULL THEN t."totalPrice" ELSE 0 END), 0)::float AS "timeRevenue",
        COALESCE(SUM(CASE WHEN p."timeValueSeconds" IS NULL THEN t."totalPrice" ELSE 0 END), 0)::float AS "otherRevenue"
      FROM "Transaction" t
      INNER JOIN "Product" p ON p."id" = t."productId"
      GROUP BY operational_date
    ),
    laps_by_day AS (
      SELECT
        ${sessionOperationalDateExpr} AS operational_date,
        COALESCE(SUM(s."lapsCount"), 0)::int AS "totalLaps",
        COALESCE(SUM(COALESCE(s."accumulatedSeconds", 0)), 0)::int AS "totalLapSeconds"
      FROM "PlayerSession" s
      WHERE s."lapsCount" > 0
      GROUP BY operational_date
    )
    SELECT
      to_char(tx.operational_date, 'YYYY-MM-DD') AS "operationalDateKey",
      to_char(tx.operational_date, 'DD/MM/YYYY') AS "operationalDateLabel",
      tx."sessionCount",
      tx."totalTimeSeconds",
      tx."timeRevenue",
      tx."otherRevenue",
      COALESCE(laps."totalLaps", 0)::int AS "totalLaps",
      COALESCE(laps."totalLapSeconds", 0)::int AS "totalLapSeconds"
    FROM tx_by_day tx
    LEFT JOIN laps_by_day laps ON laps.operational_date = tx.operational_date
    WHERE tx.operational_date < ${currentOperationalDateKey}::date
    ORDER BY tx.operational_date DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return rows;
}

async function getClosedOperationalDaysCount(
  timezone: string,
  operationalDayStart: string,
  currentOperationalDateKey: string,
): Promise<number> {
  const parsedStart = parseOperationalDayStart(operationalDayStart);
  const txOperationalDateExpr = toAggregateSql('t', timezone, parsedStart);

  const countRows = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
    SELECT COUNT(*) AS count
    FROM (
      SELECT ${txOperationalDateExpr} AS operational_date
      FROM "Transaction" t
      GROUP BY operational_date
    ) tx_days
    WHERE tx_days.operational_date < ${currentOperationalDateKey}::date
  `;

  const rawCount = countRows[0]?.count || 0;
  return Number(rawCount);
}

export async function getOperationalDaysPage(params: { page?: number; pageSize?: number }): Promise<OperationalDaysPageResponse> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize || 15));
  const offset = (page - 1) * pageSize;

  const { startUtc, maxOccupancy, timezone, operationalDayStart } = await getReportsContext();
  const currentOperationalDateKey = getOperationalDateKey(startUtc, timezone);

  const [totalItems, rows] = await Promise.all([
    getClosedOperationalDaysCount(timezone, operationalDayStart, currentOperationalDateKey),
    getDailyAggregates(timezone, operationalDayStart, currentOperationalDateKey, pageSize, offset),
  ]);

  const dayCapacitySeconds = Math.max(1, maxOccupancy) * ONE_DAY_MS / 1000;
  const items = rows.map((row) => {
    const totalRevenue = row.timeRevenue + row.otherRevenue;
    const occupancyPct = Number(Math.min(100, (row.totalTimeSeconds / dayCapacitySeconds) * 100).toFixed(2));

    return {
      operationalDateKey: row.operationalDateKey,
      operationalDateLabel: row.operationalDateLabel,
      occupancyPct,
      sessionCount: row.sessionCount,
      totalTimeSeconds: row.totalTimeSeconds,
      averageSecondsPerLap: row.totalLaps > 0 ? Math.round(row.totalLapSeconds / row.totalLaps) : null,
      totalLaps: row.totalLaps,
      timeRevenue: Number(row.timeRevenue.toFixed(2)),
      otherRevenue: Number(row.otherRevenue.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
    };
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export async function getOperationalDayDetail(params: { operationalDate: string }): Promise<OperationalDayDetailResponse> {
  const { operationalDate } = params;
  const { startUtc, maxOccupancy, timezone, operationalDayStart } = await getReportsContext();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(operationalDate)) {
    throw new Error('Invalid operationalDate format. Use YYYY-MM-DD.');
  }

  const currentOperationalDateKey = getOperationalDateKey(startUtc, timezone);
  if (operationalDate >= currentOperationalDateKey) {
    throw new ReportsNotFoundError('La jornada aún está en curso.');
  }

  const parsedStart = parseOperationalDayStart(operationalDayStart);
  const txOperationalDateExpr = toAggregateSql('t', timezone, parsedStart);
  const sessionOperationalDateExpr = toAggregateSql('s', timezone, parsedStart);

  const [totalsRows, topProductsRows, dayWindowRows] = await Promise.all([
    prisma.$queryRaw<Array<{
      sessionCount: number;
      totalTimeSeconds: number;
      timeRevenue: number;
      otherRevenue: number;
      totalLaps: number;
      totalLapSeconds: number;
      operationalDateLabel: string;
    }>>`
      WITH tx_day AS (
        SELECT
          COUNT(DISTINCT t."playerSessionId")::int AS "sessionCount",
          COALESCE(SUM(CASE WHEN p."timeValueSeconds" IS NOT NULL THEN p."timeValueSeconds" * t."quantity" ELSE 0 END), 0)::int AS "totalTimeSeconds",
          COALESCE(SUM(CASE WHEN p."timeValueSeconds" IS NOT NULL THEN t."totalPrice" ELSE 0 END), 0)::float AS "timeRevenue",
          COALESCE(SUM(CASE WHEN p."timeValueSeconds" IS NULL THEN t."totalPrice" ELSE 0 END), 0)::float AS "otherRevenue",
          to_char(${txOperationalDateExpr}, 'DD/MM/YYYY') AS "operationalDateLabel"
        FROM "Transaction" t
        INNER JOIN "Product" p ON p."id" = t."productId"
        WHERE ${txOperationalDateExpr} = ${operationalDate}::date
        GROUP BY "operationalDateLabel"
      ),
      laps_day AS (
        SELECT
          COALESCE(SUM(s."lapsCount"), 0)::int AS "totalLaps",
          COALESCE(SUM(COALESCE(s."accumulatedSeconds", 0)), 0)::int AS "totalLapSeconds"
        FROM "PlayerSession" s
        WHERE ${sessionOperationalDateExpr} = ${operationalDate}::date
        AND s."lapsCount" > 0
      )
      SELECT
        tx_day."sessionCount",
        tx_day."totalTimeSeconds",
        tx_day."timeRevenue",
        tx_day."otherRevenue",
        laps_day."totalLaps",
        laps_day."totalLapSeconds",
        tx_day."operationalDateLabel"
      FROM tx_day
      CROSS JOIN laps_day
    `,
    prisma.$queryRaw<Array<{
      productId: string;
      name: string;
      totalQuantity: number;
      totalRevenue: number;
    }>>`
      SELECT
        p."id" AS "productId",
        p."name" AS "name",
        COALESCE(SUM(t."quantity"), 0)::int AS "totalQuantity",
        COALESCE(SUM(t."totalPrice"), 0)::float AS "totalRevenue"
      FROM "Transaction" t
      INNER JOIN "Product" p ON p."id" = t."productId"
      WHERE ${txOperationalDateExpr} = ${operationalDate}::date
      GROUP BY p."id", p."name"
      ORDER BY "totalRevenue" DESC, "totalQuantity" DESC
      LIMIT 10
    `,
    prisma.$queryRaw<Array<{ startAt: Date | null; endAt: Date | null }>>`
      SELECT
        MIN(t."createdAt") AS "startAt",
        MAX(t."createdAt") AS "endAt"
      FROM "Transaction" t
      WHERE ${txOperationalDateExpr} = ${operationalDate}::date
    `,
  ]);

  if (totalsRows.length === 0) {
    throw new ReportsNotFoundError('No existe una jornada cerrada con actividad para esa fecha.');
  }

  const totals = totalsRows[0];
  const dayWindow = dayWindowRows[0];

  const startTimeLabel = dayWindow?.startAt ? formatOperationalTime(dayWindow.startAt, timezone) : '--:--hs';
  const endTimeLabel = dayWindow?.endAt ? formatOperationalTime(dayWindow.endAt, timezone) : '--:--hs';
  const totalRevenue = totals.timeRevenue + totals.otherRevenue;
  const dayCapacitySeconds = Math.max(1, maxOccupancy) * ONE_DAY_MS / 1000;

  return {
    operationalDateKey: operationalDate,
    operationalDateLabel: totals.operationalDateLabel,
    operationalWindow: {
      startTimeLabel,
      endTimeLabel,
    },
    revenue: {
      timeRevenue: Number(totals.timeRevenue.toFixed(2)),
      otherRevenue: Number(totals.otherRevenue.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
    },
    operations: {
      soldMinutes: Math.round(totals.totalTimeSeconds / 60),
      occupancyPct: Number(Math.min(100, (totals.totalTimeSeconds / dayCapacitySeconds) * 100).toFixed(2)),
      sessionCount: totals.sessionCount,
      totalTimeSeconds: totals.totalTimeSeconds,
      totalLaps: totals.totalLaps,
      averageSecondsPerLap: totals.totalLaps > 0 ? Math.round(totals.totalLapSeconds / totals.totalLaps) : null,
    },
    topProducts: topProductsRows.map((row) => ({
      productId: row.productId,
      name: row.name,
      totalQuantity: row.totalQuantity,
      totalRevenue: Number(row.totalRevenue.toFixed(2)),
    })),
  };
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

export function isReportsNotFoundError(error: unknown): error is ReportsNotFoundError {
  return error instanceof ReportsNotFoundError;
}
