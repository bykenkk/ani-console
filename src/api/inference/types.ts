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
export interface CreateInferenceRequest extends CreateInferenceInput {
  idempotency_key: string;
}
export interface DeleteInferenceInput {
  expected_generation?: string;
}
export interface DeleteInferenceRequest extends DeleteInferenceInput {
  idempotency_key: string;
}
export type InferenceCommand = "start" | "stop" | "restart";
export interface InferenceCommandInput {
  expected_generation: string;
}
export interface InferenceCommandRequest extends InferenceCommandInput {
  resource_id: string;
  idempotency_key: string;
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
export interface UpdateInferenceRequest extends Omit<UpdateInferenceInput, "update_mask"> {
  resource_id: string;
  idempotency_key: string;
  update_mask: string;
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

export interface InferenceRuntimeInstance {
  name: string;
  uid: string;
  phase: string;
  containers: string[];
}
export interface InferenceRuntimeDiagnostics {
  invocation_endpoint?: string;
  invocation_health: string;
  health_reason?: string;
  health_observed_at?: string;
  runtime_observed_at?: string;
  observed_at?: string;
  instances: InferenceRuntimeInstance[];
}
export type InferenceLogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "unknown";
export interface InferenceLogParams {
  level?: InferenceLogLevel;
  instance?: string;
  container?: string;
  since?: string;
  until?: string;
  tail_lines?: number;
}
export interface InferenceLogLine {
  level?: InferenceLogLevel;
  timestamp?: string;
  message: string;
}
export interface InferenceLogsResponse {
  items: InferenceLogLine[];
  truncated: boolean;
}
export interface InferenceEventParams extends PageParams {
  since?: string;
  until?: string;
  type?: string;
}
export interface InferenceRuntimeEvent {
  id: string;
  type: string;
  reason: string;
  message: string;
  timestamp?: string;
  instance?: string;
  count: string;
}
export interface InferenceEventsResponse {
  items: InferenceRuntimeEvent[];
  total: string;
}

export interface InferenceMetricsParams {
  start?: string;
  end?: string;
  step?: number;
}
export interface InferenceMetricSeries {
  name: "cpu" | "memory";
  unit: "cores" | "bytes";
  points: { timestamp: string; value: number }[];
}
export interface InferenceMetricsResponse {
  series: InferenceMetricSeries[];
  start: string;
  end: string;
  step: number;
}
export interface InferenceRateLimit {
  requests_per_minute: number;
  requests_per_hour: number;
}
export interface InferenceServicePolicy {
  resource_id: string;
  allowed_tenants: string[];
  rate_limits?: Record<string, InferenceRateLimit>;
  updated_at?: string;
}
export interface InferencePolicyResponse {
  policy: InferenceServicePolicy;
}
export interface UpdateInferencePolicyInput {
  allowed_tenants: string[];
  rate_limits?: Record<string, InferenceRateLimit>;
}
export interface UpdateInferencePolicyRequest {
  policy: UpdateInferencePolicyInput;
}
