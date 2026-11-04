import { coreRequest } from "@/api/request";
import { runIdempotentRequest } from "@/api/idempotency";
import { createIdempotencyScope } from "@/lib/idempotency";
import type {
  InstanceNetworkInterfaces,
  SetNetworkInterfaceInput,
  SetNetworkInterfaceRequest,
} from "@/api/network";

const setScope = createIdempotencyScope("vm-network-interface", ["PUT"]);
const networkPath = (id: string) =>
  `/virtual-machines/${encodeURIComponent(id)}/network-interfaces`;
export function getVmNetworkInterfaces(
  id: string,
  signal?: AbortSignal,
): Promise<InstanceNetworkInterfaces> {
  return coreRequest(networkPath(id), { method: "GET", signal });
}
export function setVmNetworkInterface(
  id: string,
  slot: string,
  input: SetNetworkInterfaceInput,
): Promise<void> {
  return runIdempotentRequest(
    setScope,
    input,
    async (data) => {
      await coreRequest<unknown, SetNetworkInterfaceRequest>(
        `${networkPath(id)}/${encodeURIComponent(slot)}`,
        { method: "PUT", data: { data } },
      );
    },
    [id, slot],
  );
}
