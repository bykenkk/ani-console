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

// Resource 将十进制 GB 转为 int64 bytes，容量不能超过 MaxInt64 / 1e9。
export const STORAGE_VOLUME_MAX_CAPACITY_GB = 9_223_372_036;

const createScope = createIdempotencyScope("storage-pvc-create", ["POST"]);
const volumePath = (pvcName: string) => `/storage/volumes/${encodeURIComponent(pvcName)}`;
// TODO(storage-filter): 用途与可挂载实例筛选仍待后端提供，不对当前页本地过滤。
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
