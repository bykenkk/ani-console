import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  ImportModelBundleInput,
  ImportModelBundleRequest,
  ImportModelBundleResponse,
  Model,
  ModelListParams,
  ModelListResponse,
  ModelPageParams,
  ModelVersionListParams,
  ModelOperationListResponse,
  ModelVersionListResponse,
  ModelVersionResponse,
  SearchExternalModelsParams,
  SearchExternalModelsResponse,
} from "./types";

const importBundleScope = createIdempotencyScope("model-import-bundle", ["POST"]);

export function listModels(params: ModelListParams = {}, signal?: AbortSignal) {
  return coreRequest<ModelListResponse>("/models", {
    method: "GET",
    params,
    signal,
  });
}
export function getModel(id: string, signal?: AbortSignal): Promise<Model> {
  return coreRequest<Model>(`/models/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}

// FIXME(model-contract): 当前使用 DELETE 请求；目标部署版本与删除完成语义仍待核对。
// TODO(model-contract): 确认目标后端的同步/异步删除及幂等要求，联调后复核成功反馈与关联刷新。
export function deleteModel(id: string) {
  return coreRequest<void>(`/models/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// FIXME(model-contract): 现有外部搜索分页及候选字段尚未与目标部署版本和当前索引完成对齐。
// TODO(model-contract): 确认对应后端版本的 page/pageSize、items/hasMore 与候选唯一性后联调搜索及取消。
export function searchExternalModels(
  params: SearchExternalModelsParams,
  signal?: AbortSignal,
): Promise<SearchExternalModelsResponse> {
  return coreRequest<SearchExternalModelsResponse>("/models:search", {
    method: "GET",
    params,
    signal,
  });
}

// FIXME(model-pagination): 当前后端将 page 误限为 1–100；待解除页码上限后复核直接跳页，不在前端截断 total 或模拟分页。
export function listModelVersions(
  id: string,
  params: ModelVersionListParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<ModelVersionListResponse>(`/models/${encodeURIComponent(id)}/versions`, {
    method: "GET",
    params,
    signal,
  });
}
// FIXME(model-pagination): 当前后端将操作记录的 page 误限为 1–100，超出会返回 400；待后端修复后复核。
// 不将 accepted 展示为完成。
export function listModelOperations(
  id: string,
  params: ModelPageParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<ModelOperationListResponse>(`/models/${encodeURIComponent(id)}/operations`, {
    method: "GET",
    params,
    signal,
  });
}
// FIXME(model-contract): 原分支保留 model/version 组合响应；目标部署版本及关联资源响应仍待确认。
// TODO(model-contract): 核对目标版本详情字段、模型归属和错误响应后联调。
export function getModelVersion(id: string, signal?: AbortSignal) {
  return coreRequest<ModelVersionResponse>(`/model-versions/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}

// TODO(model-contract): 任务跟踪后续统一接入。
export function importModelBundle(
  submitData: ImportModelBundleInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(importBundleScope, submitData, async (body) => {
    await coreRequest<ImportModelBundleResponse, ImportModelBundleRequest>(
      "/models:import-bundle",
      {
        method: "POST",
        data: body,
        signal,
      },
    );
  });
}
export type * from "./types";
