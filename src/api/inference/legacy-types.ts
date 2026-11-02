// 旧 ANI Services 响应类型，仅供 legacy.ts 及其存量调用方使用。
// TODO(governance-migration): 随旧扩缩容和访问策略调用迁移移除；不得与 Governance 类型混用。

export interface UpdateInferenceServiceInput {
  replicas: number;
}

export interface UpdateInferenceServiceRequest extends UpdateInferenceServiceInput {
  idempotency_key: string;
}

export interface InferenceOperation {
  id: string;
  idempotency_key: string;
  task_type: string;
  resource_type: string;
  resource_id?: string | null;
  status: string;
  attempt_count: number;
  progress_pct: number;
  error_message?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
}

export interface InferenceAccessPolicy {
  id: string;
  tenant_id: string;
  name: string;
  status: "enabled" | "disabled";
  description?: string | null;
  priority: number;
  scope: {
    type: "tenant_default" | "inference_service" | "api_key" | "inference_service_api_key";
    inference_service_ids?: string[];
    api_key_ids?: string[];
  };
  access: {
    allow_all_tenant_keys: boolean;
    allow_api_key_ids?: string[];
    deny_api_key_ids?: string[];
  };
  rate_limits: { qps?: number | null; rpm?: number | null };
  concurrency: { max_in_flight?: number | null; lease_ttl_seconds?: number };
  created_at: string;
  updated_at?: string | null;
}

export interface InferenceServicePolicies {
  service_id: string;
  policies: InferenceAccessPolicy[];
}
