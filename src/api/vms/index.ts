import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type { InstancePresetListParams, InstancePresetListResponse } from "@/api/instances";
import type {
  CreateVmInput,
  VirtualMachine,
  VmListParams,
  VmListResponse,
  VmChangeInput,
  VmOperation,
  VmMedia,
  VmDisk,
  VmSnapshot,
  VmRestorePreview,
  VmMediaSlot,
  VmBootDevice,
  VmConsoleSession,
} from "./types";

const createScope = createIdempotencyScope("vm-create", ["POST"]);
const changeScope = createIdempotencyScope("vm-change", []);
const consoleScope = createIdempotencyScope("vm-console", ["POST"]);
const vmPath = (id: string) => `/virtual-machines/${encodeURIComponent(id)}`;
const diskPath = (id: string, diskId: string) =>
  `${vmPath(id)}/disks/${encodeURIComponent(diskId)}`;
const snapshotPath = (id: string, snapshotId: string) =>
  `${vmPath(id)}/snapshots/${encodeURIComponent(snapshotId)}`;

export function listVms(params: VmListParams, signal?: AbortSignal) {
  // TODO(vm-filter): 当前 VM 合同仅支持 page/pageSize；后端开放筛选后再添加搜索和状态筛选。
  return coreRequest<VmListResponse>("/virtual-machines", { method: "GET", params, signal });
}
export function getVm(id: string, signal?: AbortSignal) {
  return coreRequest<VirtualMachine>(vmPath(id), { method: "GET", signal });
}
export function listVmPresets(params: InstancePresetListParams = {}, signal?: AbortSignal) {
  return coreRequest<InstancePresetListResponse>("/compute-presets", {
    method: "GET",
    params: { ...params, usage: "VIRTUAL_MACHINE" },
    signal,
  });
}
export function listVmMedia(signal?: AbortSignal) {
  return coreRequest<{ items: VmMedia[] }>("/virtual-machine-media", { method: "GET", signal });
}
export function getVmDnsDefaults(signal?: AbortSignal) {
  return coreRequest<{ nameservers: string[] }>("/virtual-machine-dns-defaults", {
    method: "GET",
    signal,
  });
}
export function createVm(input: CreateVmInput): Promise<void> {
  return runIdempotentRequest(createScope, input, async (data) => {
    await coreRequest("/virtual-machines", { method: "POST", data: { data } });
  });
}
function changeVm(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  input: VmChangeInput & object,
): Promise<void> {
  return runIdempotentRequest(
    changeScope,
    input,
    async (data) => {
      await coreRequest(path, { method, data: { data } });
    },
    [method, path],
  );
}
export function startVm(id: string, input: VmChangeInput) {
  return changeVm(`${vmPath(id)}/start`, "POST", input);
}
export function stopVm(id: string, input: VmChangeInput) {
  return changeVm(`${vmPath(id)}/stop`, "POST", input);
}
export function restartVm(id: string, input: VmChangeInput) {
  return changeVm(`${vmPath(id)}/restart`, "POST", input);
}
export function forceStopVm(
  id: string,
  input: VmChangeInput & { destructive_confirmation: boolean },
) {
  return changeVm(`${vmPath(id)}/force-stop`, "POST", input);
}
export function deleteVm(id: string, input: VmChangeInput) {
  return changeVm(vmPath(id), "DELETE", input);
}
export function getVmOperation(id: string, operationId: string, signal?: AbortSignal) {
  return coreRequest<VmOperation>(`${vmPath(id)}/operations/${encodeURIComponent(operationId)}`, {
    method: "GET",
    signal,
  });
}
export function listVmDisks(id: string, signal?: AbortSignal) {
  return coreRequest<{ items: VmDisk[] }>(`${vmPath(id)}/disks`, { method: "GET", signal });
}
export function createVmDisk(id: string, input: VmChangeInput & { name: string; size_gb: string }) {
  return changeVm(`${vmPath(id)}/disks`, "POST", input);
}
export function attachVmDisk(id: string, diskId: string, input: VmChangeInput) {
  return changeVm(`${diskPath(id, diskId)}/attach`, "POST", input);
}
export function detachVmDisk(
  id: string,
  diskId: string,
  input: VmChangeInput & { guest_prepared_confirmation: boolean },
) {
  return changeVm(`${diskPath(id, diskId)}/detach`, "POST", input);
}
export function deleteVmDisk(id: string, diskId: string, input: VmChangeInput) {
  return changeVm(diskPath(id, diskId), "DELETE", input);
}
export function setVmMedia(
  id: string,
  slot: VmMediaSlot,
  input: VmChangeInput & { media_key: string },
) {
  return changeVm(`${vmPath(id)}/media/${encodeURIComponent(slot)}`, "PUT", input);
}
export function ejectVmMedia(id: string, slot: VmMediaSlot, input: VmChangeInput) {
  return changeVm(`${vmPath(id)}/media/${encodeURIComponent(slot)}`, "DELETE", input);
}
export function setVmBootDevice(id: string, input: VmChangeInput & { boot_device: VmBootDevice }) {
  return changeVm(`${vmPath(id)}/boot`, "PUT", input);
}
export function listVmSnapshots(id: string, signal?: AbortSignal) {
  return coreRequest<{ items: VmSnapshot[] }>(`${vmPath(id)}/snapshots`, { method: "GET", signal });
}
export function getVmSnapshot(id: string, snapshotId: string, signal?: AbortSignal) {
  return coreRequest<VmSnapshot>(snapshotPath(id, snapshotId), { method: "GET", signal });
}
export function createVmSnapshot(id: string, input: VmChangeInput & { name: string }) {
  return changeVm(`${vmPath(id)}/snapshots`, "POST", input);
}
export function deleteVmSnapshot(id: string, snapshotId: string, input: VmChangeInput) {
  return changeVm(snapshotPath(id, snapshotId), "DELETE", input);
}
export function previewVmRestore(id: string, snapshotId: string, signal?: AbortSignal) {
  // 只读预览不使用幂等键；提交恢复必须使用该预览的 version 和 digest。
  return coreRequest<VmRestorePreview, { data: Record<string, never> }>(
    `${snapshotPath(id, snapshotId)}/restore-preview`,
    { method: "POST", data: { data: {} }, signal },
  );
}
export function restoreVmSnapshot(
  id: string,
  snapshotId: string,
  input: VmChangeInput & { preview_digest: string; destructive_confirmation: boolean },
) {
  return changeVm(`${snapshotPath(id, snapshotId)}/restore`, "POST", input);
}
export async function createVmConsoleSession(id: string, signal?: AbortSignal) {
  const vm = await getVm(id, signal);
  return runIdempotentRequest(
    consoleScope,
    { expected_version: vm.version },
    (data) =>
      coreRequest<VmConsoleSession, { data: VmChangeInput & { idempotency_key: string } }>(
        `${vmPath(id)}/console-sessions`,
        { method: "POST", data: { data }, signal },
      ),
    [id],
  );
}
export type * from "./types";
