import { coreRequest } from "@/api/request";
import type {
  StorageObjectDownloadInfo,
  StorageObjectInput,
  StorageObjectListParams,
  StorageObjectListResponse,
  StorageObjectMeta,
  StorageObjectRequest,
} from "./types";
const bucketPath = (bucketId: string) => `/storage/buckets/${encodeURIComponent(bucketId)}`;
export function listStorageObjects(
  bucketId: string,
  params: StorageObjectListParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<StorageObjectListResponse>(`${bucketPath(bucketId)}/objects`, {
    method: "GET",
    params: { ...params, prefix: params.prefix === "" ? undefined : params.prefix },
    signal,
  });
}
// 两个 POST 均为查询能力，契约未声明幂等字段，保留返回值且不追加 key。
export function getStorageObject(input: StorageObjectInput, signal?: AbortSignal) {
  return coreRequest<StorageObjectMeta, StorageObjectRequest>(
    `${bucketPath(input.bucket_id)}/objects:head`,
    {
      method: "POST",
      data: { data: input },
      signal,
    },
  );
}
export function getStorageObjectDownload(input: StorageObjectInput, signal?: AbortSignal) {
  return coreRequest<StorageObjectDownloadInfo, StorageObjectRequest>(
    `${bucketPath(input.bucket_id)}/objects:download-url`,
    {
      method: "POST",
      data: { data: input },
      signal,
    },
  );
}
export type * from "./types";
