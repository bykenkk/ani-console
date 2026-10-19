import type { PageParams } from "@/api/types";

export interface AccessKey {
  id?: number;
  name?: string;
  access_key?: string;
  is_active?: boolean;
  expires_at?: string;
  last_used_at?: string;
  role_id?: number;
  created_at?: string;
}
export type AccessKeyListParams = PageParams;
export interface AccessKeyListResponse {
  items: AccessKey[];
  total: string;
}
export interface CreateAccessKeyInput {
  name: string;
  role_id: number;
  expires_at?: string;
}
export interface CreateAccessKeyRequest {
  data: CreateAccessKeyInput;
}
export interface UpdateAccessKeyInput {
  data: { name?: string; role_id?: number; is_active?: boolean; expires_at?: string | null };
  /** FieldMask uses lowerCamel paths: name,roleId,isActive,expiresAt. */
  update_mask: string;
}
export type UpdateAccessKeyRequest = UpdateAccessKeyInput;
export interface AccessKeySecretDelivery {
  data: AccessKey;
  secret_key: string;
}
export interface RevokeAccessKeyResponse {
  status: string;
}
