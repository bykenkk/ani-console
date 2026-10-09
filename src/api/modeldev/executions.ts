import { runIdempotentRequest } from "@/api/idempotency";
import { adminRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  ModelDevPageParams,
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
  params: ModelDevPageParams = {},
  signal?: AbortSignal,
): Promise<ModelDevExecutionListResponse> {
  return adminRequest<ModelDevExecutionListResponse>("/modeldev/executions", {
    method: "GET",
    params,
    signal,
  });
}
export function getModelDevExecution(id: string, signal?: AbortSignal): Promise<ModelDevExecution> {
  return adminRequest<ModelDevExecution>(executionPath(id), { method: "GET", signal });
}
export function createModelDevExecution(
  input: CreateModelDevExecutionInput,
  signal?: AbortSignal,
): Promise<ModelDevExecutionAcceptance> {
  return runIdempotentRequest(createScope, input, (data: CreateModelDevExecutionRequest) =>
    adminRequest<ModelDevExecutionAcceptance, CreateModelDevExecutionRequest>(
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
  return adminRequest<ModelDevStopAcceptance>(`${executionPath(id)}:stop`, {
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
  return adminRequest<ModelDevExecutionLogs>(`${executionPath(id)}/logs`, {
    method: "GET",
    params,
    signal,
  });
}
export function listModelDevExecutionArtifacts(
  id: string,
  params: ModelDevPageParams = {},
  signal?: AbortSignal,
): Promise<ModelDevArtifactListResponse> {
  return adminRequest<ModelDevArtifactListResponse>(`${executionPath(id)}/artifacts`, {
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
  return adminRequest<ModelDevArtifactDownload>(
    `/modeldev/artifacts/${encodeURIComponent(id)}/content`,
    { method: "GET", signal },
  );
}
