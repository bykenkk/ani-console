// TODO(modeldev-integration): 文档已声明部署；仍需前端联调验证停止、登记恢复、分页、日志、产物及下载。
import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type { PageParams } from "@/api/types";
import type {
  CreateFineTuningInput,
  CreateFineTuningRequest,
  CreateTrainingInput,
  CreateTrainingRequest,
  ModelDevExecutionListParams,
  ModelDevExecutionListResponse,
  ModelDevExecutionDetail,
  ModelDevLogParams,
  ModelDevExecutionLogs,
  ModelDevArtifactListResponse,
} from "./types";

const createFineTuningScope = createIdempotencyScope("finetuning-create", ["POST"]);
const createTrainingScope = createIdempotencyScope("training-create", ["POST"]);
const executionPath = (id: string) => `/modeldev/executions/${encodeURIComponent(id)}`;

// TODO(training-create): 联调 CPU/GPU 准入、同意图重试及 202 异步受理。
export function createTrainingExecution(input: CreateTrainingInput): Promise<void> {
  return runIdempotentRequest(createTrainingScope, input, async (data) => {
    await coreRequest<unknown, CreateTrainingRequest>("/modeldev/executions", {
      method: "POST",
      data,
    });
  });
}

// TODO(finetuning-create): 联调三种登记模式、CPU/GPU 准入、失败后同意图重试及 202 异步受理。
export function createFineTuningExecution(input: CreateFineTuningInput): Promise<void> {
  return runIdempotentRequest(createFineTuningScope, input, async (data) => {
    await coreRequest<unknown, CreateFineTuningRequest>("/modeldev/executions", {
      method: "POST",
      data,
    });
  });
}

// TODO(modeldev-list): 待联调验证 executions 接受 kind，并在分页前与名称、状态条件组合筛选，total 返回筛选后的总数。
export function listModelDevExecutions(
  params: ModelDevExecutionListParams = {},
  signal?: AbortSignal,
): Promise<ModelDevExecutionListResponse> {
  return coreRequest<ModelDevExecutionListResponse>("/modeldev/executions", {
    method: "GET",
    params,
    signal,
  });
}
export function getModelDevExecution(
  id: string,
  signal?: AbortSignal,
): Promise<ModelDevExecutionDetail> {
  return coreRequest<ModelDevExecutionDetail>(executionPath(id), { method: "GET", signal });
}
/** 沿用原执行的登记意图。严格空 body，无新参数或幂等 key。响应只代表观测快照。 */
export async function resumeModelDevRegistration(id: string, signal?: AbortSignal): Promise<void> {
  await coreRequest<unknown>(`${executionPath(id)}:resume-model-registration`, {
    method: "POST",
    signal,
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
/** 经平台鉴权代理文件字节，传输窗口与后端的 30 分钟上限保持一致。 */
export function downloadModelDevArtifact(id: string, signal?: AbortSignal): Promise<Blob> {
  return coreRequest<Blob>(`/modeldev/artifacts/${encodeURIComponent(id)}/download`, {
    method: "GET",
    responseType: "blob",
    timeout: 30 * 60 * 1000,
    signal,
  });
}
