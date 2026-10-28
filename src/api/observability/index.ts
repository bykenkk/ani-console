import { ApiError, coreRequest } from "@/api/request";
import type { ResourceTrendQueryParams, ResourceTrendQueryResponse } from "./types";

export * from "./types";

const RESOURCE_TREND_ERROR_MESSAGES: Record<string, string> = {
  MONITORING_INVALID_QUERY: "资源趋势查询参数错误",
  FORBIDDEN: "无权查看资源趋势",
  INSTANCE_METRIC_SCOPE_UNAVAILABLE: "租户资源信息暂不可用，请稍后重试",
  MONITORING_RESULT_TOO_LARGE: "资源趋势数据量过大，请稍后重试",
  MONITORING_CONCURRENCY_LIMIT_EXCEEDED: "请求过于频繁，请稍后重试",
  MONITORING_QUERY_FAILED: "资源趋势查询失败，请稍后重试",
  MONITORING_SOURCE_RESPONSE_INVALID: "监控数据源响应异常，请稍后重试",
  MONITORING_SOURCE_UNAVAILABLE: "监控服务暂不可用",
  MONITORING_QUERY_TIMEOUT: "资源趋势查询超时，请稍后重试",
  ECONNABORTED: "资源趋势查询超时，请稍后重试",
  ETIMEDOUT: "资源趋势查询超时，请稍后重试",
};

// TODO(governance-migration): 已按 PR #51 f68375e 核对；部署确认后联调三档趋势、缺数点及权限错误。
export async function queryResourceTrend(
  params: ResourceTrendQueryParams,
  signal?: AbortSignal,
): Promise<ResourceTrendQueryResponse> {
  try {
    return await coreRequest<ResourceTrendQueryResponse>("/observability/resource-trend", {
      method: "GET",
      params,
      signal,
      timeout: 30_000,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const message =
        error.status === 403 ? "无权查看资源趋势" : RESOURCE_TREND_ERROR_MESSAGES[error.code ?? ""];
      if (message) error.message = message;
    }
    throw error;
  }
}
