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

// FIXME(model-contract): 当前后端索引仍为 page.limit/page.cursor 与 models/meta；用户确认本次保留推理分支的 page/pageSize、items/total，不保证该后端版本可用。
// TODO(model-contract): 取得对应后端版本后核对分页、筛选、total 类型并联调成功/空页/越界页。
export function listModels(params: ModelListParams = {}, signal?: AbortSignal) {
  return coreRequest<ModelListResponse>("/models", {
    method: "GET",
    params,
    signal,
  });
}
// FIXME(model-contract): 当前索引仍返回 model 包装，与仓库普通详情直返约定存在差异；用户确认保留原分支解包方式。
// TODO(model-contract): 待目标后端版本确认后复核详情响应及错误语义并联调。
export async function getModel(id: string, signal?: AbortSignal): Promise<Model> {
  const response = await coreRequest<{ model: Model }>(`/models/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
  return response.model;
}

// FIXME(model-contract): 本次按用户确认保留原分支 DELETE 契约；目标部署版本与删除完成语义仍待核对。
// TODO(model-contract): 确认目标后端的同步/异步删除及幂等要求，联调后复核成功反馈与关联刷新。
export function deleteModel(id: string) {
  return coreRequest<void>(`/models/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// FIXME(model-contract): 目标版本的外部搜索分页及候选字段尚未与当前索引完成对齐；用户确认保留原分支契约。
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

// FIXME(model-contract): 当前索引的创建响应带 model 包装；用户确认保留原分支请求，本次仅按规范丢弃提交响应。
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

// FIXME(model-contract): 模型版本创建尚未与目标部署版本联调；用户确认保留原分支请求，本次仅丢弃提交响应。
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

// FIXME(model-contract): 当前索引仍采用游标及 versions/meta，用户确认本次保留原分支 page/pageSize、items/total。
// TODO(model-contract): 确认目标版本后复核版本分页及 total 类型，并联调首次直接跳页与空列表。
export function listModelVersions(id: string, params: ModelPageParams = {}, signal?: AbortSignal) {
  return coreRequest<ModelVersionListResponse>(`/models/${encodeURIComponent(id)}/versions`, {
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
// FIXME(model-contract): 目标版本的导入请求仍待联调，用户确认保留原分支契约；提交响应不再用于任务跟踪。
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

// FIXME(model-contract): 当前索引未确认 models:import-bundle 组合导入契约，用户确认保留原分支路径和请求结构。
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
