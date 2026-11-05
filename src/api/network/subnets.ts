import { runIdempotentRequest } from "@/api/idempotency";
import { ApiError, coreRequest } from "@/api/request";
import type { PageParams } from "@/api/types";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateNetworkSubnetInput,
  CreateNetworkSubnetRequest,
  NetworkSubnet,
  NetworkSubnetListParams,
  NetworkSubnetListResponse,
  NetworkAssociatedInstanceListResponse,
} from "./types";

const createScope = createIdempotencyScope("network-subnet-create", ["POST"]);
const subnetPath = (subnetId: string) => `/networks/subnets/${encodeURIComponent(subnetId)}`;

export async function listNetworkSubnetAssociatedInstances(
  subnetId: string,
  params: PageParams = {},
  signal?: AbortSignal,
): Promise<NetworkAssociatedInstanceListResponse> {
  try {
    return await coreRequest<NetworkAssociatedInstanceListResponse>("/networks/instances", {
      method: "GET",
      params: { subnet_id: subnetId, page: params.page, pageSize: params.pageSize },
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      error.message = "无权查看网络关联实例";
    }
    throw error;
  }
}

export function listNetworkSubnets(
  params: NetworkSubnetListParams = {},
  signal?: AbortSignal,
): Promise<NetworkSubnetListResponse> {
  return coreRequest<NetworkSubnetListResponse>("/networks/subnets", {
    method: "GET",
    params,
    signal,
  });
}

// TODO(submit-result): 接入 governance 后按实际契约确认提交返回值；普通创建、操作默认丢弃响应，并清理无用回传及创建后跳转。
export function createNetworkSubnet(submitData: CreateNetworkSubnetInput): Promise<NetworkSubnet> {
  return runIdempotentRequest(createScope, submitData, (body) =>
    coreRequest<NetworkSubnet, CreateNetworkSubnetRequest>("/networks/subnets", {
      method: "POST",
      data: body,
    }),
  );
}

export function getNetworkSubnet(subnetId: string): Promise<NetworkSubnet> {
  return coreRequest<NetworkSubnet>(subnetPath(subnetId), { method: "GET" });
}

// TODO(submit-result): 接入 governance 后按实际契约确认提交返回值；普通创建、操作默认丢弃响应，并清理无用回传及创建后跳转。
export function deleteNetworkSubnet(subnetId: string): Promise<NetworkSubnet> {
  return coreRequest<NetworkSubnet>(subnetPath(subnetId), { method: "DELETE" });
}
