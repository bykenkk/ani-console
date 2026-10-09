export interface ApiKeyRecord {
  id: number;
  name: string;
  access_key: string;
  is_active: boolean;
  expires_at?: string | null;
  last_used_at?: string | null;
  role_id: number;
  created_at?: string | null;
}

export interface ApiKeyListParams {
  page?: number;
  pageSize?: number;
  noPaging?: boolean;
}

export interface ApiKeyListResponse {
  items: ApiKeyRecord[];
  total: number | string;
}

export interface CreateApiKeyInput {
  name: string;
  role_id: number;
  expires_at?: string;
}

export interface CreateApiKeyRequest {
  data: CreateApiKeyInput;
}

export interface ApiKeyCredentials {
  data: ApiKeyRecord;
  secret_key: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  role_id?: number;
  is_active?: boolean;
  expires_at?: string | null;
}

export interface UpdateApiKeyRequest {
  data: UpdateApiKeyInput;
  update_mask: string;
}

export interface DeleteApiKeyResponse {
  status: "revoked";
}
