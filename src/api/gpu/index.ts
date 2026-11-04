import { coreRequest } from "@/api/request";
import type { GpuMemoryMetricCode, GpuMemoryResponse } from "./types";

export * from "./types";

const MEMORY_METRIC_CODES: GpuMemoryMetricCode[] = [
  "gpu.resource.memory_used_bytes",
  "gpu.resource.memory_limit_bytes",
];

const containerMetricsPath = (id: string) =>
  `/gpu/resources/container/${encodeURIComponent(id)}/metrics`;

export function getContainerGpuMemory(id: string, signal?: AbortSignal) {
  return coreRequest<GpuMemoryResponse>(`${containerMetricsPath(id)}/latest`, {
    method: "GET",
    params: { metricCodes: MEMORY_METRIC_CODES },
    signal,
  });
}

export function queryContainerGpuMemory(id: string, signal?: AbortSignal) {
  return coreRequest<
    GpuMemoryResponse,
    { data: { metricCodes: GpuMemoryMetricCode[]; window: string } }
  >(`${containerMetricsPath(id)}/query`, {
    method: "POST",
    data: { data: { metricCodes: MEMORY_METRIC_CODES, window: "1h" } },
    signal,
  });
}
