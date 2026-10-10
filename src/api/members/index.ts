import { adminRequest } from "@/api/request";
import type { TenantUser } from "@/api/auth/types";
import type {
  TenantMemberListParams,
  TenantMemberListResponse,
  CreateTenantMemberInput,
  CreateTenantMemberRequest,
  UpdateTenantMemberInput,
  UpdateTenantMemberRequest,
  TenantRole,
  TenantRoleListParams,
  TenantRoleListResponse,
} from "./types";

const memberPath = (id: number) => `/users/${encodeURIComponent(id)}`;

/** Tenant administrator only; tenant identity is supplied by the authenticated backend context. */
export function listTenantMembers(
  params: TenantMemberListParams = {},
  signal?: AbortSignal,
): Promise<TenantMemberListResponse> {
  return adminRequest<TenantMemberListResponse>("/users", { method: "GET", params, signal });
}
export function getTenantMember(id: number, signal?: AbortSignal): Promise<TenantUser> {
  return adminRequest<TenantUser>(memberPath(id), { method: "GET", signal });
}
// The current member write contracts have no client idempotency field/header.
export async function createTenantMember(
  input: CreateTenantMemberInput,
  signal?: AbortSignal,
): Promise<void> {
  await adminRequest<unknown, CreateTenantMemberRequest>("/users", {
    method: "POST",
    data: input,
    signal,
  });
}
export async function updateTenantMember(
  id: number,
  input: UpdateTenantMemberInput,
  signal?: AbortSignal,
): Promise<void> {
  await adminRequest<unknown, UpdateTenantMemberRequest>(memberPath(id), {
    method: "PUT",
    data: input,
    signal,
  });
}
export async function deleteTenantMember(id: number, signal?: AbortSignal): Promise<void> {
  await adminRequest<unknown>(memberPath(id), { method: "DELETE", signal });
}
/** Read existing tenant roles only; this module intentionally exposes no role writes. */
export function listTenantRoles(
  params: TenantRoleListParams = {},
  signal?: AbortSignal,
): Promise<TenantRoleListResponse> {
  return adminRequest<TenantRoleListResponse>("/roles", { method: "GET", params, signal });
}
export function getTenantRole(id: number, signal?: AbortSignal): Promise<TenantRole> {
  return adminRequest<TenantRole>(`/roles/${encodeURIComponent(id)}`, { method: "GET", signal });
}
export type * from "./types";
