import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  BindInferenceKeyPolicyRequest,
  CreateInferenceKeyInput,
  CreateInferenceKeyRequest,
  InferenceKey,
  InferenceKeyCredentials,
  InferenceKeyListParams,
  InferenceKeyListResponse,
  RotateInferenceKeyRequest,
} from "./types";

export type { InferenceKey, InferenceKeyCredentials } from "./types";

const createScope = createIdempotencyScope("inference-key-create", ["POST"]);
const rotateScope = createIdempotencyScope("inference-key-rotate", ["POST"]);

export function listInferenceKeys(params: InferenceKeyListParams = {}, signal?: AbortSignal) {
  return coreRequest<InferenceKeyListResponse>("/inference-keys", {
    method: "GET",
    params,
    signal,
  });
}

export function getInferenceKey(keyId: string, signal?: AbortSignal) {
  return coreRequest<InferenceKey>(`/inference-keys/${encodeURIComponent(keyId)}`, {
    method: "GET",
    signal,
  });
}

export { getInferenceKeyUnavailableReason } from "./availability";
export { listModelInferenceKeys } from "./model-options";

// 凭证交付保留本次响应；资源列表仍通过查询刷新，不使用写入响应更新缓存。
export function createInferenceKey(input: CreateInferenceKeyInput) {
  return runIdempotentRequest(createScope, input, (data) =>
    coreRequest<InferenceKeyCredentials, CreateInferenceKeyRequest>("/inference-keys", {
      method: "POST",
      data: { data },
    }),
  );
}

export function rotateInferenceKey(keyId: string) {
  return runIdempotentRequest(
    rotateScope,
    {},
    (data) =>
      coreRequest<InferenceKeyCredentials, RotateInferenceKeyRequest>(
        `/inference-keys/${encodeURIComponent(keyId)}:rotate`,
        { method: "POST", data: { data } },
      ),
    [keyId],
  );
}

// DELETE 契约不接受请求体，也未声明客户端幂等字段。
export async function revokeInferenceKey(keyId: string): Promise<void> {
  await coreRequest<InferenceKey>(`/inference-keys/${encodeURIComponent(keyId)}`, {
    method: "DELETE",
  });
}

export async function bindInferenceKeyPolicy(keyId: string, policyId: string): Promise<void> {
  await coreRequest<InferenceKey, BindInferenceKeyPolicyRequest>(
    `/inference-keys/${encodeURIComponent(keyId)}:bind-policy`,
    { method: "POST", data: { data: { policy_id: policyId } } },
  );
}
