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
}
