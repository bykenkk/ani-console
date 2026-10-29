import { isDateTimeExpired } from "@/lib/date";
import type { InferenceKey } from "./types";

export function getInferenceKeyExclusionReason(
  key: InferenceKey,
  modelName: string,
  serviceId: string,
): string | undefined {
  if (key.revoked_at) return "已撤销";
  if (isDateTimeExpired(key.expires_at)) return "已过期";
  if (key.allowed_model_names?.length && !key.allowed_model_names.includes(modelName))
    return "未授权此模型";
  // 存量 Key 仍可能带服务范围，隐藏创建字段不意味着可以忽略已有授权。
  if (key.allowed_service_ids?.length && !key.allowed_service_ids.includes(serviceId))
    return "未授权此推理服务";
  return undefined;
}

export function getInferenceKeyUnavailableReason(
  key: InferenceKey,
  modelName: string,
  serviceId: string,
): string | undefined {
  return (
    getInferenceKeyExclusionReason(key, modelName, serviceId) ??
    (!key.secret?.trim() ? "未返回密钥" : undefined)
  );
}
