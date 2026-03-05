import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { HealthScore, HealthSummary, HealthMetric } from "@/types";

export function useHealthScore() {
  return useQuery<HealthScore>({
    queryKey: ["healthScore"],
    queryFn: async () => {
      const { data } = await api.get("/health/score");
      return data;
    },
  });
}

export function useHealthScoreHistory(days = 30) {
  return useQuery<{ scores: HealthScore[] }>({
    queryKey: ["healthScoreHistory", days],
    queryFn: async () => {
      const { data } = await api.get(`/health/score/history?days=${days}`);
      return data;
    },
  });
}

export function useHealthSummary() {
  return useQuery<HealthSummary>({
    queryKey: ["healthSummary"],
    queryFn: async () => {
      const { data } = await api.get("/health/summary");
      return data;
    },
  });
}

export function useHealthMetrics(startDate?: string, endDate?: string) {
  return useQuery<{ metrics: HealthMetric[] }>({
    queryKey: ["healthMetrics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const { data } = await api.get(`/health/metrics?${params.toString()}`);
      return data;
    },
  });
}
