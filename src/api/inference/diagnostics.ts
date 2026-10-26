import { coreRequest } from "@/api/request";
import type {
  InferenceRuntimeDiagnostics,
  InferenceLogParams,
  InferenceLogsResponse,
  InferenceEventParams,
  InferenceEventsResponse,
  InferenceMetricsParams,
  InferenceMetricsResponse,
} from "./types";

const servicePath = (id: string) => `/inference/services/${encodeURIComponent(id)}`;

// FIXME(inference-health): BFF 透传调用健康；完整枚举、unknown 原因和探测更新机制仍待 owner 确认，不由运行阶段推算健康。
// TODO(inference-diagnostics): 联调 owner 诊断服务、访问权限、健康原因和独立观测时间。
export function getInferenceRuntime(id: string, signal?: AbortSignal) {
  return coreRequest<InferenceRuntimeDiagnostics>(`${servicePath(id)}/runtime`, {
    method: "GET",
    signal,
  });
}

// TODO(inference-metrics): 联调 Prometheus 配置、CPU/内存单位、空序列及 24 小时/1440 区间边界。
export function getInferenceMetrics(
  id: string,
  params: InferenceMetricsParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<InferenceMetricsResponse>(`${servicePath(id)}/metrics`, {
    method: "GET",
    params,
    signal,
  });
}

// TODO(inference-logs): 联调实例/容器授权、时间范围、截断标记及空日志。
export function getInferenceLogs(
  id: string,
  params: InferenceLogParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<InferenceLogsResponse>(`${servicePath(id)}/logs`, {
    method: "GET",
    params,
    signal,
  });
}

// TODO(inference-logs): 联调 log/heartbeat/done/error SSE 事件、401 刷新、429、五分钟断流和主动取消。
export function streamInferenceLogs(id: string, params: InferenceLogParams, signal: AbortSignal) {
  return coreRequest<ReadableStream<Uint8Array>>(`${servicePath(id)}/logs:stream`, {
    method: "GET",
    params,
    signal,
    adapter: "fetch",
    responseType: "stream",
  });
}

// FIXME(inference-events): 当前 BFF 分页解析允许前导零等非规范数字；待后端收紧参数校验，前端仅发送正常页码。
// TODO(inference-events): 联调时间/类型筛选、跨页真实 total、租户隔离和空列表。
export function listInferenceEvents(
  id: string,
  params: InferenceEventParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<InferenceEventsResponse>(`${servicePath(id)}/events`, {
    method: "GET",
    params,
    signal,
  });
}
