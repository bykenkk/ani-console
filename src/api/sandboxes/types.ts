import type { PageParams } from "@/api/types";

/** Governance SandboxService: int64 fields remain decimal strings. */
export interface SandboxWorkspace {
  mount_path: string;
  size: string;
  storage_class: string;
  reclaim_policy: string;
}
export interface SandboxSnapshot {
  name: string;
  image_reference: string;
  preset_id: string;
  image_digest: string;
  cpu_millis: string;
  memory_mib: string;
  compute_type: string;
  cluster_id: string;
  namespace: string;
  runtime_class: string;
  selection_digest: string;
  preset_code: string;
  preset_name: string;
  spec_digest: string;
  workspace?: SandboxWorkspace;
}
export interface SandboxProviderRefs {
  pvc_name?: string;
  pvc_uid?: string;
  pod_name?: string;
  pod_uid?: string;
  resource_version?: string;
  cleanup_receipt?: string;
  pvc_resource_version?: string;
  pod_resource_version?: string;
  pv_name?: string;
  pv_uid?: string;
}
export interface Sandbox {
  id: string;
  version: string;
  desired_state: string;
  observed_state: string;
  reason?: string;
  create_operation_id?: string;
  last_operation_id?: string;
  snapshot?: SandboxSnapshot;
  provider_refs?: SandboxProviderRefs;
  observed_at?: string;
}
export type SandboxListParams = PageParams;
export interface SandboxListResponse {
  items: Sandbox[];
  total: string;
}
export interface CreateSandboxInput {
  name: string;
  image_reference: string;
  preset_id: string;
  workspace_size: string;
}
export interface ChangeSandboxInput {
  expected_version: string;
}
export type CreateSandboxRequest = { data: CreateSandboxInput & { idempotency_key: string } };
export type ChangeSandboxRequest = { data: ChangeSandboxInput & { idempotency_key: string } };
export interface SandboxOperation {
  id: string;
  sandbox_id: string;
  action: string;
  intent_version: string;
  state: string;
  reason?: string;
  created_at?: string;
}
