import type { PageParams } from "@/api/types";

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
  kind?: "GENERAL_TRAINING";
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
}
export interface ModelDevInputVersionListResponse {
  items: ModelDevInputVersion[];
  total: string;
}
export interface ModelDevExecutionStates {
  compute_state: string;
  delivery_state: string;
  close_state: string;
  resource_state: string;
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
  items: ModelDevExecution[];
  total: string;
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
  items: ModelDevArtifact[];
  total: string;
}
export interface ModelDevArtifactDownload {
  artifact: ModelDevArtifact;
  download_url: string;
  expires_at: string;
}
