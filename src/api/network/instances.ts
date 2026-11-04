import { ApiError, coreRequest } from "@/api/request";
import type { NetworkInstanceListParams, NetworkInstanceListResponse } from "./types";

export async function listNetworkInstances(
  params: NetworkInstanceListParams,
  signal?: AbortSignal,
): Promise<NetworkInstanceListResponse> {
  try {
    return await coreRequest<NetworkInstanceListResponse>("/networks/instances", {
      method: "GET",
      params,
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      error.message = "无权查看网络关联实例";
    }
    throw error;
  }
}
