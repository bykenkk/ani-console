import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateNetworkLoadBalancerInput,
  CreateNetworkLoadBalancerRequest,
  NetworkLoadBalancer,
  NetworkLoadBalancerListParams,
  NetworkLoadBalancerListResponse,
  NetworkLoadBalancerMutationResponse,
  NetworkOperation,
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
): Promise<NetworkLoadBalancer> {
  return runIdempotentRequest(createScope, submitData, (body) =>
    coreRequest<NetworkLoadBalancer, CreateNetworkLoadBalancerRequest>("/networks/load-balancers", {
      method: "POST",
      data: body,
    }),
  );
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

export function deleteNetworkLoadBalancer(
  loadBalancerId: string,
): Promise<NetworkLoadBalancerMutationResponse> {
  return coreRequest<NetworkLoadBalancerMutationResponse>(loadBalancerPath(loadBalancerId), {
    method: "DELETE",
  });
}

export function getNetworkLoadBalancerOperation(
  id: string,
  signal?: AbortSignal,
): Promise<NetworkOperation> {
  return coreRequest<NetworkOperation>(
    "/networks/load-balancers/operations/" + encodeURIComponent(id),
    { method: "GET", signal },
  );
}
