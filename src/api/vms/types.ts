import type { PageParams } from "@/api/types";

export type VmMediaKind = "DISK_IMAGE" | "INSTALL_ISO" | "DRIVER_ISO";
export type VmSourceKind = "DISK_IMAGE" | "INSTALL_ISO" | "VM_CLONE";
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
export interface VmResourceReference {
  id: string;
  name?: string;
  state: "RESOLVED" | "NOT_FOUND" | "UNAVAILABLE" | "NOT_QUERIED";
}
export interface VmRuntime {
  state:
    | "AVAILABLE"
    | "NOT_RUNNING"
    | "AGENT_NOT_CONNECTED"
    | "UNAVAILABLE"
    | "CHANGED"
    | "NOT_QUERIED";
  agentState: "CONNECTED" | "NOT_CONNECTED" | "UNKNOWN";
  observedAt?: string;
  nodeName?: string;
  startedAt?: string;
  hostname?: string;
  agentVersion?: string;
  osName?: string;
  osVersion?: string;
  kernelRelease?: string;
  kernelVersion?: string;
  interfaces?: Array<{
    name: string;
    guestName?: string;
    mac?: string;
    addresses?: string[];
    infoSource?: string;
  }>;
  filesystemsState: "AVAILABLE" | "UNSUPPORTED" | "UNAVAILABLE" | "NOT_QUERIED";
  filesystems?: Array<{
    diskName: string;
    mountPoint: string;
    fileSystemType: string;
    totalBytes?: string;
    usedBytes?: string;
  }>;
}
export interface VirtualMachine {
  id: string;
  name: string;
  version: string;
  security_group_ids?: string[];
  osFamily: string;
  osVersion: string;
  desiredState: string;
  observedState: string;
  reason?: string;
  observedAt?: string;
  createdAt: string;
  addresses: Array<{ nicName: string; address: string; observedAt: string }>;
  lastOperationId?: string;
  closing: boolean;
  disks: VmDisk[];
  media: VmMediaState[];
  bootDevice: VmBootDevice;
  presetName?: string;
  hardware?: {
    sockets: number;
    cores: number;
    threads: number;
    architecture: string;
    firmware: string;
    rootBus: string;
    dataBus: string;
    nicModel: string;
    persistentTpm: boolean;
    persistentUefi: boolean;
  };
  initialization?: { method: string; username: string; sshKeyFingerprint?: string };
  sourceMedia?: VmSourceMedia | null;
  runtime?: VmRuntime | null;
  relations?: {
    vpc?: VmResourceReference;
    subnet?: VmResourceReference;
    securityGroups?: VmResourceReference[];
  };
  presetId: string;
  cpuMillis: string;
  memoryMib: string;
  systemDiskSizeGb: string;
  sourceKind: VmSourceKind;
  cloneSource?: {
    sourceVmId: string;
    expectedSourceVersion: string;
    sourceName: string;
  } | null;
  mediaKey: string;
  dns?: VmDns;
}
export type VmStateFilter =
  | "all"
  | "pending"
  | "provisioning"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "failed"
  | "deleting"
  | "deleted";
export interface VmListParams extends PageParams {
  state?: VmStateFilter;
  keyword?: string;
}
export interface VmLogParams {
  tailLines?: number;
  follow?: boolean;
}
export interface VmListResponse {
  items: VirtualMachine[];
  total: string;
}
export type VmInitializationCapability = "NONE" | "CLOUD_INIT_NOCLOUD";

export interface VmMedia {
  mediaKey: string;
  name: string;
  kind: VmMediaKind;
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
  initializationCapability?: VmInitializationCapability | "";
}
// 克隆冻结的是机器描述，介质身份字段可为空。
export interface VmSourceMedia extends Omit<VmMedia, "kind"> {
  kind: VmMediaKind | "";
}
export interface VmInitialDisk {
  client_disk_key: string;
  name: string;
  size_gb: string;
}
export type CreateVmInput =
  | {
      name: string;
      source_kind: "DISK_IMAGE" | "INSTALL_ISO";
      preset_id: string;
      media_key: string;
      system_disk_size_gb: string;
      data_disks: VmInitialDisk[];
      network: { vpc_id: string; subnet_id: string };
      security_group_ids?: string[];
      start_after_create: boolean;
      guest_initialization?: { username: string; password?: string; ssh_public_key?: string };
      dns?: VmDns;
    }
  | {
      name: string;
      source_kind: "VM_CLONE";
      clone_source: Pick<CloneVmInput, "source_vm_id" | "expected_source_version">;
      start_after_create: boolean;
    };
export interface CloneVmInput {
  name: string;
  source_vm_id: string;
  expected_source_version: number;
  start_after_create: boolean;
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

export interface VmSnapshot {
  name?: string;
  createdAt?: string;
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
