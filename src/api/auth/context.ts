import { adminRequest } from "@/api/request";
import type { TenantUser } from "./types";

export const currentUserQueryKey = ["auth", "current-user"] as const;

export function getCurrentUser(signal?: AbortSignal): Promise<TenantUser> {
  return adminRequest<TenantUser>("/me", { method: "GET", signal });
}
