// TODO(storage-migration): 保留 ANI 存量契约；仅供旧资源调用，待对应 governance 能力补齐后迁移。
import type { CursorPageParams } from "@/api/types";

export type StorageBucketAcl = "private" | "tenant_read";
export type StorageBucketClass = "standard" | "infrequent_access";

export interface StorageBucketLifecycleRule {
  id: string;
  name: string;
  prefix: string;
  expire_days: number;
  to_infrequent_days: number;
  enabled: boolean;
}

export interface StorageBucketRecord {
  id: string;
  name: string;
  region?: string | null;
  endpoint?: string | null;
  access_mode: "private" | "public_read";
  acl?: StorageBucketAcl | null;
  acl_label?: string | null;
  storage_class?: StorageBucketClass | null;
  versioning?: "disabled" | "enabled" | null;
  object_count?: number;
  size_bytes?: number;
  lifecycle_rules?: StorageBucketLifecycleRule[];
  lifecycle_note?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface StorageBucketListParams {
  search_field?: "name" | "id";
  keyword?: string;
}
export interface StorageBucketListResponse {
  items: StorageBucketRecord[];
  total: number;
  next_cursor?: string | null;
}

export interface CreateStorageBucketInput {
  name: string;
  region?: string;
  access_mode: "private" | "public_read";
}
export type CreateStorageBucketRequest = CreateStorageBucketInput & { idempotency_key: string };

export interface StorageBucketAclUpdateInput {
  acl: StorageBucketAcl;
}
export type StorageBucketAclUpdateRequest = StorageBucketAclUpdateInput & {
  idempotency_key: string;
};

export interface StorageBucketClassUpdateInput {
  storage_class: StorageBucketClass;
}
export type StorageBucketClassUpdateRequest = StorageBucketClassUpdateInput & {
  idempotency_key: string;
};

export interface StorageBucketObjectEntry {
  kind: "prefix" | "object";
  name: string;
  key: string;
  size_bytes?: number | null;
  size_label?: string | null;
  updated_at?: string | null;
  storage_class?: StorageBucketClass | null;
}

// TODO(pagination-migration): ANI StorageBucketObjectListRequest 仍使用 limit/cursor，保留过渡请求；待后端改造后迁移 PageParams。
export interface StorageBucketObjectListParams extends CursorPageParams {
  prefix?: string;
}
export interface StorageBucketObjectListResponse {
  items: StorageBucketObjectEntry[];
  total: number;
  prefix: string;
  next_cursor?: string | null;
}

export interface BucketObjectDeleteResponse {
  bucket_id: string;
  key: string;
  deleted: boolean;
}

export interface BucketObjectPresignedUrlInput {
  key: string;
  expires_hours?: number;
  method?: "GET" | "PUT";
}
export type BucketObjectPresignedUrlRequest = BucketObjectPresignedUrlInput & {
  idempotency_key: string;
};
export interface BucketObjectPresignedUrlResponse {
  download_url: string;
  expires_at?: string;
  content_type?: string | null;
  size_bytes?: number | null;
}

export interface StorageBucketLifecycleRuleCreateInput {
  name: string;
  prefix: string;
  expire_days: number;
  to_infrequent_days: number;
  enabled: boolean;
}
export type StorageBucketLifecycleRuleCreateRequest = StorageBucketLifecycleRuleCreateInput & {
  idempotency_key: string;
};
export interface StorageBucketLifecycleRuleListResponse {
  items: StorageBucketLifecycleRule[];
  total: number;
}
