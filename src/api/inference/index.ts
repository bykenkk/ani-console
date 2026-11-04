import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type { InstancePresetListParams, InstancePresetListResponse } from "@/api/instances";
import type {
  CreateInferenceInput,
  CreateInferenceRequest,
  DeleteInferenceInput,
  DeleteInferenceRequest,
  InferenceAcceptance,
  InferenceListParams,
  InferenceListResponse,
  InferenceService,
  InferenceCommand,
  InferenceCommandInput,
  InferenceCommandRequest,
  UpdateInferenceInput,
  UpdateInferenceRequest,
} from "./types";

const createScope = createIdempotencyScope("inference-create", ["POST"]);
const deleteScope = createIdempotencyScope("inference-delete", ["POST"]);
const updateScope = createIdempotencyScope("inference-update", ["POST"]);
const commandScopes = {
  start: createIdempotencyScope("inference-start", ["POST"]),
  stop: createIdempotencyScope("inference-stop", ["POST"]),
  restart: createIdempotencyScope("inference-restart", ["POST"]),
};
const servicePath = (id: string) => `/inference/services/${encodeURIComponent(id)}`;

// 与容器共用 ComputePreset DTO；用途由 API 固定，分别执行业务授权。
export function listInferencePresets(params: InstancePresetListParams = {}, signal?: AbortSignal) {
  return coreRequest<InstancePresetListResponse>("/compute-presets", {
    method: "GET",
    params: { ...params, usage: "INFERENCE" },
    signal,
  });
}

export function listInferenceServices(params: InferenceListParams = {}, signal?: AbortSignal) {
  return coreRequest<InferenceListResponse>("/inference/services", {
    method: "GET",
    params,
    signal,
  });
}
// 详情查询不回退 legacy。
export function getInferenceService(id: string, signal?: AbortSignal) {
  return coreRequest<InferenceService>(servicePath(id), {
    method: "GET",
    signal,
  });
}
export function createInferenceService(input: CreateInferenceInput): Promise<void> {
  return runIdempotentRequest(createScope, input, async (data) => {
    await coreRequest<InferenceAcceptance, CreateInferenceRequest>("/inference/services", {
      method: "POST",
      data,
    });
  });
}
export function deleteInferenceService(
  id: string,
  input: DeleteInferenceInput = {},
): Promise<void> {
  return runIdempotentRequest(
    deleteScope,
    input,
    async (data) => {
      await coreRequest<InferenceAcceptance, DeleteInferenceRequest>(`${servicePath(id)}:delete`, {
        method: "POST",
        data,
      });
    },
    [id],
  );
}

export type * from "./types";
export function updateInferenceService(id: string, input: UpdateInferenceInput): Promise<void> {
  return runIdempotentRequest(
    updateScope,
    input,
    async (data) => {
      await coreRequest<InferenceAcceptance, UpdateInferenceRequest>(`${servicePath(id)}:update`, {
        method: "POST",
        // ProtoJSON FieldMask 使用逗号分隔的 lowerCamel 路径；engine 必须整组替换。
        data: { ...data, resource_id: id, update_mask: data.update_mask.join(",") },
      });
    },
    [id],
  );
}

export function applyInferenceCommand(
  id: string,
  command: InferenceCommand,
  input: InferenceCommandInput,
): Promise<void> {
  return runIdempotentRequest(
    commandScopes[command],
    input,
    async (data) => {
      await coreRequest<InferenceAcceptance, InferenceCommandRequest>(
        `${servicePath(id)}:${command}`,
        {
          method: "POST",
          data: { ...data, resource_id: id },
        },
      );
    },
    [id],
  );
}

export * from "./diagnostics";
export * from "./policy";
export * from "./invocation";
