import { coreRequest } from "@/api/request";
import type { StorageClassListParams, StorageClassListResponse } from "./types";
// TODO(storage-contract): 补充契约允许空分页参数、忽略未知参数且未承诺排序；待目标源码合并与列表规则对齐后复核。
export function listStorageClasses(params: StorageClassListParams = {}, signal?: AbortSignal) {
  return coreRequest<StorageClassListResponse>("/storage/classes", {
    method: "GET",
    params,
    signal,
  });
}
export type * from "./types";
