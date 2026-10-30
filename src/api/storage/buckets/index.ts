import { coreRequest } from "@/api/request";
import type {
  CreateStorageBucketInput,
  StorageBucketStats,
  StorageBucketListParams,
  StorageBucketListResponse,
} from "./types";
// TODO(storage-migration): 后端暂无桶详情接口，不能遍历分页模拟详情。
export function listBuckets(params: StorageBucketListParams = {}, signal?: AbortSignal) {
  return coreRequest<StorageBucketListResponse>("/storage/buckets", {
    method: "GET",
    params,
    signal,
  });
}
export type * from "./types";

// 同名创建由服务端幂等处理；契约没有幂等 key 字段或 Header。
// TODO(storage-runtime): 待前端联调验证创建、同名重放、数量上限和服务端错误。
export async function createBucket(input: CreateStorageBucketInput): Promise<void> {
  await coreRequest("/storage/buckets", { method: "POST", data: { data: input } });
}

// TODO(storage-runtime): 统计增量未部署，发布后核对空桶、扫描上限和错误响应。
export function getBucketStats(bucketId: string, signal?: AbortSignal) {
  return coreRequest<StorageBucketStats>(`/storage/buckets/${encodeURIComponent(bucketId)}/stats`, {
    method: "GET",
    signal,
  });
}
