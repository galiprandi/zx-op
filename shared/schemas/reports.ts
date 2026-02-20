import { z } from 'zod';

export const RecentOperationalDaySalesSchema = z.object({
  operationalDate: z.string(),
  occupancyPct: z.number().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
  totalTimeSeconds: z.number().int().nonnegative(),
  averageSecondsPerLap: z.number().int().nonnegative().nullable(),
  totalLaps: z.number().int().nonnegative(),
  timeRevenue: z.number().nonnegative(),
  otherRevenue: z.number().nonnegative(),
  totalRevenue: z.number().nonnegative(),
});

export const ReportsSummarySchema = z.object({
  topKpis: z.object({
    operationalRevenue: z.number().nonnegative(),
    soldMinutes: z.number().int().nonnegative(),
    occupancyPct: z.number().nonnegative(),
  }),
  salesPeriods: z.object({
    last7OperationalDays: z.number().nonnegative(),
    last30OperationalDays: z.number().nonnegative(),
    lifetime: z.number().nonnegative(),
    weekOverWeekPct: z.number().nullable(),
    monthOverMonthPct: z.number().nullable(),
  }),
  recentOperationalDaySales: z.array(RecentOperationalDaySalesSchema),
});

export const OperationalDayListItemSchema = z.object({
  operationalDateKey: z.string(),
  operationalDateLabel: z.string(),
  occupancyPct: z.number().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
  totalTimeSeconds: z.number().int().nonnegative(),
  averageSecondsPerLap: z.number().int().nonnegative().nullable(),
  totalLaps: z.number().int().nonnegative(),
  timeRevenue: z.number().nonnegative(),
  otherRevenue: z.number().nonnegative(),
  totalRevenue: z.number().nonnegative(),
});

export const OperationalDaysPageSchema = z.object({
  items: z.array(OperationalDayListItemSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const OperationalDayTopProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  totalQuantity: z.number().int().nonnegative(),
  totalRevenue: z.number().nonnegative(),
});

export const OperationalDayDetailSchema = z.object({
  operationalDateKey: z.string(),
  operationalDateLabel: z.string(),
  operationalWindow: z.object({
    startTimeLabel: z.string(),
    endTimeLabel: z.string(),
  }),
  revenue: z.object({
    timeRevenue: z.number().nonnegative(),
    otherRevenue: z.number().nonnegative(),
    totalRevenue: z.number().nonnegative(),
  }),
  operations: z.object({
    soldMinutes: z.number().int().nonnegative(),
    occupancyPct: z.number().nonnegative(),
    sessionCount: z.number().int().nonnegative(),
    totalTimeSeconds: z.number().int().nonnegative(),
    totalLaps: z.number().int().nonnegative(),
    averageSecondsPerLap: z.number().int().nonnegative().nullable(),
  }),
  topProducts: z.array(OperationalDayTopProductSchema),
});

export type RecentOperationalDaySalesSchema = z.infer<typeof RecentOperationalDaySalesSchema>;
export type ReportsSummarySchema = z.infer<typeof ReportsSummarySchema>;
export type OperationalDayListItemSchema = z.infer<typeof OperationalDayListItemSchema>;
export type OperationalDaysPageSchema = z.infer<typeof OperationalDaysPageSchema>;
export type OperationalDayTopProductSchema = z.infer<typeof OperationalDayTopProductSchema>;
export type OperationalDayDetailSchema = z.infer<typeof OperationalDayDetailSchema>;
