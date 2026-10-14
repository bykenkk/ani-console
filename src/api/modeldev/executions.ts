import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import type { CursorPageParams } from "@/api/types";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  ModelDevExecutionListResponse,
  ModelDevExecution,
  CreateModelDevExecutionInput,
  CreateModelDevExecutionRequest,
  ModelDevExecutionAcceptance,
  ModelDevStopAcceptance,
  ModelDevLogParams,
  ModelDevExecutionLogs,
  ModelDevArtifactListResponse,
  ModelDevArtifactDownload,
} from "./types";

const createScope = createIdempotencyScope("modeldev-execution-create", ["POST"]);
const executionPath = (id: string) => `/modeldev/executions/${encodeURIComponent(id)}`;

export function listModelDevExecutions(
  params: CursorPageParams = {},
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
export function createModelDevExecution(
  input: CreateModelDevExecutionInput,
  signal?: AbortSignal,
): Promise<ModelDevExecutionAcceptance> {
  return runIdempotentRequest(createScope, input, (data: CreateModelDevExecutionRequest) =>
    coreRequest<ModelDevExecutionAcceptance, CreateModelDevExecutionRequest>(
      "/modeldev/executions",
      { method: "POST", data, signal },
    ),
  );
}
/** Path-only POST. The server owns repeat handling; body and query are forbidden. */
export function stopModelDevExecution(
  id: string,
  signal?: AbortSignal,
): Promise<ModelDevStopAcceptance> {
  return coreRequest<ModelDevStopAcceptance>(`${executionPath(id)}:stop`, {
    method: "POST",
    signal,
  });
}
/** Bounded JSON logs, not an SSE stream. */
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
  params: CursorPageParams = {},
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
