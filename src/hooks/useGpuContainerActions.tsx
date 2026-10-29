import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { startInstance, type InstanceRecord } from "@/api/instances";
import { unavailableAction, type RowAction } from "@/components/common/DataTable/RowActions";
import { openInstanceTerminalWindow } from "@/lib/instances";
import GpuContainerStopModal from "@/components/gpu-containers/GpuContainerStopModal";
import GpuContainerDeleteModal from "@/components/gpu-containers/GpuContainerDeleteModal";

const UNAVAILABLE_ACTIONS = [
  { key: "restart", label: "重启" },
  { key: "scale", label: "扩缩容" },
  { key: "update_image", label: "更新镜像" },
  { key: "resize", label: "变配" },
  { key: "rollback", label: "回滚发布" },
  { key: "attach_volume", label: "挂载云盘" },
  { key: "detach_volume", label: "卸载云盘" },
  // TODO(feature-visibility): 待文件存储支持后恢复 NFS 挂载入口。
  // { key: "attach_filesystem", label: "挂载 NFS" },
  { key: "bind_secret", label: "绑定密钥" },
  // TODO(feature-visibility): 待安全组支持后恢复更换入口。
  // { key: "change_security_groups", label: "更换安全组" },
  { key: "copy-endpoint", label: "复制访问地址" },
  { key: "protection", label: "终止保护" },
];

export function useGpuContainerActions(onChanged: () => void, onDeleted?: () => void) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ action: "stop" | "delete"; instance: InstanceRecord }>();
  const start = useMutation({
    mutationFn: (instance: InstanceRecord) =>
      startInstance(instance.id, {
        expected_version: instance.version,
      }),
    meta: {
      feedback: {
        channel: "notification",
        id: "gpu-container-start",
        action: "启动",
        successText: "启动已提交",
        errorFallback: "启动失败，请刷新后重试",
      },
    },
    // TODO(gpu-container-command): 联调验证 GPU 启动、版本冲突和重复提交；不依据启停推断 GPU 配额归还。
    // TODO(container-task): 本阶段只提示已提交并刷新实例，任务跟踪后续统一接入。
    onSuccess: async (_, instance) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["governance-instance", instance.id] }),
        qc.invalidateQueries({ queryKey: ["governance-instance-runtime", instance.id] }),
      ]);
      onChanged();
    },
  });
  const unavailable = (instance: InstanceRecord) =>
    instance.instance_kind !== "container" ||
    instance.compute_type !== "gpu" ||
    start.isPending ||
    Boolean(dialog) ||
    instance.observedState === "deleted" ||
    instance.desiredState === "deleted";
  const actions: RowAction<InstanceRecord>[] = [
    {
      key: "lifecycle",
      label: (instance) => (instance.observedState === "stopped" ? "启动" : "停止"),
      widthLabel: "启动",
      disabled: (instance) =>
        unavailable(instance) ||
        !["running", "stopped"].includes(instance.observedState) ||
        instance.desiredState !== instance.observedState,
      loading: (instance) => start.isPending && start.variables?.id === instance.id,
      onClick: (instance) => {
        if (
          unavailable(instance) ||
          !["running", "stopped"].includes(instance.observedState) ||
          instance.desiredState !== instance.observedState
        )
          return;
        if (instance.observedState === "stopped") return start.mutateAsync(instance);
        setDialog({ action: "stop", instance });
      },
    },
    // TODO(gpu-container-actions): 当前缺少对应正式契约，入口保持禁用；后端开放后逐项接入，不使用其他实例契约补齐。
    ...UNAVAILABLE_ACTIONS.map(({ key, label }) => unavailableAction<InstanceRecord>(key, label)),
    {
      key: "terminal",
      label: "远程终端",
      disabled: (instance) =>
        unavailable(instance) ||
        instance.observedState !== "running" ||
        instance.desiredState !== "running",
      // TODO(gpu-container-terminal): 联调核对 GPU 终端目标、实例版本绑定及未就绪反馈。
      onClick: (instance) => {
        if (
          unavailable(instance) ||
          instance.observedState !== "running" ||
          instance.desiredState !== "running"
        )
          return;
        return openInstanceTerminalWindow(instance.id);
      },
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: unavailable,
      onClick: (instance) => {
        if (!unavailable(instance)) setDialog({ action: "delete", instance });
      },
    },
  ];
  const submitted = () => {
    setDialog(undefined);
    onChanged();
  };
  const dialogNode = (
    <>
      {dialog?.action === "stop" && (
        <GpuContainerStopModal
          instance={dialog.instance}
          onCancel={() => setDialog(undefined)}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "delete" && (
        <GpuContainerDeleteModal
          instance={dialog.instance}
          onCancel={() => setDialog(undefined)}
          onSubmitted={() => {
            submitted();
            onDeleted?.();
          }}
        />
      )}
    </>
  );
  return { actions, dialogNode };
}
