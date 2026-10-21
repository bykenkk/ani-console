// TODO(modeldev-integration): 当前 Governance 列表采用 page/pageSize、items/total；联调验证创建、停止、列表跳页、日志、产物及下载，旧交接说明仍待同步。
import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import type { PageParams } from "@/api/types";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  ModelDevExecutionListResponse,
  ModelDevExecution,
  CreateModelDevExecutionInput,
  CreateModelDevExecutionRequest,
  ModelDevLogParams,
  ModelDevExecutionLogs,
  ModelDevArtifactListResponse,
  ModelDevArtifactDownload,
} from "./types";

const createScope = createIdempotencyScope("modeldev-execution-create", ["POST"]);
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
export async function createModelDevExecution(
  input: CreateModelDevExecutionInput,
  signal?: AbortSignal,
): Promise<void> {
  await runIdempotentRequest(createScope, input, async (data: CreateModelDevExecutionRequest) => {
    await coreRequest<unknown, CreateModelDevExecutionRequest>("/modeldev/executions", {
      method: "POST",
      data,
      signal,
    });
  });
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
