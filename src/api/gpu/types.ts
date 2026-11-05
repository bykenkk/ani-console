export type GpuMemoryMetricCode =
  | "gpu.resource.memory_used_bytes"
  | "gpu.resource.memory_limit_bytes";

export interface GpuMetricQuality {
  status: string;
  reasons: string[];
  completePoints: number;
  observedPoints: number;
  expectedPoints: number;
  partialPoints: number;
  emptyPoints: number;
  coverage: number | null;
  observedSources: number;
  expectedSources: number | null;
}

export interface GpuMemoryPoint {
  timestamp: string;
  end: string | null;
  value: number | null;
  peak: number | null;
  knownValue: number | null;
  knownPeak: number | null;
  quality: GpuMetricQuality;
  sampleTimeMin: string | null;
  sampleTimeMax: string | null;
}

export interface GpuMemorySeries {
  metricCode: GpuMemoryMetricCode;
  unit: string;
  aggregation: string;
  baseResolutionSeconds: number;
  points: GpuMemoryPoint[];
  mean: number | null;
  peak: number | null;
  quality: GpuMetricQuality;
  metricAvailableFrom: string | null;
  ownershipAvailableFrom: string | null;
  dataCutoff: string | null;
  capability: string;
  eventCode: string;
  semantics: string;
  exporterProcessStarts: string[];
}

export interface GpuMemoryResponse {
  queryTime: string;
  start: string | null;
  end: string | null;
  effectiveStepSeconds: number;
  series: GpuMemorySeries[];
  indexComplete: boolean;
  includedResourceKinds: string[];
  uncoveredResourceKinds: string[];
  resourceKind: string;
  resourceId: string;
  tenantId: number | null;
}
