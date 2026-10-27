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
  networkState?: string;
  networkReason?: string;
  networkCleaned?: boolean;
  volumeReferencesReleased?: boolean;
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
  gpu_catalog_status: "OK" | "NO_PERMISSION" | "UNAVAILABLE";
  gpu_catalog_reason?: string;
}
export interface CreateInstanceInput {
  name: string;
  image_id: string;
  image_scope: "tenant" | "platform";
  preset_id: string;
  scheduling?: SchedulingOptions;
  workspace_mount_path?: string;
  volume_mounts?: InstanceVolumeMount[];
  network?: InstanceNetworkSelection;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  env?: InstanceEnvVar[];
}
export interface InstanceVolumeMount {
  pvc_name: string;
  mount_path: string;
  read_only: boolean;
}
export interface InstanceNetworkSelection {
  vpc_id: string;
  subnet_id: string;
}
export interface InstanceEnvVar {
  name: string;
  value: string;
}
export interface InstanceConfigurationData {
  instance_id: string;
  instance_contract_version: number;
  workspace_mount_path: string;
  volume_mounts: InstanceVolumeMount[];
  network: InstanceNetworkSelection | null;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  env: InstanceEnvVar[];
}
export type InstanceMetricCode =
  | "cpu.usage_cores"
  | "memory.working_set_bytes"
  | "network.receive_bytes_per_second"
  | "network.transmit_bytes_per_second";
export interface InstanceMetricsInput {
  metric_codes: InstanceMetricCode[];
  start: string;
  end: string;
  step_seconds?: number;
}
export interface InstanceMetricsRequest {
  data: InstanceMetricsInput;
}
export interface InstanceMetricSeries {
  metric_code: InstanceMetricCode;
  unit: "cores" | "bytes" | "bytes_per_second";
  status: "OK" | "PARTIAL" | "NO_DATA";
  points: Array<{
    timestamp: string;
    value: number | null;
    gap_reason?: "NO_DATA" | "AMBIGUOUS_SOURCE" | "INVALID_VALUE";
  }>;
}
export interface InstanceMetricsRangeResponse {
  data: {
    instance_id: string;
    start: string;
    end: string;
    step_seconds: number;
    series: InstanceMetricSeries[];
  };
}
export interface InstanceMetricsLatestResponse {
  data: {
    instance_id: string;
    evaluated_at: string;
    series: InstanceMetricSeries[];
  };
}
export interface MountablePvc {
  pvc_name: string;
  phase: string;
  requested_capacity: string;
  access_modes: string[];
  volume_mode: string;
  selectable: boolean;
  unavailable_reason?: string;
}
export interface MountablePvcListParams extends PageParams {
  name?: string;
}
export interface MountablePvcListResponse {
  items: MountablePvc[];
  total: string;
}
export type CreateInstanceRequest = { data: CreateInstanceInput & { idempotency_key: string } };
export interface ChangeInstanceInput {
  expected_version: string;
}
export type ChangeInstanceRequest = { data: ChangeInstanceInput & { idempotency_key: string } };
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
