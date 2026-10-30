import { runIdempotentRequest } from "@/api/idempotency";
import { coreRequest } from "@/api/request";
import { createIdempotencyScope } from "@/lib/idempotency";
import type { BindNetworkSnatInput, BindNetworkSnatRequest, NetworkSnat } from "./types";

const bindScope = createIdempotencyScope("network-snat-bind", ["POST"]);
const snatPath = (vpcId: string) => `/networks/vpcs/${encodeURIComponent(vpcId)}/snat`;

export function getNetworkVpcSnat(vpcId: string, signal?: AbortSignal): Promise<NetworkSnat> {
  return coreRequest<NetworkSnat>(snatPath(vpcId), { method: "GET", signal });
}
export function bindNetworkVpcSnat(
  vpcId: string,
  input: BindNetworkSnatInput,
  signal?: AbortSignal,
): Promise<void> {
  return runIdempotentRequest(
    bindScope,
    input,
    async (data: BindNetworkSnatRequest) => {
      await coreRequest<unknown, BindNetworkSnatRequest>(`${snatPath(vpcId)}/bindings`, {
        method: "POST",
        data,
        signal,
      });
    },
    [vpcId],
  );
}

// The DELETE contract has no client idempotency field or header.
export async function unbindNetworkVpcEip(bindingId: string, signal?: AbortSignal): Promise<void> {
  await coreRequest(`/networks/snat/bindings/${encodeURIComponent(bindingId)}`, {
    method: "DELETE",
    signal,
  });
}
