import { useQuery } from "@tanstack/react-query";
import { api, type HealthResponse, type ReadyResponse } from "@/lib/api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<HealthResponse>("/health"),
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useReadiness() {
  return useQuery({
    queryKey: ["health", "ready"],
    queryFn: () => api.get<ReadyResponse>("/health/ready"),
    refetchInterval: 30_000,
    retry: 1,
  });
}
