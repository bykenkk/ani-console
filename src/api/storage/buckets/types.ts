import type { PageParams } from "@/api/types";
export interface StorageBucketRecord {
  id: string;
  name: string;
}
export interface StorageBucketListParams extends PageParams {
  name?: string;
  id?: string;
}
export interface StorageBucketListResponse {
  items: StorageBucketRecord[];
  total: string;
}
