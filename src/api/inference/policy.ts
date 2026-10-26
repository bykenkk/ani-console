import { coreRequest } from "@/api/request";
import type {
  InferencePolicyResponse,
  UpdateInferencePolicyInput,
  UpdateInferencePolicyRequest,
} from "./types";

const policyPath = (id: string) => `/inference/services/${encodeURIComponent(id)}/policy`;

// TODO(inference-policy): 联调默认所属租户、角色授权和跨租户隔离。
export function getInferencePolicy(id: string, signal?: AbortSignal) {
  return coreRequest<InferencePolicyResponse>(policyPath(id), { method: "GET", signal });
}

// PUT 完整替换；后端未声明幂等键或版本号，不追加 token，省略 rate_limits 表示移除限制。
// TODO(inference-policy): 联调空白名单、额度替换、零值不限及并发保存行为。
export async function updateInferencePolicy(
  id: string,
  input: UpdateInferencePolicyInput,
): Promise<void> {
  await coreRequest<InferencePolicyResponse, UpdateInferencePolicyRequest>(policyPath(id), {
    method: "PUT",
    data: { policy: input },
  });
}
