import type { PageParams } from "@/api/types";

/** Governance InstanceService contract. Protobuf int64 values are decimal strings. */
export type ComputeType = "cpu" | "gpu";
export type ObservedState = "pending" | "running" | "stopped" | "deleted";
export interface SchedulingOptions {
  pod_placement?: "NONE" | "COLOCATE_PREFERRED" | "SPREAD_PREFERRED";
  priority_class_name?: string;
}
export interface InstanceGpuSummary {
  profile_id: string;
  profile_version: string;
  mode: string;
  model_key: string;
  devices_per_instance: number;
  memory_mib_per_device: string;
  memory_mib_total: string;
  core_limit_percent: number;
}
export interface InstanceRecord {
  id: string;
  name: string;
  version: string;
  desiredState: string;
  observedState: ObservedState;
  reason?: string;
  imageId: string;
  imageDigest: string;
  presetId: string;
  preset_name: string;
  preset_code: string;
  instance_kind: "container";
  compute_type: ComputeType;
  cpu: string;
  memory: string;
  createdAt: string;
  workspaceSize: string;
  gpu_summary?: InstanceGpuSummary;
  scheduling?: SchedulingOptions;
  createOperationId?: string;
  lastOperationId?: string;
  computeCleaned?: boolean;
  workspaceCleaned?: boolean;
  quotaReturned?: boolean;
}
export interface InstanceListParams extends PageParams {
  instance_kind?: "container";
  compute_type?: ComputeType;
  observedState?: ObservedState;
  name?: string;
}
export interface InstanceListResponse {
  items: InstanceRecord[];
  total: string;
}
export interface InstancePreset {
  id: string;
  name: string;
  code: string;
  description?: string;
  compute_type: ComputeType;
  cpu_millis: string;
  memory_mib: string;
  enabled: boolean;
  gpu?: InstanceGpuSummary;
  created_at?: string;
  updated_at?: string;
  selectable: boolean;
  unavailable_reason?: string;
}
export interface InstancePresetListParams extends PageParams {
  name?: string;
  code?: string;
  compute_type?: ComputeType;
  gpu_mode?: "WHOLE_EXCLUSIVE" | "SHARED_FIXED";
}
export interface InstancePresetListResponse {
  items: InstancePreset[];
  total: string;
  gpu_catalog_status: string;
  gpu_catalog_reason?: string;
}
export interface CreateInstanceInput {
  name: string;
  image_id: string;
  image_scope: "tenant" | "platform";
  preset_id: string;
  scheduling?: SchedulingOptions;
}
export type CreateInstanceRequest = { data: CreateInstanceInput & { idempotency_key: string } };
export interface ChangeInstanceInput {
  expected_version: string;
}
export type ChangeInstanceRequest = { data: ChangeInstanceInput & { idempotency_key: string } };
export interface InstanceAcceptance {
  operationId: string;
  resourceId: string;
  replayed?: boolean;
  result: string;
}
export interface InstanceOperation {
  id: string;
  instanceId: string;
  action: string;
  intentVersion?: string;
  state: string;
  reason?: string;
}
export interface InstanceRuntime {
  instance_id: string;
  version: string;
  observedAt?: string;
  pod?: {
    name?: string;
    uid?: string;
    nodeName?: string;
    podIp?: string;
    phase?: string;
    ready?: boolean;
    reason?: string;
    message?: string;
    environmentSources?: Array<{ name: string; sourceType: string }>;
    mounts?: Array<{ name: string; volumeType: string; mountPath: string; readOnly: boolean }>;
  };
  statefulSet?: { desiredReplicas?: number | null; readyReplicas?: number | null };
}
export interface InstanceEvent {
  type: string;
  reason: string;
  message: string;
  lastOccurredAt?: string;
  count?: string | null;
}
export interface InstanceEventsResponse {
  podUid?: string | null;
  observedAt?: string;
  events: InstanceEvent[];
  truncated: boolean;
}
export interface InstanceLogParams {
  tailLines?: number;
  follow?: boolean;
}
export interface CreateInstanceExecSessionInput {
  rows: number;
  cols: number;
}
export type CreateInstanceExecSessionRequest = {
  data: CreateInstanceExecSessionInput & { expected_version: string; idempotency_key: string };
};
export interface InstanceExecSession {
  sessionId: string;
  wsUrl: string;
  expiresAt: string;
}
