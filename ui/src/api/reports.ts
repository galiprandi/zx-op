import { API } from './api';
import type { ReportsSummaryResponse } from '@shared/types';

export async function getReportsSummary(): Promise<ReportsSummaryResponse> {
  const response = await API.get<ReportsSummaryResponse>('/api/reports/summary');
  return response.data;
}
