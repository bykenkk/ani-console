import { coreRequest } from "@/api/request";
import type { PageParams } from "@/api/types";
import type { NetworkAssociatedInstanceListResponse } from "./types";

export function listNetworkVpcAssociatedInstances(
  vpcId: string,
  params: PageParams = {},
  signal?: AbortSignal,
): Promise<NetworkAssociatedInstanceListResponse> {
  return coreRequest<NetworkAssociatedInstanceListResponse>(
    `/networks/vpcs/${encodeURIComponent(vpcId)}/associated-instances`,
    { method: "GET", params: { page: params.page, pageSize: params.pageSize }, signal },
  );
}

export function listNetworkSubnetAssociatedInstances(
  subnetId: string,
  params: PageParams = {},
  signal?: AbortSignal,
): Promise<NetworkAssociatedInstanceListResponse> {
  return coreRequest<NetworkAssociatedInstanceListResponse>(
    `/networks/subnets/${encodeURIComponent(subnetId)}/associated-instances`,
    { method: "GET", params: { page: params.page, pageSize: params.pageSize }, signal },
  );
}
