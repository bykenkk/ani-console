import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateStorageVolumeInput,
  CreateStorageVolumeRequest,
  StorageVolumeDeleteInput,
  StorageVolumeDeleteRequest,
  StorageVolumeDetail,
  StorageVolumeExpandInput,
  StorageVolumeExpandRequest,
  StorageVolumeListParams,
  StorageVolumeListResponse,
} from "./types";
const createScope = createIdempotencyScope("storage-pvc-create", ["POST"]);
const volumePath = (pvcName: string) => `/storage/volumes/${encodeURIComponent(pvcName)}`;
// TODO(storage-contract): 按存储补充契约接入；目标后端源码合并后复核 HTTP 映射、权限、UID 保护及真实环境行为。
// TODO(storage-filter): 当前仅支持页码分页，无名称、状态、用途和可挂载实例筛选；待后端补齐后恢复对应查询条件。
export function listVolumes(params: StorageVolumeListParams = {}, signal?: AbortSignal) {
  return coreRequest<StorageVolumeListResponse>("/storage/volumes", {
    method: "GET",
    params,
    signal,
  });
}
export function getVolume(pvcName: string, signal?: AbortSignal) {
  return coreRequest<StorageVolumeDetail>(volumePath(pvcName), { method: "GET", signal });
}
export async function createVolume(
  submitData: CreateStorageVolumeInput,
  signal?: AbortSignal,
): Promise<void> {
  await runIdempotentRequest(createScope, submitData, ({ idempotency_key, ...data }) =>
    coreRequest<unknown, CreateStorageVolumeRequest>("/storage/volumes", {
      method: "POST",
      data: { data: { ...data, create_token: idempotency_key } },
      signal,
    }),
  );
}
// 扩容与删除未声明幂等键；expected_uid 是资源身份前置条件，不附加通用 key。
export async function expandVolume(
  pvcName: string,
  input: StorageVolumeExpandInput,
  signal?: AbortSignal,
): Promise<void> {
  await coreRequest<unknown, StorageVolumeExpandRequest>(`${volumePath(pvcName)}:update`, {
    method: "POST",
    data: { data: { ...input, pvc_name: pvcName }, update_mask: "capacityGb" },
    signal,
  });
}
export async function deleteVolume(
  pvcName: string,
  input: StorageVolumeDeleteInput,
  signal?: AbortSignal,
): Promise<void> {
  await coreRequest<unknown, StorageVolumeDeleteRequest>(`${volumePath(pvcName)}:delete`, {
    method: "POST",
    data: { data: { ...input, pvc_name: pvcName } },
    signal,
  });
}
export type * from "./types";
