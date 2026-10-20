// FIXME(governance-migration): 旧操作历史、版本、配置及挂载等接口未完全对齐，保留原调用。
// TODO(governance-migration): 单次操作状态已接新接口，其余功能待等价契约后迁移。
import { coreRequest } from "@/api/request";
import { instancePath } from "./records-legacy";
import type { CursorPageParams } from "@/api/types";
import type { InstanceOperation, InstanceOperationListResponse } from "./types-legacy";
export function getInstanceOperation(operationId: string): Promise<InstanceOperation> {
  return coreRequest<InstanceOperation>(`/instance-operations/${encodeURIComponent(operationId)}`, {
    method: "GET",
  });
}
export function listInstanceOperations(
  instanceId: string,
  params: CursorPageParams = {},
): Promise<InstanceOperationListResponse> {
  return coreRequest<InstanceOperationListResponse>(`${instancePath(instanceId)}/operations`, {
    method: "GET",
    params,
  });
}
