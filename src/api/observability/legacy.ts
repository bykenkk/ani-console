// TODO(governance-migration): 保留旧监控查询契约，待旧实例监控全部迁移后移除。
import { ApiError, coreRequest } from "@/api/request";
import type {
  ObservabilityRangeQueryParams,
  ObservabilityRangeQueryResponse,
  ResourceTrendQueryParams,
} from "./types-legacy";

export * from "./types-legacy";

export function queryObservabilityRange(
  params: ObservabilityRangeQueryParams & { query: string },
): Promise<ObservabilityRangeQueryResponse> {
  return coreRequest<ObservabilityRangeQueryResponse>("/observability/query_range", {
    method: "GET",
    params,
  });
}

export async function queryResourceTrend(
  params: ResourceTrendQueryParams,
): Promise<ObservabilityRangeQueryResponse> {
  const response = await coreRequest<ObservabilityRangeQueryResponse>(
    "/observability/resource_trend",
    {
      method: "GET",
      params,
    },
  );
  if (!response.dev_profile.real_provider) {
    throw new ApiError(response.dev_profile.reason || "数据服务暂不可用");
  }
  return response;
}
