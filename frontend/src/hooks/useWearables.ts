import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { WearableConnection } from "@/types";

export function useConnectedWearables() {
  return useQuery<{ connections: WearableConnection[] }>({
    queryKey: ["wearables"],
    queryFn: async () => {
      const { data } = await api.get("/wearables/connected");
      return data;
    },
  });
}

export function useWearableAuthUrl(provider: string) {
  return useQuery<{ authUrl: string; provider: string }>({
    queryKey: ["wearableAuthUrl", provider],
    queryFn: async () => {
      const { data } = await api.get(`/wearables/auth-url/${provider}`);
      return data;
    },
    enabled: false,
  });
}

export function useSyncWearable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider: string) => {
      const { data } = await api.post(`/wearables/sync/${provider}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wearables"] });
      queryClient.invalidateQueries({ queryKey: ["healthMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["healthScore"] });
      queryClient.invalidateQueries({ queryKey: ["healthSummary"] });
    },
  });
}

export function useDisconnectWearable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (provider: string) => {
      const { data } = await api.delete(`/wearables/${provider}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wearables"] });
    },
  });
}

export function useWearableCallback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ provider, code }: { provider: string; code: string }) => {
      const { data } = await api.post(`/wearables/callback/${provider}`, { code });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wearables"] });
    },
  });
}
