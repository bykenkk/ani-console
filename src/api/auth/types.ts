import type { TokenExpiresIn } from "./token";

export interface AuthTokenPair {
  access_token: string;
  expires_in: number;
  issued_at?: string;
}

export interface PasswordLoginRequest {
  tenant_name: string;
  username: string;
  password: string;
}

export type PasswordLoginInput = PasswordLoginRequest;

export interface PasswordLoginResponse {
  access_token?: string;
  expires_in?: TokenExpiresIn;
  issued_at?: string;
  mfa_required?: boolean;
  mfa_operation_id?: string;
}

export interface CompleteOidcLoginInput {
  state: string;
  code: string;
  redirect_uri: string;
}

export interface CompleteOidcLoginRequest extends CompleteOidcLoginInput {
  idempotency_key: string;
}

export interface LogoutInput {
  jti?: string;
}

export interface LogoutRequest extends LogoutInput {
  application: "console";
}

export interface RevokeStatusResponse {
  status: "revoked";
  session_revoked: boolean;
}

export type TenantUserStatus = "DISABLED" | "NORMAL" | "PENDING" | "LOCKED" | "EXPIRED" | "CLOSED";
/** Optional fields can be omitted by field permissions or redaction. */
export interface TenantUser {
  id?: number;
  tenantId?: number;
  tenantName?: string;
  orgUnitId?: number;
  orgUnitIds?: number[];
  orgUnitName?: string;
  orgUnitNames?: string[];
  positionId?: number;
  positionIds?: number[];
  positionName?: string;
  positionNames?: string[];
  roleId?: number;
  roleIds?: number[];
  roles?: string[];
  roleNames?: string[];
  username?: string;
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
  lastLoginAt?: string;
  lastLoginIp?: string;
  status?: TenantUserStatus;
  lockedUntil?: string;
  createdBy?: number;
  updatedBy?: number;
  deletedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
export interface TenantNavigationMeta {
  activeIcon?: string;
  activePath?: string;
  affixTab?: boolean;
  affixTabOrder?: number;
  authority?: string[];
  badge?: string;
  badgeType?: string;
  badgeVariants?: string;
  hideChildrenInMenu?: boolean;
  hideInBreadcrumb?: boolean;
  hideInMenu?: boolean;
  hideInTab?: boolean;
  icon?: string;
  iframeSrc?: string;
  ignoreAccess?: boolean;
  keepAlive?: boolean;
  link?: string;
  loaded?: boolean;
  maxNumOfOpenTab?: number;
  menuVisibleWithForbidden?: boolean;
  openInNewWindow?: boolean;
  order?: number;
  title?: string;
}
export interface TenantNavigationItem {
  children?: TenantNavigationItem[];
  path?: string;
  redirect?: string;
  alias?: string;
  name?: string;
  component?: string;
  meta?: TenantNavigationMeta;
}
export interface TenantInitialContext {
  menus: TenantNavigationItem[];
  permissions: string[];
  hiddenFields?: string[];
}
export interface TenantNavigationResponse {
  items: TenantNavigationItem[];
}
export interface TenantPermissionCodes {
  codes: string[];
  hiddenFields?: string[];
}
export interface VerifyLoginMfaInput {
  operationId: string;
  totpCode: string;
}
export type VerifyLoginMfaRequest = VerifyLoginMfaInput;
export interface ForgotPasswordInput {
  identifier: string;
}
export type ForgotPasswordRequest = ForgotPasswordInput;
export interface AcceptInvitationInput {
  token: string;
  password: string;
}
export type AcceptInvitationRequest = AcceptInvitationInput;
