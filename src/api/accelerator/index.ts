import { coreRequest } from "@/api/request";
import type {
  AcceleratorPageParams,
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
