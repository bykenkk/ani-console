// TODO(storage-migration): 保留 ANI 存量契约；仅供旧资源调用，待对应 governance 能力补齐后迁移。

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
