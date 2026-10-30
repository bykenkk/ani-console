import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type { SetSecurityGroupsInput, SetSecurityGroupsRequest } from "@/api/network";
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
  InstanceOperation,
  InstanceAcceptance,
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
const deleteScope = createIdempotencyScope("governance-instance-delete", ["DELETE"]);
const securityGroupsScope = createIdempotencyScope("instance-security-groups", ["PUT"]);
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
  // 容器创建固定使用实例用途，不与训练、推理目录共享授权范围。
  // TODO(instance-presets): 联调验证用途授权、分页及 GPU 目录降级反馈。
  return coreRequest<InstancePresetListResponse>("/compute-presets", {
    method: "GET",
    params: { ...params, usage: "CONTAINER_INSTANCE" },
    signal,
  });
}
export function createInstance(input: CreateInstanceInput): Promise<void> {
  // TODO(governance-instance-create): 联调验证配置保存、卷引用、网络门禁和幂等重试。
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
  // TODO(instance-configuration): 联调核对冻结配置回显和 no-store 响应，不写入持久缓存。
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
export type * from "./types";

export function setInstanceSecurityGroups(
  id: string,
  input: SetSecurityGroupsInput,
): Promise<InstanceAcceptance> {
  return runIdempotentRequest(
    securityGroupsScope,
    input,
    (data) =>
      coreRequest<InstanceAcceptance, SetSecurityGroupsRequest>(
        `${instancePath(id)}/security-groups`,
        { method: "PUT", data: { data } },
      ),
    [id],
  );
}
