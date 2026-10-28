export type ResourceTrendMetric = "gpu" | "cpu" | "memory";
export type ResourceTrendRange = "1d" | "7d" | "30d";
export type ResourceTrendUnit = "cores" | "bytes";
export type ResourceTrendStatus = "OK" | "PARTIAL" | "NO_DATA";
export type ResourceTrendGapReason = "NO_DATA" | "AMBIGUOUS_SOURCE" | "INVALID_VALUE";

export interface ResourceTrendQueryParams {
  metric?: ResourceTrendMetric;
  range: ResourceTrendRange;
  start?: string;
  end?: string;
  step?: string;
}

export interface ResourceTrendPoint {
  timestamp: string;
  value: number | null;
  gap_reason?: ResourceTrendGapReason;
}

export interface ResourceTrendSeries {
  metric: ResourceTrendMetric;
  metric_code:
    | "tenant.cpu.usage_cores"
    | "tenant.memory.working_set_bytes"
    | "tenant.gpu.memory_usage_bytes";
  unit: ResourceTrendUnit;
  status: ResourceTrendStatus;
  points: ResourceTrendPoint[];
}

export interface ResourceTrendQueryResponse {
  data: {
    start: string;
    end: string;
    step_seconds: number;
    series: ResourceTrendSeries[];
  };
}
