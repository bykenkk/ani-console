import type { DatasetSourceSelection } from "@/api/modeldev";

export const DATASET_STATE_LABELS = { ACTIVE: "启用", ARCHIVED: "已归档" };

export const DATASET_VERSION_STATE_LABELS: Record<string, string> = { READY: "可用" };

export const DATASET_SOURCE_LOCK_LABELS: Record<DatasetSourceSelection["lock_kind"], string> = {
  IMMUTABLE_REVISION: "不可变版本",
  FILE_SHA256: "SHA-256 文件校验",
};

export const DATASET_PROVIDER_LABELS = {
  HUGGINGFACE: "HuggingFace",
  MODELSCOPE: "ModelScope",
};

export const DATASET_OPERATION_LABELS = {
  DATASET_CREATED: "创建数据集",
  DATASET_UPDATED: "编辑数据集",
  DATASET_ARCHIVED: "归档数据集",
  DATASET_RESTORED: "恢复数据集",
  IMPORT_ACCEPTED: "导入已受理",
  IMPORT_RETRY_ACCEPTED: "重试已受理",
  IMPORT_CANCEL_REQUESTED: "取消已请求",
  IMPORT_SUCCEEDED: "导入成功",
  IMPORT_FAILED: "导入失败",
  IMPORT_CANCELLED: "导入已取消",
};

export const DATASET_OPERATION_RESULT_LABELS: Record<string, string> = {
  ACCEPTED: "已受理",
  SUCCEEDED: "成功",
  NO_CHANGE: "无变化",
  FAILED: "失败",
  CANCELLED: "已取消",
};
