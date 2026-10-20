import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateNetworkRouteInput,
  CreateNetworkRouteRequest,
  NetworkRoute,
  NetworkRouteListParams,
  NetworkRouteListResponse,
} from "./types";

const createScope = createIdempotencyScope("network-route-create", ["POST"]);
const routePath = (routeId: string) => `/networks/routes/${encodeURIComponent(routeId)}`;

export function listNetworkRoutes(
  params: NetworkRouteListParams = {},
): Promise<NetworkRouteListResponse> {
  return coreRequest<NetworkRouteListResponse>("/networks/routes", { method: "GET", params });
}

// TODO(submit-result): 接入 governance 后按实际契约确认提交返回值；普通创建、操作默认丢弃响应，并清理无用回传及创建后跳转。
export function createNetworkRoute(submitData: CreateNetworkRouteInput): Promise<NetworkRoute> {
  return runIdempotentRequest(createScope, submitData, (body) =>
    coreRequest<NetworkRoute, CreateNetworkRouteRequest>("/networks/routes", {
      method: "POST",
      data: body,
    }),
  );
}

export function getNetworkRoute(routeId: string): Promise<NetworkRoute> {
  return coreRequest<NetworkRoute>(routePath(routeId), { method: "GET" });
}

export function deleteNetworkRoute(routeId: string): Promise<NetworkRoute> {
  return coreRequest<NetworkRoute>(routePath(routeId), { method: "DELETE" });
}
