import type { PageParams } from "@/api/types";

export interface InferencePolicyInput {
  name: string;
  allowed_model_names: string[];
  requests_per_second: number;
  requests_per_minute: number;
  requests_per_hour: number;
}

export interface InferencePolicy extends InferencePolicyInput {
  id: string;
  version: string;
}

/** page 和 pageSize 均为 1..100；不接受筛选或排序参数。 */
export type InferencePolicyListParams = PageParams;

export interface InferencePolicyListResponse {
  items: InferencePolicy[];
  total: string;
}

export interface SaveInferencePolicyRequest {
  data: InferencePolicyInput;
}
