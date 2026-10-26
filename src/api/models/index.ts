import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateModelInput,
  CreateModelRequest,
  CreateModelVersionInput,
  CreateModelVersionRequest,
  ImportModelBundleInput,
  ImportModelBundleRequest,
  ImportModelBundleResponse,
  ImportModelInput,
  ImportModelRequest,
  ImportTask,
  Model,
  ModelListParams,
  ModelListResponse,
  ModelPageParams,
  ModelVersionListParams,
  ModelOperationListResponse,
  ModelVersion,
  ModelVersionListResponse,
  ModelVersionResponse,
  SearchExternalModelsParams,
  SearchExternalModelsResponse,
} from "./types";

const createModelScope = createIdempotencyScope("model-create", ["POST"]);
const createModelVersionScope = createIdempotencyScope("model-version-create", ["POST"]);
const importScope = createIdempotencyScope("model-import", ["POST"]);
const importBundleScope = createIdempotencyScope("model-import-bundle", ["POST"]);

// TODO(model-contract): 联调页码分页、筛选、直接跳页和空页的 items/total。
export function listModels(params: ModelListParams = {}, signal?: AbortSignal) {
  return coreRequest<ModelListResponse>("/models", {
    method: "GET",
    params,
    signal,
  });
}
// TODO(model-contract): 已核对 HTTP 直接返回 Model；待部署后联调详情、版本回填及错误语义。
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

// TODO(model-contract): 已核对顶层业务字段及幂等键；待部署后联调创建、重复提交及错误响应。
export function createModel(submitData: CreateModelInput, signal?: AbortSignal): Promise<void> {
  return runIdempotentRequest(createModelScope, submitData, async (body) => {
    await coreRequest<{ model: Model }, CreateModelRequest>("/models", {
      method: "POST",
      data: body,
      signal,
    });
  });
}

// TODO(model-contract): 已核对版本创建的顶层业务字段；待部署后联调版本字段、幂等及重复提交行为。
export function createModelVersion(
  submitData: CreateModelVersionInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(createModelVersionScope, submitData, async (body) => {
    await coreRequest<{ version: ModelVersion }, CreateModelVersionRequest>("/model-versions", {
      method: "POST",
      data: body,
      signal,
    });
  });
}

// FIXME(model-pagination): 当前后端将 page 误限为 1–100；待解除页码上限后复核直接跳页，不在前端截断 total 或模拟分页。
// TODO(model-contract): 联调 status 服务端筛选、模型归属及空列表。
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
// TODO(model-operations): 联调租户隔离、真实 total、操作人及 accepted/succeeded/failed 结果，不将 accepted 展示为完成。
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
// TODO(model-contract): 已核对模型导入的顶层业务字段；待部署后联调幂等及受理语义，任务跟踪后续统一接入。
export function importModel(submitData: ImportModelInput, signal?: AbortSignal): Promise<void> {
  return runIdempotentRequest(importScope, submitData, async (body) => {
    await coreRequest<{ task: ImportTask }, ImportModelRequest>("/models:import", {
      method: "POST",
      data: body,
      signal,
    });
  });
}

// TODO(model-contract): 已核对组合导入的顶层 model/version/source 结构；待部署后联调幂等和失败重试，任务跟踪后续统一接入。
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
