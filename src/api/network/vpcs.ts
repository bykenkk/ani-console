import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateNetworkVPCInput,
  CreateNetworkVPCRequest,
  NetworkVPC,
  NetworkVPCCidrPresetsResponse,
  NetworkVPCListParams,
  NetworkVPCListResponse,
} from "./types";

const createScope = createIdempotencyScope("network-vpc-create", ["POST"]);
const vpcPath = (vpcId: string) => `/networks/vpcs/${encodeURIComponent(vpcId)}`;

export function listNetworkVpcs(
  params: NetworkVPCListParams = {},
  signal?: AbortSignal,
): Promise<NetworkVPCListResponse> {
  return coreRequest<NetworkVPCListResponse>("/networks/vpcs", {
    method: "GET",
    params,
    signal,
  });
}

export function createNetworkVpc(submitData: CreateNetworkVPCInput): Promise<void> {
  return runIdempotentRequest(createScope, submitData, async (body) => {
    await coreRequest<unknown, CreateNetworkVPCRequest>("/networks/vpcs", {
      method: "POST",
      data: body,
    });
  });
}

export function getNetworkVpc(vpcId: string): Promise<NetworkVPC> {
  return coreRequest<NetworkVPC>(vpcPath(vpcId), { method: "GET" });
}

export async function deleteNetworkVpc(vpcId: string): Promise<void> {
  await coreRequest<unknown>(vpcPath(vpcId), {
    method: "DELETE",
  });
}

export function listNetworkVpcCidrPresets(
  signal?: AbortSignal,
): Promise<NetworkVPCCidrPresetsResponse> {
  return coreRequest<NetworkVPCCidrPresetsResponse>("/networks/vpc-cidr-presets", {
    method: "GET",
    signal,
  });
}
