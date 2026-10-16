// FIXME(governance-migration): governance 使用 models/model/versions 包装及 page.limit/page.cursor，不能复用旧 Services 响应。
// TODO(governance-migration): 补齐导入任务查询与重试接入；导入受理不能视为模型或版本已 ready。
import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  ImportModelInput,
  ImportModelRequest,
  Model,
  ModelListParams,
  ModelListResponse,
  ModelPageParams,
  ModelVersionListResponse,
  ModelVersionResponse,
} from "./types";

const importScope = createIdempotencyScope("model-import", ["POST"]);

export function listModels(params: ModelListParams = {}, signal?: AbortSignal) {
  const { limit, cursor, ...filters } = params;
  return coreRequest<ModelListResponse>("/models", {
    method: "GET",
    params: { ...filters, "page.limit": limit, "page.cursor": cursor },
    signal,
  });
}
export async function getModel(id: string, signal?: AbortSignal): Promise<Model> {
  const response = await coreRequest<{ model: Model }>(`/models/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
  return response.model;
}
export function listModelVersions(id: string, params: ModelPageParams = {}, signal?: AbortSignal) {
  return coreRequest<ModelVersionListResponse>(`/models/${encodeURIComponent(id)}/versions`, {
    method: "GET",
    params: { "page.limit": params.limit, "page.cursor": params.cursor },
    signal,
  });
}
export function getModelVersion(id: string, signal?: AbortSignal) {
  return coreRequest<ModelVersionResponse>(`/model-versions/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}
export function importModel(submitData: ImportModelInput, signal?: AbortSignal): Promise<void> {
  return runIdempotentRequest(importScope, submitData, async (body) => {
    await coreRequest<unknown, ImportModelRequest>("/models:import", {
      method: "POST",
      data: { data: body },
      signal,
    });
  });
}
export type * from "./types";
