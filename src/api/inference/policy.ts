import { coreRequest } from "@/api/request";
import type {
  InferencePolicyResponse,
  UpdateInferencePolicyInput,
  UpdateInferencePolicyRequest,
} from "./types";

const policyPath = (id: string) => `/inference/services/${encodeURIComponent(id)}/policy`;

// PUT 完整替换；后端未声明幂等键或版本号，不追加 token，省略 rate_limits 表示移除限制。
export async function updateInferencePolicy(
  id: string,
  input: UpdateInferencePolicyInput,
): Promise<void> {
  await coreRequest<InferencePolicyResponse, UpdateInferencePolicyRequest>(policyPath(id), {
    method: "PUT",
    data: { policy: input },
  });
}
