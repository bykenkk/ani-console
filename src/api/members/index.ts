import { adminRequest } from "@/api/request";

import type { TenantRoleListParams, TenantRoleListResponse } from "./types";

/** Read existing tenant roles only; this module intentionally exposes no role writes. */
export function listTenantRoles(
  params: TenantRoleListParams = {},
  signal?: AbortSignal,
): Promise<TenantRoleListResponse> {
  return adminRequest<TenantRoleListResponse>("/roles", { method: "GET", params, signal });
}

export type * from "./types";
