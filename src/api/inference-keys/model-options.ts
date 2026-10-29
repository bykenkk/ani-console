import { ApiError, coreRequest } from "@/api/request";
import type { PageParams } from "@/api/types";
import type { InferenceKeyListResponse } from "./types";

interface ModelInferenceKeyListParams extends PageParams {
  modelName: string;
}

// TODO(inference-key-model-filter):
// 已按发布环境接入 served_model_name；待后端源码提交后核对正式契约，
// 并联调确认权限范围、有效状态、筛选后 total 与分页语义。
// 不将未筛选的管理列表视为模型可用 AK 列表，不使用前端筛选补偿。
export function listModelInferenceKeys(
  { modelName, page, pageSize }: ModelInferenceKeyListParams,
  signal?: AbortSignal,
): Promise<InferenceKeyListResponse> {
  if (!modelName.trim()) {
    return Promise.reject(new ApiError("缺少模型名称，无法获取可用的 API Key"));
  }
  return coreRequest<InferenceKeyListResponse>("/inference-keys", {
    method: "GET",
    params: { page, pageSize, served_model_name: modelName },
    signal,
  });
}
