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
