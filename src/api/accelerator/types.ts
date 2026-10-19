/** TODO(pagination-migration): 后端完成 page/pageSize 契约后对齐 PageParams；当前保留 page_size/page_token 与 next_page_token，不伪造 total，也不迁回 cursor/limit。 */
export interface AcceleratorPageParams {
  page_size?: number;
  page_token?: string;
}
export interface AcceleratorProfileListParams extends AcceleratorPageParams {
  cluster_id: string;
  mode?: string;
}
export interface AcceleratorUsageListParams extends AcceleratorPageParams {
  owner_service?: string;
  state?: string;
}
export interface AcceleratorProfileVersion {
  profile_id: string;
  profile_version: string;
}
export interface AcceleratorProfileSpec {
  group_id?: string;
  mode?: string;
  model_key?: string;
  shared_memory_mib?: string;
  core_limit_percent?: number;
  max_devices_per_replica?: number;
  isolation_class?: string;
}
export interface AcceleratorProfile extends AcceleratorProfileVersion {
  display_name?: string;
  spec?: AcceleratorProfileSpec;
  published?: boolean;
}
export interface AcceleratorProfileListResponse {
  items: AcceleratorProfile[];
  next_page_token?: string;
}
export interface AcceleratorObservation {
  complete?: boolean;
  observed_at?: string;
  issues?: string[];
}
export interface AcceleratorCapacity extends AcceleratorProfileVersion {
  mode?: string;
  physical_device_count?: string;
  nominal_units?: string;
  known_committed_units?: string;
  known_free_units?: string;
  unplaced_requested_units?: string;
  observation?: AcceleratorObservation;
}
export interface AcceleratorUsage {
  owner_service: string;
  resource_id: string;
  create_operation_id?: string;
  revision?: string;
  state: string;
  end_reason?: string;
  profile_id?: string;
  profile_version?: string;
  source_operation_created_at?: string;
}
export interface AcceleratorUsageListResponse {
  items: AcceleratorUsage[];
  next_page_token?: string;
}
export interface AcceleratorBinding {
  binding_id: string;
  container_name?: string;
  state?: string;
  memory_mib?: string;
  core_limit_percent?: number;
  observation?: AcceleratorObservation;
}
export interface AcceleratorBindingListResponse {
  items: AcceleratorBinding[];
  next_page_token?: string;
  observation?: AcceleratorObservation;
}
export interface AcceleratorAdmissionInput extends AcceleratorProfileVersion {
  cluster_id: string;
  pool_id: string;
  replicas: number;
  devices_per_replica: number;
  container_name: string;
}
export interface AcceleratorAdmissionRequest {
  data: AcceleratorAdmissionInput;
}
export interface AcceleratorAdmissionPreview {
  requested_quota_items?: { quota_code?: string; units?: string }[];
  quota_checks?: {
    quota_code?: string;
    requested?: string;
    available?: string;
    sufficient?: boolean;
    status?: string;
  }[];
  gpu_fit?: string;
  estimated_replicas?: string;
  estimate_known?: boolean;
  observation?: AcceleratorObservation;
  owner_execution_readiness?: string;
  cpu?: string;
  network?: string;
  storage?: string;
  reasons?: string[];
}
