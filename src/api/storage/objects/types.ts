export interface StorageObject {
  key: string;
  size: string;
  etag: string;
  last_modified: string;
}
export interface StorageObjectMeta extends StorageObject {
  content_type: string;
}
// TODO(pagination-migration): 当前对象协议仅支持 limit/cursor 且无 total；待后端提供替代契约后迁移，不模拟页码或全量加载。
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
