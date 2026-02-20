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

export type RecentOperationalDaySalesSchema = z.infer<typeof RecentOperationalDaySalesSchema>;
export type ReportsSummarySchema = z.infer<typeof ReportsSummarySchema>;
