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

// TODO(model-contract): 联调当前游标分页、筛选、空页及游标失效；后端提供正式页码契约后迁移，不伪造 total。
export function listModels(params: ModelListParams = {}, signal?: AbortSignal) {
  const { limit, cursor, ...filters } = params;
  return coreRequest<ModelListResponse>("/models", {
    method: "GET",
    params: { ...filters, "page.limit": limit, "page.cursor": cursor },
    signal,
  });
}
// FIXME(model-contract): 当前索引仍返回 model 包装，与仓库普通详情直返约定存在差异；现有实现读取 response.model，仍待与目标版本对齐。
// TODO(model-contract): 待目标后端版本确认后复核详情响应及错误语义并联调。
export async function getModel(id: string, signal?: AbortSignal): Promise<Model> {
  const response = await coreRequest<{ model: Model }>(`/models/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
  return response.model;
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

// FIXME(model-contract): 当前索引的创建响应带 model 包装；现有实现丢弃提交响应，请求契约仍待与目标版本对齐。
// TODO(model-contract): 目标版本明确后复核创建字段、幂等及受理语义并联调。
export function createModel(submitData: CreateModelInput, signal?: AbortSignal): Promise<void> {
  return runIdempotentRequest(createModelScope, submitData, async (body) => {
    await coreRequest<{ model: Model }, { data: CreateModelRequest }>("/models", {
      method: "POST",
      data: { data: body },
      signal,
    });
  });
}

// FIXME(model-contract): 模型版本创建尚未与目标部署版本联调；现有实现丢弃提交响应，请求契约仍待验证。
// TODO(model-contract): 目标版本明确后复核版本字段、幂等及重复提交行为。
export function createModelVersion(
  submitData: CreateModelVersionInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(createModelVersionScope, submitData, async (body) => {
    await coreRequest<{ version: ModelVersion }, { data: CreateModelVersionRequest }>(
      "/model-versions",
      {
        method: "POST",
        data: { data: body },
        signal,
      },
    );
  });
}

// TODO(model-contract): 联调当前版本游标分页、模型归属及空列表；后端提供正式页码契约后迁移。
export function listModelVersions(id: string, params: ModelPageParams = {}, signal?: AbortSignal) {
  const { limit, cursor } = params;
  return coreRequest<ModelVersionListResponse>(`/models/${encodeURIComponent(id)}/versions`, {
    method: "GET",
    params: { "page.limit": limit, "page.cursor": cursor },
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
// FIXME(model-contract): 现有导入请求仍待与目标部署版本联调；提交响应不用于任务跟踪。
// TODO(model-contract): 确认导入字段、幂等及受理语义；任务跟踪后续统一接入。
export function importModel(submitData: ImportModelInput, signal?: AbortSignal): Promise<void> {
  return runIdempotentRequest(importScope, submitData, async (body) => {
    await coreRequest<{ task: ImportTask }, ImportModelRequest>("/models:import", {
      method: "POST",
      data: { data: body },
      signal,
    });
  });
}

// FIXME(model-contract): 当前索引尚未确认现有 models:import-bundle 组合导入路径和请求结构。
// TODO(model-contract): 取得对应后端版本后核对组合导入、幂等与失败重试；后续统一接入任务跟踪。
export function importModelBundle(
  submitData: ImportModelBundleInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(importBundleScope, submitData, async (body) => {
    await coreRequest<ImportModelBundleResponse, ImportModelBundleRequest>(
      "/models:import-bundle",
      {
        method: "POST",
        data: { data: body },
        signal,
      },
    );
  });
}
export type * from "./types";
