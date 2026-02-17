import { useQuery } from '@tanstack/react-query';
import type { ReportsSummaryResponse } from '@shared/types';
import { getReportsSummary } from '@/api/reports';

export function useReportsSummary() {
  return useQuery<ReportsSummaryResponse>({
    queryKey: ['reportsSummary'],
    queryFn: getReportsSummary,
    staleTime: 30_000,
  });
}
