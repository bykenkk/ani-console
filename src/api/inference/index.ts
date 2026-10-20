import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
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
} from "./types";

const createScope = createIdempotencyScope("governance-inference-create", ["POST"]);
const deleteScope = createIdempotencyScope("governance-inference-delete", ["POST"]);
const servicePath = (id: string) => `/inference/services/${encodeURIComponent(id)}`;

// FIXME(inference-contract): 当前索引已移除推理管理路由；用户确认保留原分支 page/pageSize、status/capability 与 items/total 契约。
// TODO(inference-contract): 对应后端版本及路由恢复后复核请求/响应、幂等和运行时行为，再移除标记。
export function listInferenceServices(params: InferenceListParams = {}, signal?: AbortSignal) {
  return coreRequest<InferenceListResponse>("/inference/services", {
    method: "GET",
    params,
    signal,
  });
}
// FIXME(inference-contract): 当前索引未开放推理详情；用户确认保留原分支详情契约，不回退 legacy。
// TODO(inference-contract): 对应后端版本及路由恢复后复核请求/响应、幂等和运行时行为，再移除标记。
export function getInferenceService(id: string, signal?: AbortSignal) {
  return coreRequest<InferenceService>(servicePath(id), {
    method: "GET",
    signal,
  });
}
// FIXME(inference-contract): 当前索引未开放推理创建；用户确认保留原分支请求及幂等机制，不将受理视为完成。
// TODO(inference-contract): 对应后端版本及路由恢复后复核请求/响应、幂等和运行时行为，再移除标记。
export function createInferenceService(input: CreateInferenceInput): Promise<void> {
  return runIdempotentRequest(createScope, input, async (data) => {
    await coreRequest<InferenceAcceptance, CreateInferenceRequest>("/inference/services", {
      method: "POST",
      data: { data },
    });
  });
}
// FIXME(inference-contract): 当前索引未开放推理删除；用户确认保留原分支 :delete、expected_generation 和幂等请求。
// TODO(inference-contract): 对应后端版本及路由恢复后复核请求/响应、幂等和运行时行为，再移除标记。
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
        data: { data },
      });
    },
    [id],
  );
}
// FIXME(inference-contract): 当前索引已移除推理操作查询；保留原实现供后续恢复，本次不从创建/删除入口调用。
// TODO(inference-contract): 对应后端版本及路由恢复后复核请求/响应、幂等和运行时行为，再移除标记。
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
// FIXME(governance-migration): 尚未迁移的 Services 能力保留独立命名空间，逐项迁移后移除。
// TODO(governance-migration): 迁移完成后移除该旧接口命名空间；不得用于新资源兜底。
export * as legacyInference from "./legacy";
