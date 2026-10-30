export interface InstanceOverviewStatistics {
  total: number;
  by_state: {
    pending: number;
    running: number;
    stopped: number;
    failed: number;
  };
  other: number;
}

export interface InferenceServiceOverviewStatistics {
  total: number;
  by_status: {
    pending: number;
    deploying: number;
    running: number;
    stopping: number;
    stopped: number;
    failed: number;
  };
  other: number;
}

export interface ModelOverviewStatistics {
  total: number;
  by_status: {
    pending: number;
    importing: number;
    ready: number;
    error: number;
  };
  other: number;
}

export interface KnowledgeBaseOverviewStatistics {
  total: number;
  by_status: {
    active: number;
    rebuilding: number;
  };
  other: number;
}

export interface ConsoleOverviewStatistics {
  instances: InstanceOverviewStatistics;
  inference_services: InferenceServiceOverviewStatistics;
  models: ModelOverviewStatistics;
  knowledge_bases: KnowledgeBaseOverviewStatistics;
  gpu_quota: ConsoleGpuQuotaOverview;
}

export interface ConsoleGpuQuotaOverview {
  shared_memory_mib: ConsoleGpuQuotaItem;
  physical_count: ConsoleGpuQuotaItem;
}

export interface ConsoleGpuQuotaItem {
  quota_code: string;
  unit: string;
  limit: string;
  occupied: string;
  available: string;
  over_limit: boolean;
  configured: boolean;
  enforcement: string;
}
