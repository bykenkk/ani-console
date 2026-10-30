import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope, type IdempotencyScope } from "@/lib/idempotency";
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
  VmForceStopInput,
  VmDiskCreateInput,
  VmDiskDetachInput,
  VmMediaSetInput,
  VmBootDeviceInput,
  VmSnapshotCreateInput,
  VmSnapshotRestoreInput,
  VmConsoleSession,
} from "./types";

const createScope = createIdempotencyScope("vm-create", ["POST"]);
const startScope = createIdempotencyScope("vm-start", ["POST"]);
const stopScope = createIdempotencyScope("vm-stop", ["POST"]);
const restartScope = createIdempotencyScope("vm-restart", ["POST"]);
const forceStopScope = createIdempotencyScope("vm-force-stop", ["POST"]);
// VM DELETE 契约明确要求 body 内的 idempotency_key 和 expected_version。
const deleteScope = createIdempotencyScope("vm-delete", ["DELETE"]);
const createDiskScope = createIdempotencyScope("vm-disk-create", ["POST"]);
const attachDiskScope = createIdempotencyScope("vm-disk-attach", ["POST"]);
const detachDiskScope = createIdempotencyScope("vm-disk-detach", ["POST"]);
const deleteDiskScope = createIdempotencyScope("vm-disk-delete", ["DELETE"]);
const setMediaScope = createIdempotencyScope("vm-media-set", ["PUT"]);
const ejectMediaScope = createIdempotencyScope("vm-media-eject", ["DELETE"]);
const bootScope = createIdempotencyScope("vm-boot", ["PUT"]);
const createSnapshotScope = createIdempotencyScope("vm-snapshot-create", ["POST"]);
const deleteSnapshotScope = createIdempotencyScope("vm-snapshot-delete", ["DELETE"]);
const restoreSnapshotScope = createIdempotencyScope("vm-snapshot-restore", ["POST"]);
const securityGroupsScope = createIdempotencyScope("vm-security-groups", ["PUT"]);
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
  // TODO(pagination-migration): 介质目录暂为无分页 items；后端补齐正式分页后迁移选项加载。
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
  scope: IdempotencyScope,
  path: string,
  method: "POST" | "PUT" | "DELETE",
  input: VmChangeInput & object,
  resourceIds: string[],
): Promise<void> {
  return runIdempotentRequest(
    scope,
    input,
    async (data) => {
      await coreRequest(path, { method, data: { data } });
    },
    resourceIds,
  );
}
export function startVm(id: string, input: VmChangeInput) {
  return changeVm(startScope, `${vmPath(id)}/start`, "POST", input, [id]);
}
export function stopVm(id: string, input: VmChangeInput) {
  return changeVm(stopScope, `${vmPath(id)}/stop`, "POST", input, [id]);
}
export function restartVm(id: string, input: VmChangeInput) {
  return changeVm(restartScope, `${vmPath(id)}/restart`, "POST", input, [id]);
}
export function forceStopVm(id: string, input: VmForceStopInput) {
  return changeVm(forceStopScope, `${vmPath(id)}/force-stop`, "POST", input, [id]);
}
export function deleteVm(id: string, input: VmChangeInput) {
  return changeVm(deleteScope, vmPath(id), "DELETE", input, [id]);
}
export function getVmOperation(id: string, operationId: string, signal?: AbortSignal) {
  return coreRequest<VmOperation>(`${vmPath(id)}/operations/${encodeURIComponent(operationId)}`, {
    method: "GET",
    signal,
  });
}
export function listVmDisks(id: string, signal?: AbortSignal) {
  // TODO(pagination-migration): VM 磁盘暂按无分页 items 查询；后端补齐后迁移，不伪造 total。
  return coreRequest<{ items: VmDisk[] }>(`${vmPath(id)}/disks`, { method: "GET", signal });
}
export function createVmDisk(id: string, input: VmDiskCreateInput) {
  return changeVm(createDiskScope, `${vmPath(id)}/disks`, "POST", input, [id]);
}
export function attachVmDisk(id: string, diskId: string, input: VmChangeInput) {
  return changeVm(attachDiskScope, `${diskPath(id, diskId)}/attach`, "POST", input, [id, diskId]);
}
export function detachVmDisk(id: string, diskId: string, input: VmDiskDetachInput) {
  return changeVm(detachDiskScope, `${diskPath(id, diskId)}/detach`, "POST", input, [id, diskId]);
}
export function deleteVmDisk(id: string, diskId: string, input: VmChangeInput) {
  return changeVm(deleteDiskScope, diskPath(id, diskId), "DELETE", input, [id, diskId]);
}
export function setVmMedia(id: string, slot: VmMediaSlot, input: VmMediaSetInput) {
  return changeVm(setMediaScope, `${vmPath(id)}/media/${encodeURIComponent(slot)}`, "PUT", input, [
    id,
    slot,
  ]);
}
export function ejectVmMedia(id: string, slot: VmMediaSlot, input: VmChangeInput) {
  return changeVm(
    ejectMediaScope,
    `${vmPath(id)}/media/${encodeURIComponent(slot)}`,
    "DELETE",
    input,
    [id, slot],
  );
}
export function setVmBootDevice(id: string, input: VmBootDeviceInput) {
  return changeVm(bootScope, `${vmPath(id)}/boot`, "PUT", input, [id]);
}
export function listVmSnapshots(id: string, signal?: AbortSignal) {
  // TODO(pagination-migration): VM 快照暂按无分页 items 查询；后端补齐后迁移，不伪造 total。
  return coreRequest<{ items: VmSnapshot[] }>(`${vmPath(id)}/snapshots`, { method: "GET", signal });
}
export function getVmSnapshot(id: string, snapshotId: string, signal?: AbortSignal) {
  return coreRequest<VmSnapshot>(snapshotPath(id, snapshotId), { method: "GET", signal });
}
export function createVmSnapshot(id: string, input: VmSnapshotCreateInput) {
  return changeVm(createSnapshotScope, `${vmPath(id)}/snapshots`, "POST", input, [id]);
}
export function deleteVmSnapshot(id: string, snapshotId: string, input: VmChangeInput) {
  return changeVm(deleteSnapshotScope, snapshotPath(id, snapshotId), "DELETE", input, [
    id,
    snapshotId,
  ]);
}
export function previewVmRestore(id: string, snapshotId: string, signal?: AbortSignal) {
  // 只读预览不使用幂等键；提交恢复必须使用该预览的 version 和 digest。
  return coreRequest<VmRestorePreview, { data: Record<string, never> }>(
    `${snapshotPath(id, snapshotId)}/restore-preview`,
    { method: "POST", data: { data: {} }, signal },
  );
}
export function restoreVmSnapshot(id: string, snapshotId: string, input: VmSnapshotRestoreInput) {
  return changeVm(restoreSnapshotScope, `${snapshotPath(id, snapshotId)}/restore`, "POST", input, [
    id,
    snapshotId,
  ]);
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

export function setVmSecurityGroups(
  id: string,
  input: import("@/api/network").SetSecurityGroupsInput,
): Promise<void> {
  return runIdempotentRequest(
    securityGroupsScope,
    input,
    async (data) => {
      await coreRequest(`${vmPath(id)}/security-groups`, { method: "PUT", data: { data } });
    },
    [id],
  );
}
