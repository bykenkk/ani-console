import type { StorageBucketRecord } from "@/api/storage/buckets";
import type { RowAction } from "@/components/common";

// TODO(storage-migration): 桶写操作未提供新契约；useBucketActions 和各旧弹窗保留，不能混用逻辑桶 ID。
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
