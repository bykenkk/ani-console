import type { TenantUser, TenantUserStatus } from "@/api/auth/types";
import type { CursorPageParams } from "@/api/types";

/** TODO(backend): 租户成员列表需调整为接收 CursorPageParams 的 limit、cursor 参数。 */
export type TenantMemberListParams = CursorPageParams;
export interface TenantMemberListResponse {
  items: TenantUser[];
  total: string;
}
export interface TenantMemberFields {
  nickname?: string;
  realname?: string;
  avatar?: string;
  email?: string;
  mobile?: string;
  telephone?: string;
  gender?: "SECRET" | "MALE" | "FEMALE";
  address?: string;
  region?: string;
  description?: string;
  remark?: string;
  status?: TenantUserStatus;
  roleIds?: number[];
  orgUnitId?: number;
  orgUnitIds?: number[];
  positionId?: number;
  positionIds?: number[];
}
export type CreateTenantMemberInput = {
  data: TenantMemberFields & { username: string; roleIds: number[] };
} & (
  | { activationMode?: "IMMEDIATE"; password: string }
  | { activationMode: "EMAIL_INVITATION"; password?: never; data: { email: string } }
);
export type CreateTenantMemberRequest = CreateTenantMemberInput;
export interface UpdateTenantMemberInput {
  data: TenantMemberFields;
  /** Comma-separated lowerCamel paths; only submit explicitly edited fields. */
  updateMask: string;
}
export type UpdateTenantMemberRequest = UpdateTenantMemberInput;
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
export interface TenantRoleListResponse {
  items: TenantRole[];
  total: string;
}
