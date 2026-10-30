import type { PageParams } from "@/api/types";

export type VmSourceKind = "DISK_IMAGE" | "INSTALL_ISO";
export type VmMediaSlot = "INSTALL" | "DRIVER";
export type VmBootDevice = "SYSTEM_DISK" | "INSTALL_MEDIA";
export interface VmDns {
  mode: "PLATFORM_DEFAULT" | "CUSTOM";
  nameservers?: string[];
}
export interface VmDisk {
  diskId: string;
  role: string;
  name: string;
  sizeGb: string;
  requestedBytes: string;
  observedCapacityBytes: string;
  volumeName: string;
  serial: string;
  attached: boolean;
  preparationState: string;
  reason?: string;
}
export interface VmMediaState {
  slot: VmMediaSlot;
  desiredMedia: string;
  observedMedia: string;
  effectiveNow: boolean;
  pendingRestart: boolean;
}
export interface VirtualMachine {
  id: string;
  name: string;
  version: string;
  osFamily: string;
  osVersion: string;
  desiredState: string;
  observedState: string;
  reason?: string;
  observedAt?: string;
  addresses: Array<{ nicName: string; address: string; observedAt: string }>;
  lastOperationId?: string;
  closing: boolean;
  disks: VmDisk[];
  media: VmMediaState[];
  bootDevice: VmBootDevice;
  presetId: string;
  cpuMillis: string;
  memoryMib: string;
  systemDiskSizeGb: string;
  sourceKind: VmSourceKind;
  mediaKey: string;
  dns?: VmDns;
}
export type VmListParams = PageParams;
export interface VmLogParams {
  tailLines?: number;
  follow?: boolean;
}
export interface VmListResponse {
  items: VirtualMachine[];
  total: string;
}
export interface VmMedia {
  mediaKey: string;
  name: string;
  kind: VmSourceKind | "DRIVER_ISO";
  osFamily: string;
  osVersion: string;
  architecture: string;
  firmware: string;
  rootBus: string;
  dataBus: string;
  nicModel: string;
  persistentTpm: boolean;
  persistentUefi: boolean;
  driverMediaKey?: string;
  virtualCapacityBytes: string;
  initializationCapability: string;
  initializationVerified: boolean;
}
export interface VmInitialDisk {
  client_disk_key: string;
  name: string;
  size_gb: string;
}
export interface CreateVmInput {
  name: string;
  preset_id: string;
  source_kind: VmSourceKind;
  media_key: string;
  system_disk_size_gb: string;
  data_disks: VmInitialDisk[];
  network: { vpc_id: string; subnet_id: string };
  start_after_create: boolean;
  guest_initialization?: { username: string; password?: string; ssh_public_key?: string };
  dns?: VmDns;
}
export interface VmChangeInput {
  expected_version: string;
}
export interface VmForceStopInput extends VmChangeInput {
  destructive_confirmation: boolean;
}
export interface VmDiskCreateInput extends VmChangeInput {
  name: string;
  size_gb: string;
}
export interface VmDiskDetachInput extends VmChangeInput {
  guest_prepared_confirmation: boolean;
}
export interface VmMediaSetInput extends VmChangeInput {
  media_key: string;
}
export interface VmBootDeviceInput extends VmChangeInput {
  boot_device: VmBootDevice;
}
export interface VmSnapshotCreateInput extends VmChangeInput {
  name: string;
}
export interface VmSnapshotRestoreInput extends VmChangeInput {
  preview_digest: string;
  destructive_confirmation: boolean;
}
export interface VmOperation {
  id: string;
  vmId: string;
  action: string;
  intentVersion: string;
  state: string;
  reason?: string;
  observedAt?: string;
}
export interface VmSnapshot {
  snapshotId: string;
  sourceVmId: string;
  sourceVmUid: string;
  ready: boolean;
  completeness: string;
  included: string[];
  excluded: string[];
  indications: string[];
  disks: VmDisk[];
  observedAt?: string;
  reason?: string;
}
export interface VmRestorePreview {
  version: string;
  snapshotId: string;
  snapshotUid: string;
  disks: Array<{ diskId: string; action: string; reason: string }>;
  previewDigest: string;
}
export interface VmConsoleSession {
  sessionId: string;
  wsUrl: string;
  expiresAt: string;
}
