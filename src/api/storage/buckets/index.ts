import { coreRequest } from "@/api/request";
import type { StorageBucketListParams, StorageBucketListResponse } from "./types";
// TODO(storage-contract): 按补充契约接入；待目标源码合并后复核分页校验与租户可见范围。
// TODO(storage-filter): 后端暂无桶名称搜索和桶详情接口；不能遍历分页模拟详情或对结果本地筛选。
export function listBuckets(params: StorageBucketListParams = {}, signal?: AbortSignal) {
  return coreRequest<StorageBucketListResponse>("/storage/buckets", {
    method: "GET",
    params,
    signal,
  });
}
export type * from "./types";
