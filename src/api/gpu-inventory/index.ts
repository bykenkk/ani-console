import { coreRequest } from "@/api/request";
import type {
  GpuInventoryListParams,
  GpuInventoryListResponse,
  GpuInventoryRecord,
  GpuOccupancyStats,
  GpuSpecAvailabilityListResponse,
  TenantQuotaResponse,
} from "./types";

export function listGpuInventory(
  params: GpuInventoryListParams = {},
): Promise<GpuInventoryListResponse> {
  return coreRequest<GpuInventoryListResponse>("/gpu-inventory", { method: "GET", params });
}

export function getGpuOccupancy(): Promise<GpuOccupancyStats> {
  return coreRequest<GpuOccupancyStats>("/gpu-inventory/occupancy", { method: "GET" });
}

export function getGpuSpecAvailability(): Promise<GpuSpecAvailabilityListResponse> {
  return coreRequest<GpuSpecAvailabilityListResponse>("/gpu-specs/availability", {
    method: "GET",
  });
}

export function getMyQuota(): Promise<TenantQuotaResponse> {
  return coreRequest<TenantQuotaResponse>("/quotas/me", { method: "GET" });
}

export async function listGpuAnomalies(): Promise<GpuInventoryRecord[]> {
  const [faults, maintenance] = await Promise.all([
    listGpuInventory({ status: "fault" }),
    listGpuInventory({ status: "maintenance" }),
  ]);
  return [...faults.items, ...maintenance.items];
}

export type { GpuInventoryRecord, GpuOccupancyStats } from "./types";
