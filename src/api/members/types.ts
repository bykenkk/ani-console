import type { PageParams } from "@/api/types";

export interface TenantRole {
  id?: number;
  name?: string;
  code?: string;
  sortOrder?: number;
  status?: "OFF" | "ON";
  description?: string;
  isProtected?: boolean;
  type?: "TENANT";
  dataScope?: string;
  permissions?: number[];
  orgUnits?: number[];
  fieldPermissions?: { resource?: string; hiddenFields?: string[] }[];
  tenantId?: number;
  tenantName?: string;
  createdBy?: number;
  updatedBy?: number;
  deletedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
export type TenantRoleListParams = PageParams;

export interface TenantRoleListResponse {
  items: TenantRole[];
  total: string;
}
