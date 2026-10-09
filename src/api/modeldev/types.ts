export interface ModelDevPageParams {
  page_size?: number;
  page_token?: string;
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
  default_value?: ModelDevParameter;
  allowed_values?: ModelDevParameter[];
  minimum?: ModelDevParameter;
  maximum?: ModelDevParameter;
}
export interface ModelDevPreset {
  preset_id: string;
  name: string;
  kind: string;
  active_release_id?: string;
  image_version_ids?: string[];
  parameter_rules?: ModelDevParameterRule[];
  binding_generation?: string;
  new_submissions_enabled?: boolean;
}
export interface ModelDevPresetListResponse {
  presets: ModelDevPreset[];
  next_page_token?: string;
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
export interface ModelDevInputVersionListParams extends ModelDevPageParams {
  state?: string;
}
export interface ModelDevInputVersionListResponse {
  input_versions: ModelDevInputVersion[];
  next_page_token?: string;
}
export interface CreateModelDevExecutionInput {
  name: string;
  kind: "GENERAL_TRAINING";
  preset_id: string;
  dataset_version_id: string;
  image_version_id?: string;
  /** Omission and [] are distinct intents. Null is not supported. */
  general_parameters?: ModelDevParameter[];
}
export type CreateModelDevExecutionRequest = CreateModelDevExecutionInput & {
  idempotency_key: string;
};
export interface ModelDevExecutionStates {
  compute_state: string;
  delivery_state: string;
  close_state: string;
  resource_state: string;
}
/** A durable 202 acceptance is not evidence that training has started. */
export interface ModelDevExecutionAcceptance extends ModelDevExecutionStates {
  operation_id: string;
  execution_id: string;
  resolved_release_id: string;
  replayed?: boolean;
}
export interface ModelDevExecution extends ModelDevExecutionStates {
  operation_id: string;
  execution_id: string;
  name: string;
  kind: string;
  preset_id?: string;
  release_id?: string;
  input_version_id?: string;
  image_version_id?: string;
  current_step?: string;
  stop_requested?: boolean;
  close_generation?: string;
  accepted_at?: string;
  deadline_at?: string;
  observed_at?: string;
}
export interface ModelDevExecutionListResponse {
  executions: ModelDevExecution[];
  next_page_token?: string;
}
export interface ModelDevStopAcceptance {
  operation_id: string;
  execution_id: string;
  stop_requested?: boolean;
  intent_generation?: string;
  replayed?: boolean;
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
  artifacts: ModelDevArtifact[];
  next_page_token?: string;
}
export interface ModelDevArtifactDownload {
  artifact: ModelDevArtifact;
  download_url: string;
  expires_at: string;
}
