import { ApiError, coreRequest } from "@/api/request";
import type {
  InferencePolicy,
  InferencePolicyInput,
  InferencePolicyListParams,
  InferencePolicyListResponse,
  SaveInferencePolicyRequest,
} from "./types";

export type {
  InferencePolicy,
  InferencePolicyInput,
  InferencePolicyListParams,
  InferencePolicyListResponse,
} from "./types";

// TODO(inference-policies): 部署后验证租户隔离、完整替换、空模型拒绝、零限额及绑定删除冲突。
export function listInferencePolicies(
  params: InferencePolicyListParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<InferencePolicyListResponse>("/inference-policies", {
    method: "GET",
    params,
    signal,
  });
}

export function getInferencePolicy(policyId: string, signal?: AbortSignal) {
  return coreRequest<InferencePolicy>(`/inference-policies/${encodeURIComponent(policyId)}`, {
    method: "GET",
    signal,
  });
}

// 策略写入契约不接受客户端幂等字段；成功后由查询刷新资源。
export async function createInferencePolicy(input: InferencePolicyInput): Promise<void> {
  await coreRequest<InferencePolicy, SaveInferencePolicyRequest>("/inference-policies", {
    method: "POST",
    data: { data: input },
  });
}

export async function updateInferencePolicy(
  policyId: string,
  input: InferencePolicyInput,
): Promise<void> {
  await coreRequest<InferencePolicy, SaveInferencePolicyRequest>(
    `/inference-policies/${encodeURIComponent(policyId)}`,
    { method: "PUT", data: { data: input } },
  );
}

export async function deleteInferencePolicy(policyId: string): Promise<void> {
  try {
    await coreRequest<Record<string, never>>(
      `/inference-policies/${encodeURIComponent(policyId)}`,
      {
        method: "DELETE",
      },
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 409 &&
      error.code === "INFERENCE_KEY_CONFLICT"
    ) {
      error.message = "该策略仍被 API Key 绑定，请先更换绑定策略后再删除";
    }
    throw error;
  }
}
