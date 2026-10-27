import type { PageParams } from "@/api/types";

export interface ModelVersion {
  id: string;
  model_id: string;
  version: string;
  status: string;
  engine_image?: string;
  engine_type?: string;
  startup_command?: string;
  format?: string;
  is_encrypted?: boolean;
  encrypt_algo?: string;
  encrypt_hint?: string;
  size_bytes?: string;
  checksum_sha256?: string;
  storage_path?: string;
  created_at?: string;
}
export type ModelFormat = "safetensors" | "gguf" | "pytorch";
export type ModelCapability = "text-generation" | "embedding" | "speech-to-text";
export type ExternalModelProvider = "huggingface" | "modelscope";
export interface Model {
  id: string;
  name: string;
  /** @deprecated 前端不采用此字段，模型名称统一读取 name。 */
  display_name?: string;
  description?: string;
  source?: string;
  source_repo_id?: string;
  capabilities?: string[];
  status: string;
  error_message?: string;
  total_size_bytes?: string;
  created_at?: string;
  updated_at?: string;
  model_id?: string;
  versions?: ModelVersion[];
}
export type ModelPageParams = PageParams;
export type ModelVersionStatus =
  | "pending"
  | "importing"
  | "ready"
  | "error"
  | "downloading"
  | "failed";
export interface ModelVersionListParams extends PageParams {
  status?: ModelVersionStatus;
}
export interface ModelListParams extends ModelPageParams {
  keyword?: string;
  source?: string;
  capability?: string;
  status?: string;
}
export interface ModelListResponse {
  items: Model[];
  total: string;
}
export interface ModelVersionListResponse {
  items: ModelVersion[];
  total: string;
}
export interface ModelVersionResponse {
  model: Model;
  version: ModelVersion;
}
export interface ImportModelInput {
  source: ExternalModelProvider;
  repo_id: string;
  revision: string;
  webhook_url?: string;
  model_id: string;
  model_version_id: string;
}
export interface ImportModelRequest extends ImportModelInput {
  idempotency_key: string;
}

export interface ImportModelBundleModelInput {
  name: string;
  display_name?: string;
  description?: string;
  capabilities: ModelCapability[];
  external_model_id?: string;
}

export interface ImportModelBundleVersionInput {
  version: string;
  format: ModelFormat;
  engine_type: string;
  engine_image: string;
  startup_command: string;
}

export interface ImportModelBundleSourceInput {
  provider: ExternalModelProvider;
  repo_id: string;
  revision: string;
}

export interface ImportModelBundleInput {
  model: ImportModelBundleModelInput;
  version: ImportModelBundleVersionInput;
  source: ImportModelBundleSourceInput;
}

export interface ImportModelBundleRequest extends ImportModelBundleInput {
  idempotency_key: string;
}

export interface ImportModelBundleResponse {
  model: Model;
  version: ModelVersion;
  task: ImportTask;
}
export interface ExternalModelCandidate {
  source: ExternalModelProvider;
  repo_id: string;
  name: string;
  /** @deprecated 前端不采用此字段，模型名称统一读取 name。 */
  display_name?: string;
  description?: string;
  revision: string;
  size_bytes?: number | string;
  tags?: string[];
  updated_at?: string;
}
export interface SearchExternalModelsParams extends PageParams {
  source: ExternalModelProvider;
  keyword: string;
  owner?: string;
  task?: string;
  library?: string;
}
export interface SearchExternalModelsResponse {
  items: ExternalModelCandidate[];
  hasMore: boolean;
}
export interface CreateModelInput {
  name: string;
  display_name?: string;
  description?: string;
  capabilities: ModelCapability[];
  model_id?: string;
}
export interface CreateModelRequest extends CreateModelInput {
  idempotency_key: string;
}
export interface CreateModelVersionInput {
  model_id: string;
  version: string;
  format: ModelFormat;
  engine_type: string;
  startup_command: string;
  engine_image: string;
}
export interface CreateModelVersionRequest extends CreateModelVersionInput {
  idempotency_key: string;
}
export interface ImportTask {
  task_id: string;
  task_type: string;
  status: string;
  location_url?: string;
  model_id: string;
  model_version_id: string;
  attempt_count?: number;
  progress_pct?: number;
  error_message?: string;
  created_at?: string;
  completed_at?: string;
}

export interface ModelOperation {
  id: string;
  model_id: string;
  model_version_id?: string;
  action: string;
  actor: string;
  result: "accepted" | "succeeded" | "failed";
  before_state?: string;
  after_state?: string;
  error_class?: string;
  request_id?: string;
  created_at: string;
  task_id?: string;
}
export interface ModelOperationListResponse {
  items: ModelOperation[];
  total: string;
}
