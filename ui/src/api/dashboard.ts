import { API } from './api';

export interface DashboardStats {
  todayRevenue: number;
  salesByCategory: Array<{
    category: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  waitingCount: number;
}

export interface PerformanceMetrics {
  averageWaitTime: number; // seconds
  averagePlayTime: number; // seconds
  averageSecondsPerLap: number | null; // weighted by total laps
  totalLaps: number;
  totalCompletedSessions: number;
  dailyOccupancyRate: number; // percentage
  totalPlayTimeConsumed: number; // seconds today
  peakOccupancy: number;
  averageSessionDuration: number; // seconds
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await API.get<DashboardStats>('/api/dashboard/stats');
  return response.data;
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  const response = await API.get<PerformanceMetrics>('/api/dashboard/performance');
  return response.data;
}
