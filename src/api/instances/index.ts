import { coreRequest } from "@/api/request";
export * from "./network-interfaces";
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
  RestartInstanceInput,
  RestartInstanceRequest,
  AttachInstancePvcInput,
  AttachInstancePvcRequest,
  DetachInstancePvcInput,
  DetachInstancePvcRequest,
  InstanceOperation,
  InstanceRuntime,
  InstanceEventsResponse,
  InstanceLogParams,
  InstanceExecSession,
  CreateInstanceExecSessionInput,
  CreateInstanceExecSessionRequest,
  MountablePvcListParams,
  MountablePvcListResponse,
  InstanceConfigurationData,
  InstanceMetricsInput,
  InstanceMetricsRequest,
  InstanceMetricsRangeResponse,
  InstanceMetricsLatestResponse,
} from "./types";

const createScope = createIdempotencyScope("governance-instance-create", ["POST"]);
const startScope = createIdempotencyScope("governance-instance-start", ["POST"]);
const stopScope = createIdempotencyScope("governance-instance-stop", ["POST"]);
const restartScope = createIdempotencyScope("instance-restart", ["POST"]);
const attachScope = createIdempotencyScope("instance-attach-pvc", ["POST"]);
const detachScope = createIdempotencyScope("instance-detach-pvc", ["POST"]);
const deleteScope = createIdempotencyScope("governance-instance-delete", ["DELETE"]);
const securityGroupsScope = createIdempotencyScope("instance-security-groups", ["PUT"]);
const execScope = createIdempotencyScope("governance-instance-exec", ["POST"]);
const instancePath = (id: string) => `/instances/${encodeURIComponent(id)}`;
export function listInstances(params: InstanceListParams = {}, signal?: AbortSignal) {
  // 不传 observedState 时由服务端排除已删除实例，筛选与 total 均由服务端计算。
  return coreRequest<InstanceListResponse>("/instances", { method: "GET", params, signal });
}
export function getInstance(id: string, signal?: AbortSignal) {
  return coreRequest<InstanceRecord>(instancePath(id), { method: "GET", signal });
}
export function listInstancePresets(params: InstancePresetListParams = {}, signal?: AbortSignal) {
  // 容器创建固定使用实例用途，不与训练、推理目录共享授权范围。
  return coreRequest<InstancePresetListResponse>("/compute-presets", {
    method: "GET",
    params: { ...params, usage: "CONTAINER_INSTANCE" },
    signal,
  });
}
export function createInstance(input: CreateInstanceInput): Promise<void> {
  return runIdempotentRequest(createScope, input, async (data) => {
    await coreRequest<void, CreateInstanceRequest>("/instances", {
      method: "POST",
      data: { data },
    });
  });
}
export function listMountablePvcs(params: MountablePvcListParams = {}, signal?: AbortSignal) {
  return coreRequest<MountablePvcListResponse>("/instances/mountable-pvcs", {
    method: "GET",
    params,
    signal,
  });
}
export function listInstanceMountablePvcs(
  id: string,
  params: MountablePvcListParams = {},
  signal?: AbortSignal,
) {
  return coreRequest<MountablePvcListResponse>(`${instancePath(id)}/mountable-pvcs`, {
    method: "GET",
    params,
    signal,
  });
}
export function attachInstancePvc(id: string, input: AttachInstancePvcInput): Promise<void> {
  return runIdempotentRequest(
    attachScope,
    input,
    async ({ idempotency_key, ...values }) => {
      await coreRequest<void, AttachInstancePvcRequest>(`${instancePath(id)}:attach-pvc`, {
        method: "POST",
        data: { data: { ...values, idempotencyKey: idempotency_key } },
      });
    },
    [id],
  );
}
export function detachInstancePvc(id: string, input: DetachInstancePvcInput): Promise<void> {
  return runIdempotentRequest(
    detachScope,
    input,
    async ({ idempotency_key, ...values }) => {
      await coreRequest<void, DetachInstancePvcRequest>(`${instancePath(id)}:detach-pvc`, {
        method: "POST",
        data: { data: { ...values, idempotencyKey: idempotency_key } },
      });
    },
    [id],
  );
}
export function startInstance(id: string, input: ChangeInstanceInput): Promise<void> {
  return runIdempotentRequest(
    startScope,
    input,
    async (data) => {
      await coreRequest<void, ChangeInstanceRequest>(`${instancePath(id)}:start`, {
        method: "POST",
        data: { data },
      });
    },
    [id],
  );
}
export function stopInstance(id: string, input: ChangeInstanceInput): Promise<void> {
  return runIdempotentRequest(
    stopScope,
    input,
    async (data) => {
      await coreRequest<void, ChangeInstanceRequest>(`${instancePath(id)}:stop`, {
        method: "POST",
        data: { data },
      });
    },
    [id],
  );
}
export function restartInstance(id: string, input: RestartInstanceInput): Promise<void> {
  return runIdempotentRequest(
    restartScope,
    input,
    async ({ idempotency_key, ...values }) => {
      await coreRequest<void, RestartInstanceRequest>(`${instancePath(id)}:restart`, {
        method: "POST",
        data: { data: { ...values, idempotencyKey: idempotency_key } },
      });
    },
    [id],
  );
}
export function deleteInstance(id: string, input: ChangeInstanceInput): Promise<void> {
  // DELETE 的 data body、幂等键及 expected_version 均由新契约明确要求。
  return runIdempotentRequest(
    deleteScope,
    input,
    async (data) => {
      await coreRequest<void, ChangeInstanceRequest>(instancePath(id), {
        method: "DELETE",
        data: { data },
      });
    },
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
export function getInstanceConfiguration(id: string, signal?: AbortSignal) {
  // 冻结配置响应不写入持久缓存。
  return coreRequest<InstanceConfigurationData>(`${instancePath(id)}/configuration`, {
    method: "GET",
    signal,
  });
}
export function queryInstanceMetrics(
  id: string,
  input: InstanceMetricsInput,
  signal?: AbortSignal,
) {
  // 只读 POST，后端未声明幂等键；不自行追加。保留指标合同自身的 data 结构。
  return coreRequest<InstanceMetricsRangeResponse, InstanceMetricsRequest>(
    `${instancePath(id)}/metrics/query`,
    {
      method: "POST",
      data: { data: input },
      signal,
    },
  );
}
export function getInstanceLatestMetrics(id: string, signal?: AbortSignal) {
  return coreRequest<InstanceMetricsLatestResponse>(`${instancePath(id)}/metrics/latest`, {
    method: "GET",
    signal,
  });
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
export function setInstanceSecurityGroups(
  id: string,
  input: { security_group_ids: string[]; expected_version: string },
): Promise<void> {
  return runIdempotentRequest(
    securityGroupsScope,
    input,
    async (data) => {
      await coreRequest(`${instancePath(id)}/security-groups`, { method: "PUT", data: { data } });
    },
    [id],
  );
}
export type * from "./types";
