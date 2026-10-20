import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateNetworkLoadBalancerInput,
  CreateNetworkLoadBalancerRequest,
  NetworkLoadBalancer,
  NetworkLoadBalancerListParams,
  NetworkLoadBalancerListResponse,
} from "./types";

const createScope = createIdempotencyScope("network-load-balancer-create", ["POST"]);
const loadBalancerPath = (loadBalancerId: string) =>
  `/networks/load-balancers/${encodeURIComponent(loadBalancerId)}`;

export function listNetworkLoadBalancers(
  params: NetworkLoadBalancerListParams = {},
  signal?: AbortSignal,
): Promise<NetworkLoadBalancerListResponse> {
  return coreRequest<NetworkLoadBalancerListResponse>("/networks/load-balancers", {
    method: "GET",
    params,
    signal,
  });
}

export function createNetworkLoadBalancer(
  submitData: CreateNetworkLoadBalancerInput,
): Promise<void> {
  return runIdempotentRequest(createScope, submitData, async (body) => {
    await coreRequest<void, CreateNetworkLoadBalancerRequest>("/networks/load-balancers", {
      method: "POST",
      data: body,
    });
  });
}

export function getNetworkLoadBalancer(
  loadBalancerId: string,
  signal?: AbortSignal,
): Promise<NetworkLoadBalancer> {
  return coreRequest<NetworkLoadBalancer>(loadBalancerPath(loadBalancerId), {
    method: "GET",
    signal,
  });
}

export async function deleteNetworkLoadBalancer(loadBalancerId: string): Promise<void> {
  await coreRequest<void>(loadBalancerPath(loadBalancerId), {
    method: "DELETE",
  });
}
