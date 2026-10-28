// FIXME(governance-migration): 指标、安全事件、历史分页及结构化级别日志未对齐，保留原调用。
// TODO(governance-migration): 仅 CPU/GPU 当前事件和基础文本日志迁移，其余实例及能力继续旧接口。
import type { CursorPageParams } from "@/api/types";
import { coreRequest } from "@/api/request";
export { queryObservabilityRange } from "@/api/observability/legacy";
import { instancePath } from "./records-legacy";
import type { InstanceEvent, InstanceMetrics, InstanceSecurityEvent } from "./types-legacy";
type ListResponse<T> = { items: T[]; total: number; next_cursor?: string | null };
export function getInstanceMetrics(instanceId: string): Promise<InstanceMetrics> {
  return coreRequest<InstanceMetrics>(`${instancePath(instanceId)}/metrics`, { method: "GET" });
}
export function listInstanceEvents(
  instanceId: string,
  params: CursorPageParams = {},
): Promise<ListResponse<InstanceEvent>> {
  return coreRequest<ListResponse<InstanceEvent>>(`${instancePath(instanceId)}/events`, {
    method: "GET",
    params,
  });
}
export function listInstanceSecurityEvents(
  instanceId: string,
  params: CursorPageParams & { severity?: string } = {},
): Promise<ListResponse<InstanceSecurityEvent>> {
  return coreRequest<ListResponse<InstanceSecurityEvent>>(
    `${instancePath(instanceId)}/security-events`,
    { method: "GET", params },
  );
}
export function streamInstanceLogs(
  instanceId: string,
  params: {
    level?: "debug" | "info" | "warn" | "error";
    limit?: number;
    interval_seconds?: number;
  },
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  return coreRequest<ReadableStream<Uint8Array>>(`${instancePath(instanceId)}/logs/stream`, {
    method: "GET",
    params,
    signal,
    adapter: "fetch",
    responseType: "stream",
  });
}
