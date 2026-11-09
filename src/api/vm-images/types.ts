import type { PageParams } from "@/api/types";
import type { VmInitializationCapability } from "@/api/vms";

export type VmImageKind = "DISK_IMAGE" | "INSTALL_ISO";

export type VmImageState =
  | "PREPARING"
  | "IMPORTING"
  | "VERIFYING"
  | "READY"
  | "FAILED"
  | "UNAVAILABLE"
  | "DELETING"
  | "DELETED";

export type VmImageReason =
  | ""
  | "UPLOAD_DEADLINE_EXCEEDED"
  | "UPLOAD_REJECTED"
  | "CAPACITY_INSUFFICIENT"
  | "SOURCE_VALIDATION_FAILED"
  | "SOURCE_IDENTITY_CHANGED"
  | "NAMESPACE_INVALID"
  | "NATIVE_CLEANUP_BLOCKED"
  | "VM_IMAGE_UPLOAD_DISABLED"
  | "VM_IMAGE_DEPENDENCY_UNAVAILABLE"
  | "VM_IMAGE_NATIVE_IDENTITY_CHANGED"
  | "VM_IMAGE_UNAVAILABLE"
  | "VM_SUPERSEDED_BY_DELETE";

export interface VmImageOS {
  osFamily: "linux" | "windows";
  osVersion: string;
  architecture: string;
  firmware: "bios" | "uefi";
  rootBus: string;
  dataBus: string;
  nicModel: string;
}

export interface VmImage {
  imageId: string;
  mediaKey: string;
  name: string;
  description: string;
  kind: VmImageKind;
  format: "qcow2" | "iso";
  state: VmImageState;
  reason: VmImageReason;
  cleanupState: "NONE" | "PENDING" | "RUNNING" | "COMPLETE" | "BLOCKED";
  sourceCapacityGb: string;
  sourceRequestedBytes: string;
  observedSourceCapacityBytes: string;
  sourceChecksumBytes: string;
  sourceSha256: string;
  initializationCapability: VmInitializationCapability;
  os: VmImageOS;
  version: string;
  uploadDeadline: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VmImageListParams extends PageParams {
  kind?: VmImageKind;
  state?: VmImageState | "all";
  keyword?: string;
}

export interface VmImageListResponse {
  items: VmImage[];
  total: string;
}

export interface CreateVmImageInput {
  name: string;
  description: string;
  kind: VmImageKind;
  format: VmImage["format"];
  source_capacity_gb: string;
  initialization_capability?: VmInitializationCapability;
  os: {
    os_family: VmImageOS["osFamily"];
    os_version: string;
  };
}

export interface CreateVmImageRequest {
  data: CreateVmImageInput & { idempotency_key: string };
}

export interface VmImageUploadSessionRequest {
  data: { idempotency_key: string };
}

export interface VmImageUploadSession {
  imageId: string;
  uploadSessionId: string;
  method: string;
  uploadUrl: string;
  bearerToken: string;
  expiresAt: string;
  contentType: string;
  maxFileBytes: string;
}

export type VmImageUploadPhase = "preparing" | "uploading";

export interface UploadVmImageFileInput {
  imageId: string;
  file: File;
  signal: AbortSignal;
  onPhase: (phase: VmImageUploadPhase) => void;
  onProgress: (percent: number) => void;
}
