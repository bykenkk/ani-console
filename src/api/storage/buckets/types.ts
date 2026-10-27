import type { PageParams } from "@/api/types";
export interface StorageBucketRecord {
  id: string;
  name: string;
}
export type StorageBucketListParams = PageParams;
export interface StorageBucketListResponse {
  items: StorageBucketRecord[];
  total: string;
}
