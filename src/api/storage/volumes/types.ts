import type { PageParams } from "@/api/types";
export type StorageVolumeMode = "Filesystem" | "Block";
export type StorageVolumePhase = "Pending" | "Bound" | "Lost";
export type StorageVolumeAccessMode =
  | "ReadWriteOnce"
  | "ReadOnlyMany"
  | "ReadWriteMany"
  | "ReadWriteOncePod";
export interface StorageVolume {
  pvc_name: string;
  uid: string;
  display_name: string;
  storage_class_name: string;
  volume_mode: StorageVolumeMode;
  access_modes: StorageVolumeAccessMode[];
  requested_capacity_gb: string;
  observed_capacity_bytes: string;
  observed_capacity_known: boolean;
  observed_capacity_quantity: string;
  phase: string;
  deleting: boolean;
  reclaim_policy: string;
  reclaim_policy_known: boolean;
}
export interface StorageVolumeCondition {
  type: string;
  status: string;
  reason: string;
  message: string;
  last_transition_time: string;
}
export interface StorageVolumeEvent {
  type: string;
  reason: string;
  message: string;
  count: number;
  last_timestamp: string;
}
export interface StorageVolumeConsumer {
  kind: string;
  namespace: string;
  name: string;
}
export interface StorageVolumeDetail {
  volume: StorageVolume | null;
  conditions: StorageVolumeCondition[];
  events: StorageVolumeEvent[];
  consumers: StorageVolumeConsumer[];
}
export interface StorageVolumeListParams extends PageParams {
  name?: string;
  id?: string;
  state?: StorageVolumePhase;
}
export interface StorageVolumeListResponse {
  items: StorageVolume[];
  total: string;
}
export interface CreateStorageVolumeInput {
  display_name: string;
  capacity_gb: string;
  storage_class_name: string;
  volume_mode?: StorageVolumeMode;
  access_modes?: StorageVolumeAccessMode[];
}
export interface CreateStorageVolumeRequest {
  data: CreateStorageVolumeInput & { create_token: string };
}
export interface StorageVolumeExpandInput {
  expected_uid: string;
  capacity_gb: string;
}
export interface StorageVolumeDeleteInput {
  expected_uid: string;
}
export interface StorageVolumeExpandRequest {
  data: StorageVolumeExpandInput & { pvc_name: string };
  update_mask: "capacityGb";
}
export interface StorageVolumeDeleteRequest {
  data: StorageVolumeDeleteInput & { pvc_name: string };
}
