import { coreRequest } from "@/api/request";
import type {
  ApiKeyCredentials,
  ApiKeyListParams,
  ApiKeyListResponse,
  CreateApiKeyInput,
  CreateApiKeyRequest,
  DeleteApiKeyResponse,
  UpdateApiKeyInput,
  UpdateApiKeyRequest,
} from "./types";

const apiKeyPath = (keyId: number) => `/auth/api-keys/${encodeURIComponent(keyId)}`;

export function listApiKeys(params: ApiKeyListParams = {}): Promise<ApiKeyListResponse> {
  return coreRequest<ApiKeyListResponse>("/auth/api-keys", { method: "GET", params });
}

export function createApiKey(submitData: CreateApiKeyInput): Promise<ApiKeyCredentials> {
  return coreRequest<ApiKeyCredentials, CreateApiKeyRequest>("/auth/api-keys", {
    method: "POST",
    data: { data: submitData },
  });
}

export function updateApiKey(
  keyId: number,
  submitData: UpdateApiKeyInput,
  updateMask: string,
): Promise<void> {
  return coreRequest<void, UpdateApiKeyRequest>(apiKeyPath(keyId), {
    method: "PUT",
    data: { data: submitData, update_mask: updateMask },
  });
}

export function deleteApiKey(keyId: number): Promise<DeleteApiKeyResponse> {
  return coreRequest<DeleteApiKeyResponse>(apiKeyPath(keyId), { method: "DELETE" });
}

export function resetApiKeySecret(keyId: number): Promise<ApiKeyCredentials> {
  return coreRequest<ApiKeyCredentials, Record<string, never>>(`${apiKeyPath(keyId)}/secret`, {
    method: "PUT",
    data: {},
  });
}

export type {
  ApiKeyCredentials,
  ApiKeyListParams,
  ApiKeyListResponse,
  ApiKeyRecord,
  CreateApiKeyInput,
  DeleteApiKeyResponse,
  UpdateApiKeyInput,
} from "./types";
