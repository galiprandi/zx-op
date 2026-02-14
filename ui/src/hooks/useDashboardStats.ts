import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  todayRevenue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    category: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  waitingCount: number;
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
};
