import type { PageParams } from "@/api/types";

export type InferenceRuntimeMode = "RUNTIME_MODE_DEPLOYMENT" | "RUNTIME_MODE_LEADER_WORKER_SET";

export interface InferenceGpuSelection {
  cluster_id: string;
  pool_id: string;
  profile_id: string;
  profile_version: string;
}

export interface CreateInferenceInput {
  name: string;
  model_version_id: string;
  served_model_name: string;
  engine_image: string;
  engine_type: string;
  command: string;
  cpu: string;
  memory: string;
  replicas: number;
  runtime_mode: InferenceRuntimeMode;
  worker_replicas?: number;
  gpu?: InferenceGpuSelection;
}
export interface CreateInferenceRequest {
  data: CreateInferenceInput & { idempotency_key: string };
}
export interface DeleteInferenceInput {
  expected_generation?: string;
}
export interface DeleteInferenceRequest {
  data: DeleteInferenceInput & { idempotency_key: string };
}
/** A durable acceptance does not imply readiness or completed deletion. */
export interface InferenceAcceptance {
  operation_id: string;
  resource_id: string;
  result: string;
  replayed?: boolean;
  dispatch_operation_id?: string;
}
export interface InferenceService {
  id: string;
  name: string;
  desired_state: string;
  generation: string;
  model_version_id: string;
  served_model_name: string;
  phase?: string;
  health?: string;
  observed_at?: string;
  engine_image: string;
  engine_type: string;
  command: string;
  cpu: string;
  memory: string;
  replicas: number;
  runtime_mode: InferenceRuntimeMode | "RUNTIME_MODE_UNSPECIFIED";
  worker_replicas?: number;
  gpu?: InferenceGpuSelection;
  publication_phase?: string;
  applied_generation?: string;
}
// FIXME(inference-contract): 当前索引已移除推理管理路由，现有列表契约仍待与目标版本对齐。
// TODO(inference-contract): 后端版本确认后复核筛选、分页与 total 类型并联调。
export interface InferenceListParams extends PageParams {
  status?: string;
  capability?: "embedding" | "text-generation" | "speech-to-text";
}
export interface InferenceListResponse {
  items: InferenceService[];
  total: number | string;
}
export interface InferenceOperation {
  id: string;
  service_id: string;
  kind: string;
  phase: string;
  step?: string;
  target_generation?: string;
  error_code?: string;
  error_message?: string;
  created_at?: string;
  completed_at?: string;
}
/** Owner Proto uses default camelCase JSON names, unlike the Governance DTOs. */
export interface InferenceOperationResponse {
  id: string;
  serviceId: string;
  kind: string;
  phase: string;
  step?: string;
  targetGeneration?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
}
