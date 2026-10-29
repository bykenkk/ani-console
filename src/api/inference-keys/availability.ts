import { isDateTimeExpired } from "@/lib/date";
import type { InferenceKey } from "./types";

/** 仅做发送前可用性检查；模型授权与实际限流由推理后端执行。 */
export function getInferenceKeyUnavailableReason(key: InferenceKey): string | undefined {
  if (key.revoked_at) return "已撤销";
  if (isDateTimeExpired(key.expires_at)) return "已过期";
  if (!key.policy_id) return "未绑定策略";
  return !key.secret?.trim() ? "未返回密钥，请在模型 API Key 管理中重置" : undefined;
}
