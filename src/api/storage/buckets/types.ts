import type { PageParams } from "@/api/types";
export interface StorageBucketRecord {
  id: string;
  name: string;
  // TODO(storage-runtime): 元数据增量尚未部署，部署后核对零值和时间回显。
  created_at?: string | null;
  region?: string;
  storage_class?: string;
  acl?: string;
}
export interface CreateStorageBucketInput {
  name: string;
}
export interface StorageBucketStats {
  object_count: string;
  total_size: string;
  truncated: boolean;
  scanned: string;
}
export interface StorageBucketListParams extends PageParams {
  name?: string;
  id?: string;
}
export interface StorageBucketListResponse {
  items: StorageBucketRecord[];
  total: string;
}
