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
// 同时返回模型归属和版本信息，供关联资源判断所属模型。
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
