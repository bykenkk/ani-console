import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope, type IdempotencyScope } from "@/lib/idempotency";
import type { InstancePresetListParams, InstancePresetListResponse } from "@/api/instances";
import type {
  Sandbox,
  SandboxListParams,
  SandboxListResponse,
  CreateSandboxInput,
  CreateSandboxRequest,
  ChangeSandboxInput,
  ChangeSandboxRequest,
  SandboxOperation,
} from "./types";

const createScope = createIdempotencyScope("sandbox-create", ["POST"]);
const pauseScope = createIdempotencyScope("sandbox-pause", ["POST"]);
const resumeScope = createIdempotencyScope("sandbox-resume", ["POST"]);
// Sandbox DELETE 明确使用 data.idempotency_key 和 data.expected_version。
const deleteScope = createIdempotencyScope("sandbox-delete", ["DELETE"]);
const sandboxPath = (id: string) => `/sandbox/${encodeURIComponent(id)}`;

export function listSandboxes(params: SandboxListParams, signal?: AbortSignal) {
  // TODO(sandbox-filter): 当前仅支持 page/pageSize，待后端提供名称与状态筛选。
  return coreRequest<SandboxListResponse>("/sandbox", { method: "GET", params, signal });
}
export function getSandbox(id: string, signal?: AbortSignal) {
  return coreRequest<Sandbox>(sandboxPath(id), { method: "GET", signal });
}
export function listSandboxPresets(params: InstancePresetListParams = {}, signal?: AbortSignal) {
  return coreRequest<InstancePresetListResponse>("/compute-presets", {
    method: "GET",
    params: { ...params, usage: "SANDBOX", compute_type: "cpu" },
    signal,
  });
}
export function createSandbox(input: CreateSandboxInput): Promise<void> {
  return runIdempotentRequest(createScope, input, async (data) => {
    await coreRequest<unknown, CreateSandboxRequest>("/sandbox", {
      method: "POST",
      data: { data },
    });
  });
}
function changeSandbox(
  scope: IdempotencyScope,
  id: string,
  action: "pause" | "resume" | "delete",
  input: ChangeSandboxInput,
): Promise<void> {
  return runIdempotentRequest(
    scope,
    input,
    async (data) => {
      await coreRequest<unknown, ChangeSandboxRequest>(
        action === "delete" ? sandboxPath(id) : `${sandboxPath(id)}:${action}`,
        { method: action === "delete" ? "DELETE" : "POST", data: { data } },
      );
    },
    [id],
  );
}
export function pauseSandbox(id: string, input: ChangeSandboxInput) {
  return changeSandbox(pauseScope, id, "pause", input);
}
export function resumeSandbox(id: string, input: ChangeSandboxInput) {
  return changeSandbox(resumeScope, id, "resume", input);
}
export function deleteSandbox(id: string, input: ChangeSandboxInput) {
  return changeSandbox(deleteScope, id, "delete", input);
}
// TODO(sandbox-task): 创建、删除的任务查询及跟踪弹窗暂缓接入页面。
export function getSandboxOperation(operationId: string, signal?: AbortSignal) {
  return coreRequest<SandboxOperation>(`/sandbox/operations/${encodeURIComponent(operationId)}`, {
    method: "GET",
    signal,
  });
}
export type * from "./types";
