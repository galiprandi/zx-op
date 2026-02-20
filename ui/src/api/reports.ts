import { API } from './api';
import type {
  OperationalDayDetailResponse,
  OperationalDaysPageResponse,
  ReportsSummaryResponse,
} from '@shared/types';

export async function getReportsSummary(): Promise<ReportsSummaryResponse> {
  const response = await API.get<ReportsSummaryResponse>('/api/reports/summary');
  return response.data;
}

export async function getOperationalDaysPage(page: number, pageSize = 15): Promise<OperationalDaysPageResponse> {
  const response = await API.get<OperationalDaysPageResponse>('/api/reports/days', {
    params: { page, pageSize },
  });
  return response.data;
}

export async function getOperationalDayDetail(operationalDate: string): Promise<OperationalDayDetailResponse> {
  const response = await API.get<OperationalDayDetailResponse>(`/api/reports/days/${operationalDate}`);
  return response.data;
}
