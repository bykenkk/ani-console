import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  CreateNetworkEipInput,
  CreateNetworkEipRequest,
  NetworkEip,
  NetworkEipListParams,
  NetworkEipListResponse,
} from "./types";

const createScope = createIdempotencyScope("network-eip-create", ["POST"]);
const eipPath = (id: string) => `/networks/eips/${encodeURIComponent(id)}`;

export function listNetworkEips(
  params: NetworkEipListParams = {},
  signal?: AbortSignal,
): Promise<NetworkEipListResponse> {
  return coreRequest<NetworkEipListResponse>("/networks/eips", { method: "GET", params, signal });
}
export function getNetworkEip(id: string, signal?: AbortSignal): Promise<NetworkEip> {
  return coreRequest<NetworkEip>(eipPath(id), { method: "GET", signal });
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
// The DELETE contract has no client idempotency field or header.
export async function deleteNetworkEip(id: string, signal?: AbortSignal): Promise<void> {
  await coreRequest<unknown>(eipPath(id), {
    method: "DELETE",
    signal,
  });
}
