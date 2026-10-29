import type { PageParams } from "@/api/types";

/** 已授权的列表和详情可返回 secret；存量密钥可能未保存明文。 */
export interface InferenceKey {
  id: string;
  name: string;
  key_prefix: string;
  secret?: string;
  /** 历史记录可能未绑定；缺失不代表无限制。 */
  policy_id?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_by: string;
  created_at?: string | null;
  last_used_at?: string | null;
  version: string;
}

/** 管理列表分页参数；模型筛选由 listModelInferenceKeys 单独接入。page 和 pageSize 均为 1..100。 */
export type InferenceKeyListParams = PageParams;

export interface InferenceKeyListResponse {
  items: InferenceKey[];
  total: string;
}

export interface CreateInferenceKeyInput {
  name: string;
  policy_id: string;
  expires_at?: string;
}

export interface CreateInferenceKeyRequest {
  data: CreateInferenceKeyInput & { idempotency_key: string };
}

export interface RotateInferenceKeyRequest {
  data: { idempotency_key: string };
}

export interface BindInferenceKeyPolicyRequest {
  data: { policy_id: string };
}

/** 首次签发返回 secret；幂等重放时通过详情恢复当前密钥。 */
export interface InferenceKeyCredentials {
  key: InferenceKey;
  secret?: string;
  replayed?: boolean;
}
