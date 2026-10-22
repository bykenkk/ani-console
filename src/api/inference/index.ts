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
  InferenceOperation,
  InferenceOperationResponse,
  InferenceCommand,
  InferenceCommandInput,
  InferenceCommandRequest,
  UpdateInferenceInput,
  UpdateInferenceRequest,
} from "./types";

const createScope = createIdempotencyScope("governance-inference-create", ["POST"]);
const deleteScope = createIdempotencyScope("governance-inference-delete", ["POST"]);
const updateScope = createIdempotencyScope("governance-inference-update", ["POST"]);
const commandScopes = {
  start: createIdempotencyScope("governance-inference-start", ["POST"]),
  stop: createIdempotencyScope("governance-inference-stop", ["POST"]),
  restart: createIdempotencyScope("governance-inference-restart", ["POST"]),
};
const servicePath = (id: string) => `/inference/services/${encodeURIComponent(id)}`;

// 与容器共用 ComputePreset DTO；用途由 API 固定，分别执行业务授权。
// TODO(inference-presets): 联调 INFERENCE 权限、分页和 GPU 目录降级。
export function listInferencePresets(params: InstancePresetListParams = {}, signal?: AbortSignal) {
  return coreRequest<InstancePresetListResponse>("/compute-presets", {
    method: "GET",
    params: { ...params, usage: "INFERENCE" },
    signal,
  });
}

// TODO(inference-contract): 已静态核对 Governance 列表路由及 page/pageSize、status/capability、items/total；待部署后联调。
export function listInferenceServices(params: InferenceListParams = {}, signal?: AbortSignal) {
  return coreRequest<InferenceListResponse>("/inference/services", {
    method: "GET",
    params,
    signal,
  });
}
// TODO(inference-contract): 已静态核对 Governance 详情路由；待部署后联调资源状态与算力快照，不回退 legacy。
export function getInferenceService(id: string, signal?: AbortSignal) {
  return coreRequest<InferenceService>(servicePath(id), {
    method: "GET",
    signal,
  });
}
// TODO(inference-contract): 联调 preset_id、CPU/GPU 创建、同意图幂等重试与异步受理。
export function createInferenceService(input: CreateInferenceInput): Promise<void> {
  return runIdempotentRequest(createScope, input, async (data) => {
    await coreRequest<InferenceAcceptance, CreateInferenceRequest>("/inference/services", {
      method: "POST",
      // TODO(inference-contract): 待后端统一提交数据格式后移除请求体的 data 包装，并同步调整请求类型；当前遵循现有契约。
      data: { data },
    });
  });
}
// TODO(inference-contract): 已静态核对 :delete 路由、幂等及异步受理；待部署后联调 CPU/GPU 删除与 generation 校验。
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
        // TODO(inference-contract): 后端当前要求 data 包装；待统一提交格式后同步调整请求类型并联调。
        data: { data },
      });
    },
    [id],
  );
}
// TODO(inference-task): Governance 已注册操作查询；任务跟踪暂缓接入，后续统一处理并联调投递、退款状态。
export async function getInferenceOperation(
  id: string,
  signal?: AbortSignal,
): Promise<InferenceOperation> {
  const response = await coreRequest<InferenceOperationResponse>(
    `/inference/operations/${encodeURIComponent(id)}`,
    {
      method: "GET",
      signal,
    },
  );
  return {
    id: response.id,
    service_id: response.serviceId,
    kind: response.kind,
    phase: response.phase,
    step: response.step,
    target_generation: response.targetGeneration,
    error_code: response.errorCode,
    error_message: response.errorMessage,
    created_at: response.createdAt,
    completed_at: response.completedAt,
  };
}
export type * from "./types";
// TODO(inference-contract): 后端当前要求 data 包装；待统一提交格式后迁移。联调更新掩码、generation 冲突及幂等重试。
export function updateInferenceService(id: string, input: UpdateInferenceInput): Promise<void> {
  return runIdempotentRequest(
    updateScope,
    input,
    async (data) => {
      await coreRequest<InferenceAcceptance, UpdateInferenceRequest>(`${servicePath(id)}:update`, {
        method: "POST",
        // ProtoJSON FieldMask 使用逗号分隔的 lowerCamel 路径；engine 必须整组替换。
        data: { data: { ...data, resource_id: id, update_mask: data.update_mask.join(",") } },
      });
    },
    [id],
  );
}

// TODO(inference-contract): 后端当前要求 data 包装；待统一提交格式后迁移。联调启停、重启与异步受理。
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
          data: { data: { ...data, resource_id: id } },
        },
      );
    },
    [id],
  );
}
// FIXME(governance-migration): 尚未迁移的 Services 能力保留独立命名空间，逐项迁移后移除。
// TODO(governance-migration): 迁移完成后移除该旧接口命名空间；不得用于新资源兜底。
export * as legacyInference from "./legacy";
