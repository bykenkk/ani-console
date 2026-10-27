import { coreRequest } from "@/api/request";
import type { StorageBucketListParams, StorageBucketListResponse } from "./types";
// TODO(storage-migration): 后端暂无桶详情接口，不能遍历分页模拟详情。
export function listBuckets(params: StorageBucketListParams = {}, signal?: AbortSignal) {
  return coreRequest<StorageBucketListResponse>("/storage/buckets", {
    method: "GET",
    params,
    signal,
  });
}
export type * from "./types";
