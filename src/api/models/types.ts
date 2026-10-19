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
export interface Model {
  id: string;
  name: string;
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
// TODO(pagination-migration): governance 模型/版本列表仍使用 page.limit/page.cursor，保留嵌套游标契约；待后端改造后迁移 PageParams。
export interface ModelPageParams {
  limit?: number;
  /** Return the server cursor unchanged; it is not a page offset. */
  cursor?: string;
}
export interface ModelListParams extends ModelPageParams {
  keyword?: string;
  source?: string;
  capability?: string;
  status?: string;
}
export interface ModelListResponse {
  models: Model[];
  meta?: { next_cursor?: string; has_more?: boolean };
}
export interface ModelVersionListResponse {
  versions: ModelVersion[];
  meta?: { next_cursor?: string; has_more?: boolean };
}
export interface ModelVersionResponse {
  model: Model;
  version: ModelVersion;
}
export interface ImportModelInput {
  source: "huggingface" | "modelscope";
  repo_id: string;
  revision?: string;
  webhook_url?: string;
  model_id?: string;
  model_version_id?: string;
}
export interface ImportModelRequest {
  data: ImportModelInput & { idempotency_key: string };
}
