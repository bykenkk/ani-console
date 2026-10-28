import type { PageParams } from "@/api/types";

/** 推理调用凭证元数据；列表和详情不返回密钥明文。 */
export interface InferenceKey {
  id: string;
  name: string;
  key_prefix: string;
  allowed_service_ids?: string[];
  allowed_model_names?: string[];
  requests_per_second?: number;
  requests_per_minute?: number;
  requests_per_hour?: number;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_by: string;
  created_at?: string | null;
  last_used_at?: string | null;
  version: string;
}

/** page 和 pageSize 均为 1..100；接口不接受筛选或排序参数。 */
export type InferenceKeyListParams = PageParams;

export interface InferenceKeyListResponse {
  items: InferenceKey[];
  total: string;
}

export interface CreateInferenceKeyInput {
  name: string;
  allowed_service_ids: string[];
  allowed_model_names: string[];
  requests_per_second: number;
  requests_per_minute: number;
  requests_per_hour: number;
  expires_at?: string;
}

export interface CreateInferenceKeyRequest {
  data: CreateInferenceKeyInput & { idempotency_key: string };
}

export interface RotateInferenceKeyRequest {
  data: { idempotency_key: string };
}

/** 首次签发才有 secret；幂等重放只返回元数据。 */
export interface InferenceKeyCredentials {
  key: InferenceKey;
  secret?: string;
  replayed?: boolean;
}
