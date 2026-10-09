import { coreRequest } from "@/api/request";
import type {
  AccessKey,
  AccessKeyListParams,
  AccessKeyListResponse,
  CreateAccessKeyInput,
  CreateAccessKeyRequest,
  UpdateAccessKeyInput,
  UpdateAccessKeyRequest,
  AccessKeySecretDelivery,
  RevokeAccessKeyResponse,
} from "./types";

const keyPath = (id: number) => `/auth/api-keys/${encodeURIComponent(id)}`;

export function listAccessKeys(
  params: AccessKeyListParams = {},
  signal?: AbortSignal,
): Promise<AccessKeyListResponse> {
  return coreRequest<AccessKeyListResponse>("/auth/api-keys", { method: "GET", params, signal });
}
export function getAccessKey(id: number, signal?: AbortSignal): Promise<AccessKey> {
  return coreRequest<AccessKey>(keyPath(id), { method: "GET", signal });
}
// These contracts do not declare client idempotency fields or headers.
export function createAccessKey(
  input: CreateAccessKeyInput,
  signal?: AbortSignal,
): Promise<AccessKeySecretDelivery> {
  return coreRequest<AccessKeySecretDelivery, CreateAccessKeyRequest>("/auth/api-keys", {
    method: "POST",
    data: { data: input },
    signal,
  });
}
export async function updateAccessKey(
  id: number,
  input: UpdateAccessKeyInput,
  signal?: AbortSignal,
): Promise<void> {
  await coreRequest<unknown, UpdateAccessKeyRequest>(keyPath(id), {
    method: "PUT",
    data: input,
    signal,
  });
}
export function deleteAccessKey(
  id: number,
  signal?: AbortSignal,
): Promise<RevokeAccessKeyResponse> {
  return coreRequest<RevokeAccessKeyResponse>(keyPath(id), { method: "DELETE", signal });
}
/** Secret is returned only on create/reset; do not retain it in resource caches. */
export function resetAccessKeySecret(
  id: number,
  signal?: AbortSignal,
): Promise<AccessKeySecretDelivery> {
  return coreRequest<AccessKeySecretDelivery, Record<string, never>>(`${keyPath(id)}/secret`, {
    method: "PUT",
    data: {},
    signal,
  });
}
export type * from "./types";
