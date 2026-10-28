import type { PageParams } from "@/api/types";

/** 创建接口使用严格 JSON Intent：整数为 JSON 数字，小数为非指数十进制字符串。 */
export interface FineTuningParameters {
  learning_rate?: string;
  max_steps?: number;
  per_device_train_batch_size?: number;
  gradient_accumulation_steps?: number;
  cutoff_len?: number;
  lora_rank?: number;
  lora_alpha?: number;
  lora_dropout?: string;
  seed?: number;
}
export interface CreateFineTuningInput {
  name: string;
  kind: "FINETUNING";
  implementation_id: string;
  compute_preset_id: string;
  dataset_version_id: string;
  base_model_version_id: string;
  target_model_id?: string;
  new_model_name?: string;
  parameters: FineTuningParameters;
  timeout_seconds?: number;
}
export interface CreateFineTuningRequest extends CreateFineTuningInput {
  idempotency_key: string;
}

export interface ModelDevParameter {
  name: string;
  type: string;
  value: string;
}
export interface ModelDevParameterRule {
  name: string;
  type: string;
  required?: boolean;
  default_value?: ModelDevParameter | null;
  allowed_values?: ModelDevParameter[] | null;
  minimum?: ModelDevParameter | null;
  maximum?: ModelDevParameter | null;
  minimum_inclusive?: boolean | null;
  maximum_inclusive?: boolean | null;
  editable?: boolean;
  non_editable_reason?: string;
  numeric_representation?: string;
  validation_description?: string;
}
export interface ModelDevImplementation {
  implementation_id: string;
  name: string;
  kind: string;
  version: string;
  parameter_contract_version: string;
  parameter_rules?: ModelDevParameterRule[];
  supported_device_modes?: string[];
  available: boolean;
  execution_timeout_default_seconds: string;
  execution_timeout_max_seconds: string;
  step_timeout_seconds: string;
}
export interface ModelDevImplementationListResponse {
  items: ModelDevImplementation[];
  total: string;
}
export interface ModelDevImplementationListParams extends PageParams {
  kind?: "GENERAL_TRAINING" | "FINETUNING";
}
export interface ModelDevInputVersion {
  input_version_id: string;
  state: string;
  format?: string;
  size_bytes?: string;
  sha256?: string;
  row_count?: number;
  feature_count?: number;
  created_at?: string;
}
export interface ModelDevInputVersionListParams extends PageParams {
  state?: string;
  format?: "CSV" | "JSON";
}
export interface ModelDevInputVersionListResponse {
  items: ModelDevInputVersion[];
  total: string;
}
export interface ModelDevExecution {
  operation_id: string;
  execution_id: string;
  name: string;
  kind: string;
  compute_state: string;
  delivery_state: string;
  close_state: string;
  resource_state: string;
  implementation_id: string;
  compute_preset_id: string;
  compute?: {
    compute_preset_id: string;
    selection_digest: string;
    cpu_millis: string;
    memory_mib: string;
    device_mode: string;
  } | null;
  resolved_parameters?: ModelDevParameter[];
  /** 查询响应中的 int64 为字符串；不可复用于要求 JSON integer 的创建请求。 */
  explicit_parameters?: {
    learning_rate?: string;
    epochs?: string;
    batch_size?: string;
    seed?: number;
    max_steps?: string;
    per_device_train_batch_size?: string;
    gradient_accumulation_steps?: string;
    cutoff_len?: string;
    lora_rank?: string;
    lora_alpha?: string;
    lora_dropout?: string;
  };
  parameter_contract_version?: string;
  resolved_configuration_sha256?: string;
  timing?: {
    execution_timeout_seconds: string;
    execution_timeout_max_seconds: string;
    step_timeout_seconds: string;
  } | null;
  model_registration?: {
    state: string;
    registration_id?: string;
    model_id?: string;
    model_version_id?: string;
    failure_code?: string;
  } | null;
  history?: {
    run_id?: string;
    workflow_uid?: string;
    observed_at?: string;
    run_state?: string;
    run_finished_at?: string;
    workflow_phase?: string;
    workflow_finished_at?: string;
    workflow_resource_version?: string;
    workflow_nodes_sha256?: string;
  } | null;
  input_version_id?: string;
  image_version_id?: string;
  current_step?: string;
  stop_requested?: boolean;
  close_generation?: string;
  accepted_at?: string;
  deadline_at?: string;
  observed_at?: string;
  // TODO(modeldev-list-contract): 测试环境列表已返回步骤和微调配置，待后端主分支合同合并后同步核对。
  steps: ModelDevExecutionStep[];
  managed_settings: ModelDevManagedSettings | null;
  base_model: {
    model_id: string;
    version_id: string;
    family: string;
    format: string;
  } | null;
}
export interface ModelDevExecutionListResponse {
  items: ModelDevExecution[];
  total: string;
}
export interface ModelDevExecutionListParams extends PageParams {
  kind?: ModelDevImplementationListParams["kind"];
  name?: string;
  compute_state?: string;
  delivery_state?: string;
  close_state?: string;
}
export interface ModelDevExecutionStep {
  role: string;
  state: string;
  started_at: string;
  finished_at: string;
  deadline_at: string;
  exit_code: number;
}
export interface ModelDevTrainingMetric {
  name: string;
  decimal_value: string;
  step: string;
}
export interface ModelDevExecutionFailure {
  reason: string;
  safe_message: string;
  violations: { field: string; reason: string }[];
  correlation_id: string;
}
export interface ModelDevManagedSettings {
  stage: string;
  finetuning_type: string;
  lora_target: string;
  lora_rank: string;
  lora_alpha: string;
  cutoff_len: string;
  per_device_train_batch_size: string;
  gradient_accumulation_steps: string;
  seed: string;
  data_seed: string;
  device: string;
  fp16: boolean;
  bf16: boolean;
  flash_attn: string;
  report_to: string;
  save_strategy: string;
  template: string;
  train_dtype: string;
  export_dtype: string;
  verify_dtype: string;
  lr_scheduler_type: string;
  warmup_ratio: string;
  weight_decay: string;
  lora_dropout: string;
  num_train_epochs: string;
  optim: string;
  logging_steps: string;
}
/** 列表中的 metrics 为空；完整训练指标和失败诊断由详情读取。 */
export interface ModelDevExecutionDetail extends ModelDevExecution {
  metrics: ModelDevTrainingMetric[];
  failure: ModelDevExecutionFailure | null;
}
export interface ModelDevLogParams {
  tail_lines?: number;
  max_bytes?: number;
}
export interface ModelDevExecutionLogs {
  log_id?: string;
  lines?: { timestamp?: string; text?: string }[];
  truncated?: boolean;
  observed_at?: string;
}
export interface ModelDevArtifact {
  artifact_id: string;
  execution_id: string;
  filename: string;
  role?: string;
  size_bytes?: string;
  sha256?: string;
  delivery_state?: string;
  verified_at?: string;
}
export interface ModelDevArtifactListResponse {
  items: ModelDevArtifact[];
  total: string;
}
