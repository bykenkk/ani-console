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
  preset_id: string;
  replicas: number;
  runtime_mode: InferenceRuntimeMode;
  worker_replicas?: number;
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
export type InferenceCommand = "start" | "stop" | "restart";
export interface InferenceCommandInput {
  expected_generation: string;
}
export interface InferenceCommandRequest {
  data: InferenceCommandInput & { resource_id: string; idempotency_key: string };
}
export type InferenceUpdateField = "modelVersionId" | "servedModelName" | "engine";
export interface UpdateInferenceInput {
  expected_generation: string;
  update_mask: InferenceUpdateField[];
  model_version_id?: string;
  served_model_name?: string;
  engine_image?: string;
  engine_type?: string;
  command?: string;
}
export interface UpdateInferenceRequest {
  data: Omit<UpdateInferenceInput, "update_mask"> & {
    resource_id: string;
    idempotency_key: string;
    update_mask: string;
  };
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
// TODO(inference-contract): 已静态核对列表筛选和页码分页；待部署后联调 total 的十进制字符串序列化。
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
