import type { TokenExpiresIn } from "./token";

export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
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
  refresh_token?: string;
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

export type LogoutRequest = LogoutInput;

export interface RevokeStatusResponse {
  status: "revoked";
}
