// FIXME(governance-migration): 网络配置等旧详情字段未对齐，VM/沙箱列表仍依赖旧 kind 与筛选参数。
// TODO(governance-migration): 未迁移实例逐项核对后迁移；CPU/GPU 列表统一走新接口，缺失查询暂时禁用。
import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateInstanceInput,
  CreateInstanceRequest,
  CreateInstanceResponse,
  InstanceListParams,
  InstanceListResponse,
  InstanceRecord,
} from "./types-legacy";

const createScope = createIdempotencyScope("instance-create", ["POST"]);
export const instancePath = (instanceId: string) => `/instances/${encodeURIComponent(instanceId)}`;
export function listInstances(params: InstanceListParams = {}): Promise<InstanceListResponse> {
  return coreRequest<InstanceListResponse>("/instances", { method: "GET", params });
}
export function getInstance(instanceId: string): Promise<InstanceRecord> {
  return coreRequest<InstanceRecord>(instancePath(instanceId), { method: "GET" });
}
// TODO(submit-result): 接入 governance 后按实际契约确认提交返回值；普通创建、操作默认丢弃响应，并清理无用回传及创建后跳转。
export function createInstance(submitData: CreateInstanceInput): Promise<CreateInstanceResponse> {
  return runIdempotentRequest(createScope, submitData, (body) =>
    coreRequest<CreateInstanceResponse, CreateInstanceRequest>("/instances", {
      method: "POST",
      data: body,
    }),
  );
}
