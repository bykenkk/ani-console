// FIXME(governance-migration): 沙箱安全事件尚未迁移，迁移阶段临时保留旧查询。
// TODO(governance-migration): 安全事件调用方迁移后移除此模块。
import type { CursorPageParams } from "@/api/types";
import { coreRequest } from "@/api/request";
import { instancePath } from "./records-legacy";
import type { InstanceSecurityEvent } from "./types-legacy";
type ListResponse<T> = { items: T[]; total: number; next_cursor?: string | null };

export function listInstanceSecurityEvents(
  instanceId: string,
  params: CursorPageParams & { severity?: string } = {},
): Promise<ListResponse<InstanceSecurityEvent>> {
  return coreRequest<ListResponse<InstanceSecurityEvent>>(
    `${instancePath(instanceId)}/security-events`,
    { method: "GET", params },
  );
}
