import type { PageParams } from "@/api/types";
export type StorageClassListParams = PageParams;
export interface StorageClass {
  name: string;
  provisioner: string;
  is_default: boolean;
  allow_volume_expansion: boolean;
  volume_binding_mode: string;
  reclaim_policy: string;
}
export interface StorageClassListResponse {
  items: StorageClass[];
  total: string;
}
