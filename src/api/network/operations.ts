import { coreRequest } from "@/api/request";
import type { NetworkOperation } from "./types";

export function getNetworkOperation(id: string, signal?: AbortSignal): Promise<NetworkOperation> {
  return coreRequest<NetworkOperation>(`/networks/operations/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}
