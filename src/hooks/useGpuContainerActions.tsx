import { applyInstanceLifecycle, type InstanceRecord } from "@/api/instances";
import type { RowAction } from "@/components/common";
import { copyToClipboard } from "@/lib/clipboard";
import { openInstanceTerminalWindow } from "@/lib/instances";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import GpuContainerAttachFilesystemModal from "@/components/gpu-containers/GpuContainerAttachFilesystemModal";
import InstanceAttachVolumeModal from "@/components/instances/InstanceAttachVolumeModal";
import GpuContainerBindSecretModal from "@/components/gpu-containers/GpuContainerBindSecretModal";
import GpuContainerChangeSecurityGroupsModal from "@/components/gpu-containers/GpuContainerChangeSecurityGroupsModal";
import GpuContainerDeleteModal from "@/components/gpu-containers/GpuContainerDeleteModal";
import InstanceDetachVolumeModal from "@/components/instances/InstanceDetachVolumeModal";
import GpuContainerResizeModal from "@/components/gpu-containers/GpuContainerResizeModal";
import GpuContainerRollbackModal from "@/components/gpu-containers/GpuContainerRollbackModal";
import GpuContainerScaleModal from "@/components/gpu-containers/GpuContainerScaleModal";
import GpuContainerStopModal from "@/components/gpu-containers/GpuContainerStopModal";
import GpuContainerUpdateImageModal from "@/components/gpu-containers/GpuContainerUpdateImageModal";

type Instance = InstanceRecord;
type DialogAction =
  | "stop"
  | "delete"
  | "scale"
  | "update_image"
  | "resize"
  | "rollback"
  | "attach_volume"
  | "detach_volume"
  | "attach_filesystem"
  | "bind_secret"
  | "change_security_groups";
type DialogState = { action: DialogAction; instance: Instance };

const BUSY_STATES = new Set<Instance["state"]>([
  "pending",
  "provisioning",
  "starting",
  "stopping",
  "deleting",
]);

