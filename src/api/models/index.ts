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

export function listModels(params: ModelListParams = {}, signal?: AbortSignal) {
  return coreRequest<ModelListResponse>("/models", {
    method: "GET",
    params,
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

export function createModel(submitData: CreateModelInput, signal?: AbortSignal): Promise<Model> {
  return runIdempotentRequest(createModelScope, submitData, (body) =>
    coreRequest<{ model: Model }, { data: CreateModelRequest }>("/models", {
      method: "POST",
      data: { data: body },
      signal,
    }),
  ).then((response) => response.model);
}

export function createModelVersion(
  submitData: CreateModelVersionInput,
  signal?: AbortSignal,
): Promise<ModelVersion> {
  return runIdempotentRequest(createModelVersionScope, submitData, (body) =>
    coreRequest<{ version: ModelVersion }, { data: CreateModelVersionRequest }>("/model-versions", {
      method: "POST",
      data: { data: body },
      signal,
    }),
  ).then((response) => response.version);
}

export function listModelVersions(id: string, params: ModelPageParams = {}, signal?: AbortSignal) {
  return coreRequest<ModelVersionListResponse>(`/models/${encodeURIComponent(id)}/versions`, {
    method: "GET",
    params,
    signal,
  });
}
export function getModelVersion(id: string, signal?: AbortSignal) {
  return coreRequest<ModelVersionResponse>(`/model-versions/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}
export function importModel(
  submitData: ImportModelInput,
  signal?: AbortSignal,
): Promise<ImportTask> {
  return runIdempotentRequest(importScope, submitData, (body) =>
    coreRequest<{ task: ImportTask }, ImportModelRequest>("/models:import", {
      method: "POST",
      data: { data: body },
      signal,
    }),
  ).then((response) => response.task);
}

export function importModelBundle(
  submitData: ImportModelBundleInput,
  signal?: AbortSignal,
): Promise<ImportModelBundleResponse> {
  return runIdempotentRequest(importBundleScope, submitData, (body) =>
    coreRequest<ImportModelBundleResponse, ImportModelBundleRequest>("/models:import-bundle", {
      method: "POST",
      data: { data: body },
      signal,
    }),
  );
}
export type * from "./types";
