// TODO(modeldev-integration): 文档已声明部署；仍需前端联调验证停止、分页、日志、产物及下载。
import { coreRequest } from "@/api/request";
import type { PageParams } from "@/api/types";
import type {
  ModelDevExecutionListResponse,
  ModelDevExecution,
  ModelDevLogParams,
  ModelDevExecutionLogs,
  ModelDevArtifactListResponse,
  ModelDevArtifactDownload,
} from "./types";

const executionPath = (id: string) => `/modeldev/executions/${encodeURIComponent(id)}`;

export function listModelDevExecutions(
  params: PageParams = {},
  signal?: AbortSignal,
): Promise<ModelDevExecutionListResponse> {
  return coreRequest<ModelDevExecutionListResponse>("/modeldev/executions", {
    method: "GET",
    params,
    signal,
  });
}
export function getModelDevExecution(id: string, signal?: AbortSignal): Promise<ModelDevExecution> {
  return coreRequest<ModelDevExecution>(executionPath(id), { method: "GET", signal });
}
export async function stopModelDevExecution(id: string, signal?: AbortSignal): Promise<void> {
  await coreRequest<unknown>(`${executionPath(id)}:stop`, {
    method: "POST",
    signal,
  });
}
export function getModelDevExecutionLogs(
  id: string,
  params: ModelDevLogParams = {},
  signal?: AbortSignal,
): Promise<ModelDevExecutionLogs> {
  return coreRequest<ModelDevExecutionLogs>(`${executionPath(id)}/logs`, {
    method: "GET",
    params,
    signal,
  });
}
export function listModelDevExecutionArtifacts(
  id: string,
  params: PageParams = {},
  signal?: AbortSignal,
): Promise<ModelDevArtifactListResponse> {
  return coreRequest<ModelDevArtifactListResponse>(`${executionPath(id)}/artifacts`, {
    method: "GET",
    params,
    signal,
  });
}
/** Short-lived download authorization. Do not persist the returned URL. */
export function authorizeModelDevArtifactDownload(
  id: string,
  signal?: AbortSignal,
): Promise<ModelDevArtifactDownload> {
  return coreRequest<ModelDevArtifactDownload>(
    `/modeldev/artifacts/${encodeURIComponent(id)}/content`,
    { method: "GET", signal },
  );
}
