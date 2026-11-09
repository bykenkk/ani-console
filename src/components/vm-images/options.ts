import type { VmImageKind, VmImageReason, VmImageState } from "@/api/vm-images";
import type { StatusBadgeTone } from "@/components/common";

export const VM_IMAGE_KINDS: Record<VmImageKind, string> = {
  DISK_IMAGE: "磁盘镜像",
  INSTALL_ISO: "安装镜像（ISO）",
};

export const VM_IMAGE_STATES: Record<
  VmImageState,
  { label: string; tone: StatusBadgeTone; loading: boolean }
> = {
  PREPARING: { label: "准备中", tone: "primary", loading: true },
  IMPORTING: { label: "导入中", tone: "primary", loading: true },
  VERIFYING: { label: "校验中", tone: "primary", loading: true },
  READY: { label: "可用", tone: "success", loading: false },
  FAILED: { label: "失败", tone: "danger", loading: false },
  UNAVAILABLE: { label: "不可用", tone: "danger", loading: false },
  DELETING: { label: "删除中", tone: "warning", loading: true },
  DELETED: { label: "已删除", tone: "neutral", loading: false },
};

export const VM_IMAGE_REASONS: Record<Exclude<VmImageReason, "">, string> = {
  UPLOAD_DEADLINE_EXCEEDED: "上传已超时",
  UPLOAD_REJECTED: "上传被拒绝",
  CAPACITY_INSUFFICIENT: "存储容量不足",
  SOURCE_VALIDATION_FAILED: "镜像源校验失败",
  SOURCE_IDENTITY_CHANGED: "镜像源已变更",
  NAMESPACE_INVALID: "镜像存储环境异常，请联系管理员",
  NATIVE_CLEANUP_BLOCKED: "镜像清理受阻，请联系管理员处理",
  VM_IMAGE_UPLOAD_DISABLED: "镜像上传暂未开放",
  VM_IMAGE_DEPENDENCY_UNAVAILABLE: "镜像依赖服务暂不可用",
  VM_IMAGE_NATIVE_IDENTITY_CHANGED: "镜像源标识已变更，请联系管理员",
  VM_IMAGE_UNAVAILABLE: "镜像暂不可用",
  VM_SUPERSEDED_BY_DELETE: "镜像操作已由删除操作替代",
};