export function useGpuContainerActions(onChanged: () => void, onDeleted?: () => void) {
  const [dialog, setDialog] = useState<DialogState>();
  const start = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "gpu-container-start",
        action: "启动",
        successText: "启动已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: (instance: Instance) => applyInstanceLifecycle(instance.id, { action: "start" }),
    onSuccess: onChanged,
  });
  const restart = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "gpu-container-restart",
        action: "重启",
        successText: "重启已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: (instance: Instance) => applyInstanceLifecycle(instance.id, { action: "restart" }),
    onSuccess: onChanged,
  });
  const protection = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "gpu-container-protection",
        action: "更新终止保护",
        successText: "终止保护已更新",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: ({ instance, enabled }: { instance: Instance; enabled: boolean }) =>
      applyInstanceLifecycle(instance.id, { action: "set_termination_protection", enabled }),
    onSuccess: onChanged,
  });

  const pending = (instance: Instance) =>
    (start.isPending && start.variables?.id === instance.id) ||
    (restart.isPending && restart.variables?.id === instance.id) ||
    (protection.isPending && protection.variables?.instance.id === instance.id);
  const busy = (instance: Instance) => BUSY_STATES.has(instance.state) || pending(instance);
  const running = (instance: Instance) => instance.state === "running";
  const canStart = (instance: Instance) => instance.state === "stopped";
  const protectedInstance = (instance: Instance) => instance.termination_protection === true;

  const modalActions = [
    ["scale", "扩缩容"],
    ["update_image", "更新镜像"],
    ["resize", "变配"],
    ["rollback", "回滚发布"],
    ["attach_volume", "挂载云盘"],
    ["detach_volume", "卸载云盘"],
    ["attach_filesystem", "挂载 NFS"],
    ["bind_secret", "绑定密钥"],
    ["change_security_groups", "更换安全组"],
  ] as const;
  const actions: Array<RowAction<Instance>> = [
    {
      key: "lifecycle",
      label: (instance) => (canStart(instance) ? "启动" : "停止"),
      widthLabel: "启动",
      disabled: (instance) =>
        canStart(instance)
          ? pending(instance)
          : !running(instance) || pending(instance) || protectedInstance(instance),
      loading: (instance) => start.isPending && start.variables?.id === instance.id,
      tooltip: (instance) =>
        protectedInstance(instance) && running(instance)
          ? "已开启终止保护，请先关闭终止保护后再关机"
          : undefined,
      onClick: (instance) => {
        if (canStart(instance)) return start.mutateAsync(instance);
        setDialog({ action: "stop", instance });
      },
    },
    {
      key: "restart",
      label: "重启",
      disabled: (instance) => !running(instance) || pending(instance),
      onClick: (instance) => restart.mutateAsync(instance),
    },
    ...modalActions.map(([action, label]): RowAction<Instance> => ({
      key: action,
      label,
      disabled: (instance) =>
        action === "resize" || action === "rollback"
          ? instance.state !== "stopped" || pending(instance)
          : busy(instance),
      onClick: (instance) => setDialog({ action, instance }),
    })),
    {
      key: "copy-endpoint",
      label: "复制访问地址",
      disabled: (instance) => !instance.endpoint,
      onClick: (instance) => copyToClipboard(instance.endpoint ?? "", "访问地址"),
    },
    {
      key: "protection",
      label: (instance) => (protectedInstance(instance) ? "关闭终止保护" : "开启终止保护"),
      widthLabel: "关闭终止保护",
      disabled: (instance) =>
        pending(instance) || instance.state === "deleting" || instance.state === "deleted",
      loading: (instance) =>
        protection.isPending && protection.variables?.instance.id === instance.id,
      onClick: (instance) => {
        if (pending(instance) || instance.state === "deleting" || instance.state === "deleted")
          return;
        return protection.mutateAsync({ instance, enabled: !protectedInstance(instance) });
      },
    },
    {
      key: "terminal",
      label: "远程终端",
      disabled: (instance) => !running(instance) || instance.access?.exec_available === false,
      onClick: (instance) => openInstanceTerminalWindow(instance.id),
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: (instance) => busy(instance) || protectedInstance(instance),
      onClick: (instance) => setDialog({ action: "delete", instance }),
    },
  ];

  const close = () => setDialog(undefined);
  const submitted = () => {
    close();
    if (dialog?.action === "delete" && onDeleted) onDeleted();
    else onChanged();
  };
  const dialogNode = dialog ? (
    dialog.action === "stop" ? (
      <GpuContainerStopModal instance={dialog.instance} onCancel={close} onSubmitted={submitted} />
    ) : dialog.action === "delete" ? (
      <GpuContainerDeleteModal
        instance={dialog.instance}
        onCancel={close}
        onSubmitted={submitted}
      />
    ) : dialog.action === "scale" ? (
      <GpuContainerScaleModal instance={dialog.instance} onCancel={close} onSubmitted={submitted} />
    ) : dialog.action === "update_image" ? (
      <GpuContainerUpdateImageModal
        instance={dialog.instance}
        onCancel={close}
        onSubmitted={submitted}
      />
    ) : dialog.action === "resize" ? (
      <GpuContainerResizeModal
        instance={dialog.instance}
        onCancel={close}
        onSubmitted={submitted}
      />
    ) : dialog.action === "rollback" ? (
      <GpuContainerRollbackModal
        instance={dialog.instance}
        onCancel={close}
        onSubmitted={submitted}
      />
    ) : dialog.action === "attach_volume" ? (
      <InstanceAttachVolumeModal
        instance={dialog.instance}
        onCancel={close}
        onSubmitted={submitted}
      />
    ) : dialog.action === "detach_volume" ? (
      <InstanceDetachVolumeModal
        instance={dialog.instance}
        onCancel={close}
        onSubmitted={submitted}
      />
    ) : dialog.action === "attach_filesystem" ? (
      <GpuContainerAttachFilesystemModal
        instance={dialog.instance}
        onCancel={close}
        onSubmitted={submitted}
      />
    ) : dialog.action === "bind_secret" ? (
      <GpuContainerBindSecretModal
        instance={dialog.instance}
        onCancel={close}
        onSubmitted={submitted}
      />
    ) : (
      <GpuContainerChangeSecurityGroupsModal
        instance={dialog.instance}
        onCancel={close}
        onSubmitted={submitted}
      />
    )
  ) : null;

  return { dialogNode, actions };
}
