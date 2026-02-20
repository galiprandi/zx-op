import { useQuery } from '@tanstack/react-query';
import type {
  OperationalDayDetailResponse,
  OperationalDaysPageResponse,
  ReportsSummaryResponse,
} from '@shared/types';
import { getOperationalDayDetail, getOperationalDaysPage, getReportsSummary } from '@/api/reports';

export function useReportsSummary() {
  return useQuery<ReportsSummaryResponse>({
    queryKey: ['reportsSummary'],
    queryFn: getReportsSummary,
    staleTime: 30_000,
  });
}

export function useOperationalDaysPage(page: number, pageSize = 15) {
  return useQuery<OperationalDaysPageResponse>({
    queryKey: ['reportsDays', page, pageSize],
    queryFn: () => getOperationalDaysPage(page, pageSize),
    staleTime: 30_000,
  });
}

export function useOperationalDayDetail(operationalDate: string | null) {
  return useQuery<OperationalDayDetailResponse>({
    queryKey: ['reportsDayDetail', operationalDate],
    queryFn: () => getOperationalDayDetail(operationalDate as string),
    enabled: Boolean(operationalDate),
    staleTime: 30_000,
  });
}
