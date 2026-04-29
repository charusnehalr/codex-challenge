"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardResponse } from "@/types/dashboard";

async function fetchDashboard() {
  const response = await fetch("/api/dashboard");

  if (!response.ok) {
    throw new Error("Unable to load dashboard.");
  }

  return (await response.json()) as DashboardResponse;
}

export function useDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  return { data, isLoading, error, refetch };
}
