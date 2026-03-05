import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { InsurancePolicy, PolicyReadiness, PolicyUpdate, PolicyTemplate } from "@/types";

export function usePolicies() {
  return useQuery<{ policies: InsurancePolicy[] }>({
    queryKey: ["policies"],
    queryFn: async () => {
      const { data } = await api.get("/policies");
      return data;
    },
  });
}

export function usePolicyDetail(policyId: string) {
  return useQuery({
    queryKey: ["policy", policyId],
    queryFn: async () => {
      const { data } = await api.get(`/policies/${policyId}`);
      return data;
    },
    enabled: !!policyId,
  });
}

export function usePolicyReadiness() {
  return useQuery<PolicyReadiness>({
    queryKey: ["policyReadiness"],
    queryFn: async () => {
      const { data } = await api.get("/policies/readiness");
      return data;
    },
  });
}

export function usePolicyHistory(policyId: string) {
  return useQuery<{ updates: PolicyUpdate[] }>({
    queryKey: ["policyHistory", policyId],
    queryFn: async () => {
      const { data } = await api.get(`/policies/${policyId}/history`);
      return data;
    },
    enabled: !!policyId,
  });
}

export function useBrowseTemplates(filters?: { tier?: string; type?: string; maxPremium?: string }) {
  return useQuery<{ templates: PolicyTemplate[] }>({
    queryKey: ["templates", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.tier) params.set("tier", filters.tier);
      if (filters?.type) params.set("type", filters.type);
      if (filters?.maxPremium) params.set("maxPremium", filters.maxPremium);
      const { data } = await api.get(`/templates/browse?${params.toString()}`);
      return data;
    },
  });
}

export function useApplyPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data } = await api.post("/policies/apply", { templateId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      queryClient.invalidateQueries({ queryKey: ["policyReadiness"] });
    },
  });
}

export function useMintPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policyId: string) => {
      const { data } = await api.post(`/policies/${policyId}/mint`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
}
