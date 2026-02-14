import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getPerformanceMetrics, type DashboardStats, type PerformanceMetrics } from "@/api/dashboard";

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
    refetchInterval: 60000, // Refresh every 1 minute
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

export const usePerformanceMetrics = () => {
  return useQuery<PerformanceMetrics>({
    queryKey: ["performanceMetrics"],
    queryFn: getPerformanceMetrics,
    refetchInterval: 60000, // Refresh every 1 minute
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};
