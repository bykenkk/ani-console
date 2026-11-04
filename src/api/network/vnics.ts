import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateNetworkVnicInput,
  CreateNetworkVnicRequest,
  NetworkVnic,
  NetworkVnicListParams,
  NetworkVnicListResponse,
  VnicBindingTargetListParams,
  VnicBindingTargetListResponse,
} from "./types";

const createScope = createIdempotencyScope("network-vnic-create", ["POST"]);
const vnicPath = (id: string) => `/networks/vnics/${encodeURIComponent(id)}`;

export function listNetworkVnics(
  params: NetworkVnicListParams = {},
  signal?: AbortSignal,
): Promise<NetworkVnicListResponse> {
  return coreRequest("/networks/vnics", { method: "GET", params, signal });
}
export function getNetworkVnic(id: string, signal?: AbortSignal): Promise<NetworkVnic> {
  return coreRequest(vnicPath(id), { method: "GET", signal });
}
export function createNetworkVnic(input: CreateNetworkVnicInput): Promise<void> {
  return runIdempotentRequest(createScope, input, async (data) => {
    await coreRequest<unknown, CreateNetworkVnicRequest>("/networks/vnics", {
      method: "POST",
      data: { data },
    });
  });
}
export async function deleteNetworkVnic(id: string): Promise<void> {
  await coreRequest(vnicPath(id), { method: "DELETE" });
}
export function listVnicBindingTargets(
  id: string,
  params: VnicBindingTargetListParams,
  signal?: AbortSignal,
): Promise<VnicBindingTargetListResponse> {
  return coreRequest(`${vnicPath(id)}/binding-targets`, { method: "GET", params, signal });
}
