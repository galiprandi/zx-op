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

export interface PaymentBreakdownRow {
  paymentMethodId: string;
  name: string;
  totalAmount: number;
  salesCount: number;
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
  paymentBreakdown: PaymentBreakdownRow[];
  topProducts: OperationalDayTopProduct[];
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
  paymentBreakdown: PaymentBreakdownRow[];
  recentOperationalDaySales: RecentOperationalDaySales[];
}
