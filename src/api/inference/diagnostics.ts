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
export function getInferenceRuntime(id: string, signal?: AbortSignal) {
  return coreRequest<InferenceRuntimeDiagnostics>(`${servicePath(id)}/runtime`, {
    method: "GET",
    signal,
  });
}

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
