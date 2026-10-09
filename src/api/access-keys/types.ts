import type { CursorPageParams } from "@/api/types";

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
/** TODO(backend): 访问密钥列表需调整为接收 CursorPageParams 的 limit、cursor 参数。 */
export type AccessKeyListParams = CursorPageParams;
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
