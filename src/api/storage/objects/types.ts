export interface StorageObject {
  key: string;
  size: string;
  etag: string;
  last_modified: string;
}
export interface StorageObjectMeta extends StorageObject {
  content_type: string;
}
// 对象列表使用领域游标，只有 limit/cursor、没有 total，不模拟页码或全量加载。
export interface StorageObjectListParams {
  prefix?: string;
  limit?: number;
  cursor?: string;
}
export interface StorageObjectListResponse {
  items: StorageObject[];
  common_prefixes: string[];
  next_cursor: string;
  is_truncated: boolean;
}
export interface StorageObjectInput {
  bucket_id: string;
  key: string;
}
export interface StorageObjectRequest {
  data: StorageObjectInput;
}
export interface StorageObjectDownloadInfo {
  url: string;
  expires_at: string;
}
