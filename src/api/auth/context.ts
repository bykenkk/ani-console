import { adminRequest } from "@/api/request";
import type {
  TenantUser,
  TenantInitialContext,
  TenantNavigationResponse,
  TenantPermissionCodes,
} from "./types";

export function getCurrentUser(signal?: AbortSignal): Promise<TenantUser> {
  return adminRequest<TenantUser>("/me", { method: "GET", signal });
}
export function getTenantInitialContext(signal?: AbortSignal): Promise<TenantInitialContext> {
  return adminRequest<TenantInitialContext>("/initial-context", { method: "GET", signal });
}
export function getTenantNavigation(signal?: AbortSignal): Promise<TenantNavigationResponse> {
  return adminRequest<TenantNavigationResponse>("/routes", { method: "GET", signal });
}
export function getTenantPermissionCodes(signal?: AbortSignal): Promise<TenantPermissionCodes> {
  return adminRequest<TenantPermissionCodes>("/perm-codes", { method: "GET", signal });
}
