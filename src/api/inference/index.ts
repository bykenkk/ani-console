// Governance owns the public inference list. The filters are forwarded to the
// inference owner; the API, rather than the Console, decides whether a service
// is callable.
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

export function listInferenceServices(params: InferenceListParams = {}, signal?: AbortSignal) {
  return coreRequest<InferenceListResponse>("/inference/services", {
    method: "GET",
    params,
    signal,
  });
}
export function getInferenceService(id: string, signal?: AbortSignal) {
  return coreRequest<InferenceService>(servicePath(id), {
    method: "GET",
    signal,
  });
}
export function createInferenceService(input: CreateInferenceInput) {
  return runIdempotentRequest(createScope, input, (data) =>
    coreRequest<InferenceAcceptance, CreateInferenceRequest>("/inference/services", {
      method: "POST",
      data: { data },
    }),
  );
}
export function deleteInferenceService(id: string, input: DeleteInferenceInput = {}) {
  return runIdempotentRequest(
    deleteScope,
    input,
    (data) =>
      coreRequest<InferenceAcceptance, DeleteInferenceRequest>(`${servicePath(id)}:delete`, {
        method: "POST",
        data: { data },
      }),
    [id],
  );
}
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
export * as legacyInference from "./legacy";
