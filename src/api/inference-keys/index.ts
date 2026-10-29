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

export type {
  CreateInferenceKeyInput,
  InferenceKey,
  InferenceKeyCredentials,
  InferenceKeyListParams,
  InferenceKeyListResponse,
} from "./types";

const createScope = createIdempotencyScope("inference-key-create", ["POST"]);
const rotateScope = createIdempotencyScope("inference-key-rotate", ["POST"]);

// TODO(inference-keys): 待部署后联调租户权限、空列表、直接跳页及 total 字符串返回。
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
// TODO(inference-keys): 待部署后联调首次签发、响应丢失后的幂等重放及权限隔离。
export function createInferenceKey(input: CreateInferenceKeyInput) {
  return runIdempotentRequest(createScope, input, (data) =>
    coreRequest<InferenceKeyCredentials, CreateInferenceKeyRequest>("/inference-keys", {
      method: "POST",
      data: { data },
    }),
  );
}

// TODO(inference-keys): 联调首次响应丢失后的密钥恢复、轮换重放及旧密钥失效。
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
// TODO(inference-keys): 联调撤销权限、重复撤销及撤销后的推理访问失效。
export async function revokeInferenceKey(keyId: string): Promise<void> {
  await coreRequest<InferenceKey>(`/inference-keys/${encodeURIComponent(keyId)}`, {
    method: "DELETE",
  });
}

// TODO(inference-key-policy): 部署后验证换绑授权、计数保留和跨租户拒绝。
export async function bindInferenceKeyPolicy(keyId: string, policyId: string): Promise<void> {
  await coreRequest<InferenceKey, BindInferenceKeyPolicyRequest>(
    `/inference-keys/${encodeURIComponent(keyId)}:bind-policy`,
    { method: "POST", data: { data: { policy_id: policyId } } },
  );
}
