import { coreRequest } from "@/api/request";
import type {
  AcceleratorPageParams,
  AcceleratorClusterListResponse,
  AcceleratorPoolListParams,
  AcceleratorPoolListResponse,
  AcceleratorProfileListParams,
  AcceleratorUsageListParams,
  AcceleratorProfileVersion,
  AcceleratorProfile,
  AcceleratorProfileListResponse,
  AcceleratorCapacity,
  AcceleratorUsage,
  AcceleratorUsageListResponse,
  AcceleratorBindingListResponse,
  AcceleratorAdmissionInput,
  AcceleratorAdmissionRequest,
  AcceleratorAdmissionPreview,
} from "./types";

const usagePath = (ownerService: string, resourceId: string) =>
  `/accelerator/usages/${encodeURIComponent(ownerService)}/${encodeURIComponent(resourceId)}`;

export function listAcceleratorProfiles(
  params: AcceleratorProfileListParams,
  signal?: AbortSignal,
): Promise<AcceleratorProfileListResponse> {
  return coreRequest<AcceleratorProfileListResponse>("/accelerator/profiles", {
    method: "GET",
    params,
    signal,
  });
}
export function getAcceleratorProfile(
  profile: AcceleratorProfileVersion,
  signal?: AbortSignal,
): Promise<AcceleratorProfile> {
  return coreRequest<AcceleratorProfile>(
    `/accelerator/profiles/${encodeURIComponent(profile.profile_id)}`,
    { method: "GET", params: { profile_version: profile.profile_version }, signal },
  );
}
export function getAcceleratorCapacity(
  params: AcceleratorProfileVersion,
  signal?: AbortSignal,
): Promise<AcceleratorCapacity> {
  return coreRequest<AcceleratorCapacity>("/accelerator/capacity", {
    method: "GET",
    params,
    signal,
  });
}
/** Read-only preview. The contract does not declare an idempotency key. */
export function previewAcceleratorAdmission(
  input: AcceleratorAdmissionInput,
  signal?: AbortSignal,
): Promise<AcceleratorAdmissionPreview> {
  return coreRequest<AcceleratorAdmissionPreview, AcceleratorAdmissionRequest>(
    "/accelerator/admission-preview",
    { method: "POST", data: { data: input }, signal },
  );
}
export function listAcceleratorUsages(
  params: AcceleratorUsageListParams = {},
  signal?: AbortSignal,
): Promise<AcceleratorUsageListResponse> {
  return coreRequest<AcceleratorUsageListResponse>("/accelerator/usages", {
    method: "GET",
    params,
    signal,
  });
}
export function getAcceleratorUsage(
  ownerService: string,
  resourceId: string,
  signal?: AbortSignal,
): Promise<AcceleratorUsage> {
  return coreRequest<AcceleratorUsage>(usagePath(ownerService, resourceId), {
    method: "GET",
    signal,
  });
}
export function listAcceleratorBindings(
  ownerService: string,
  resourceId: string,
  params: AcceleratorPageParams = {},
  signal?: AbortSignal,
): Promise<AcceleratorBindingListResponse> {
  return coreRequest<AcceleratorBindingListResponse>(
    `${usagePath(ownerService, resourceId)}/bindings`,
    { method: "GET", params, signal },
  );
}
export type * from "./types";

// FIXME(gpu-location-contract): 当前使用 ACC 管理端列表，接口仍要求平台身份及相应权限，不代表租户端已开放。
// TODO(gpu-location-contract): 联调当前登录身份；后端提供租户列表及 page/pageSize 后迁移，移除游标分页过渡调用。
export function listAcceleratorClusters(
  params: AcceleratorPageParams = {},
  signal?: AbortSignal,
): Promise<AcceleratorClusterListResponse> {
  return coreRequest<AcceleratorClusterListResponse>("/admin/accelerator/clusters", {
    method: "GET",
    params,
    signal,
  });
}
// FIXME(gpu-location-contract): 当前使用 ACC 管理端池列表的权限与游标契约，不改用其他系统的资源池 ID。
// TODO(gpu-location-contract): 联调集群筛选与当前登录身份，待租户端页码列表开放后迁移。
export function listAcceleratorPools(
  params: AcceleratorPoolListParams,
  signal?: AbortSignal,
): Promise<AcceleratorPoolListResponse> {
  return coreRequest<AcceleratorPoolListResponse>("/admin/accelerator/pools", {
    method: "GET",
    params,
    signal,
  });
}
