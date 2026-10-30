import type { StorageBucketRecord } from "@/api/storage/buckets";
import type { RowAction } from "@/components/common";

// TODO(storage-migration): 桶存储类型、权限及删除尚无新契约；旧实现保留，不混用逻辑桶 ID。上传由 useStorageBucketActions 接入。
export const storageBucketActions: RowAction<StorageBucketRecord>[] = [
  { key: "storage-class", label: "存储类型" },
  { key: "upload", label: "上传" },
  { key: "permissions", label: "改权限" },
  { key: "delete", label: "删除", intent: "danger" as const },
].map((action) => ({
  ...action,
  disabled: () => true,
  tooltip: "暂未支持",
  onClick: () => {},
}));
