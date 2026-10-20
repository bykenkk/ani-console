import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  InstanceRecord,
  InstanceListParams,
  InstanceListResponse,
  InstancePresetListParams,
  InstancePresetListResponse,
  CreateInstanceInput,
  CreateInstanceRequest,
  ChangeInstanceInput,
  ChangeInstanceRequest,
  InstanceAcceptance,
  InstanceOperation,
  InstanceRuntime,
  InstanceEventsResponse,
  InstanceLogParams,
  InstanceExecSession,
  CreateInstanceExecSessionInput,
  CreateInstanceExecSessionRequest,
} from "./types";

const createScope = createIdempotencyScope("governance-instance-create", ["POST"]);
const startScope = createIdempotencyScope("governance-instance-start", ["POST"]);
const stopScope = createIdempotencyScope("governance-instance-stop", ["POST"]);
const deleteScope = createIdempotencyScope("governance-instance-delete", ["DELETE"]);
const execScope = createIdempotencyScope("governance-instance-exec", ["POST"]);
const instancePath = (id: string) => `/instances/${encodeURIComponent(id)}`;
export function listInstances(params: InstanceListParams = {}, signal?: AbortSignal) {
  // FIXME(governance-instance-filter): 新列表不支持 ID 搜索，对应选项暂时禁用，不回退旧列表。
  // TODO(governance-instance-filter): 后端补齐 ID 查询契约后启用选项；状态只按新 observedState 筛选。
  return coreRequest<InstanceListResponse>("/instances", { method: "GET", params, signal });
}
export function getInstance(id: string, signal?: AbortSignal) {
  return coreRequest<InstanceRecord>(instancePath(id), { method: "GET", signal });
}
export function listInstancePresets(params: InstancePresetListParams = {}, signal?: AbortSignal) {
  return coreRequest<InstancePresetListResponse>("/instance-presets", {
    method: "GET",
    params,
    signal,
  });
}
export function createInstance(input: CreateInstanceInput) {
  // FIXME(governance-instance-create): 创建以新契约为准，不发送 preset_version 或旧配置字段。
  // TODO(governance-instance-create): 网络/存储等配置管理待后端提供等价契约后对接。
  return runIdempotentRequest(createScope, input, (data) =>
    coreRequest<InstanceAcceptance, CreateInstanceRequest>("/instances", {
      method: "POST",
      data: { data },
    }),
  );
}
export function startInstance(id: string, input: ChangeInstanceInput) {
  return runIdempotentRequest(
    startScope,
    input,
    (data) =>
      coreRequest<InstanceAcceptance, ChangeInstanceRequest>(`${instancePath(id)}:start`, {
        method: "POST",
        data: { data },
      }),
    [id],
  );
}
export function stopInstance(id: string, input: ChangeInstanceInput) {
  return runIdempotentRequest(
    stopScope,
    input,
    (data) =>
      coreRequest<InstanceAcceptance, ChangeInstanceRequest>(`${instancePath(id)}:stop`, {
        method: "POST",
        data: { data },
      }),
    [id],
  );
}
export function deleteInstance(id: string, input: ChangeInstanceInput) {
  // DELETE 的 data body、幂等键及 expected_version 均由新契约明确要求。
  return runIdempotentRequest(
    deleteScope,
    input,
    (data) =>
      coreRequest<InstanceAcceptance, ChangeInstanceRequest>(instancePath(id), {
        method: "DELETE",
        data: { data },
      }),
    [id],
  );
}
export function getInstanceOperation(id: string, signal?: AbortSignal) {
  return coreRequest<InstanceOperation>(`/instance-operations/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}
export function getInstanceRuntime(id: string, signal?: AbortSignal) {
  return coreRequest<InstanceRuntime>(`${instancePath(id)}/runtime`, { method: "GET", signal });
}
export function listInstanceEvents(id: string, signal?: AbortSignal) {
  return coreRequest<InstanceEventsResponse>(`${instancePath(id)}/events`, {
    method: "GET",
    signal,
  });
}
export function streamInstanceLogs(id: string, params: InstanceLogParams, signal: AbortSignal) {
  return coreRequest<ReadableStream<Uint8Array>>(`${instancePath(id)}/logs`, {
    method: "GET",
    params,
    signal,
    adapter: "fetch",
    responseType: "stream",
  });
}
export async function createInstanceExecSession(
  id: string,
  input: CreateInstanceExecSessionInput,
  signal?: AbortSignal,
) {
  const instance = await getInstance(id, signal);
  return runIdempotentRequest(
    execScope,
    { ...input, expected_version: instance.version },
    (data) =>
      coreRequest<InstanceExecSession, CreateInstanceExecSessionRequest>(
        `${instancePath(id)}/exec`,
        { method: "POST", data: { data }, signal },
      ),
    [id],
  );
}
export type * from "./types";
