import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateNetworkEipInput,
  CreateNetworkEipRequest,
  NetworkEipListParams,
  NetworkEipListResponse,
  NetworkSecurityGroupBindingResponse,
} from "./types";

const securityGroupsScope = createIdempotencyScope("eip-security-groups", ["PUT"]);
const createScope = createIdempotencyScope("network-eip-create", ["POST"]);
const eipPath = (id: string) => `/networks/eips/${encodeURIComponent(id)}`;

export function listNetworkEips(
  params: NetworkEipListParams = {},
  signal?: AbortSignal,
): Promise<NetworkEipListResponse> {
  return coreRequest<NetworkEipListResponse>("/networks/eips", { method: "GET", params, signal });
}

export function createNetworkEip(
  input: CreateNetworkEipInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(createScope, input, async (data: CreateNetworkEipRequest) => {
    await coreRequest<unknown, CreateNetworkEipRequest>("/networks/eips", {
      method: "POST",
      data,
      signal,
    });
  });
}

export function getEipSecurityGroups(id: string, signal?: AbortSignal) {
  return coreRequest<NetworkSecurityGroupBindingResponse>(`${eipPath(id)}/security-groups`, {
    method: "GET",
    signal,
  });
}
export function setEipSecurityGroups(
  id: string,
  input: { security_group_ids: string[]; expected_version: string },
): Promise<void> {
  return runIdempotentRequest(
    securityGroupsScope,
    input,
    async (data) => {
      await coreRequest(`${eipPath(id)}/security-groups`, { method: "PUT", data: { data } });
    },
    [id],
  );
}
