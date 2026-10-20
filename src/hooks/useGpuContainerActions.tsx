import { showMessage } from "@/lib/feedback";
import {
  getInstance as getLegacyInstance,
  applyInstanceLifecycle,
  type InstanceRecord,
} from "@/api/instances/legacy";
// FIXME(governance-instance-actions): 未对齐的操作、组件和旧调用保留，已对齐的启停删除使用新契约。
// TODO(governance-instance-actions): 后端覆盖重启、变配、网络/存储、镜像、密钥和保护后逐项迁移。
import {
  getInstance,
  startInstance,
  type InstanceRecord as GovernanceInstance,
  type InstanceAcceptance,
} from "@/api/instances";
import InstanceOperationModal from "@/components/instances/InstanceOperationModal";
import { withId } from "@/lib/id";
import type { RowAction } from "@/components/common";
import { copyToClipboard } from "@/lib/clipboard";
import { openInstanceTerminalWindow } from "@/lib/instances";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const qc = useQueryClient();
  const [commandDialog, setCommandDialog] = useState<{
    action: "stop" | "delete";
    instance: GovernanceInstance;
  }>();
  const [acceptance, setAcceptance] = useState<InstanceAcceptance>();
  const [loadingLegacy, setLoadingLegacy] = useState(false);
  const refresh = async () => {
    onChanged();
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["governance-instances"] }),
      qc.invalidateQueries({ queryKey: ["legacy-instances"] }),
      qc.invalidateQueries({ queryKey: ["governance-instance"] }),
      qc.invalidateQueries({ queryKey: ["governance-instance-runtime"] }),
      qc.invalidateQueries({ queryKey: ["legacy-instance"] }),
    ]);
  };
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
    mutationFn: async (instance: { id: string; version?: string }) =>
      startInstance(instance.id, {
        expected_version: instance.version ?? (await getInstance(instance.id)).version,
      }),
    onSuccess: async (result) => {
      setAcceptance(result);
      await refresh();
    },
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
    onSuccess: refresh,
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
    onSuccess: refresh,
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
  const submitted = async (result?: InstanceAcceptance | string) => {
    if (result && typeof result !== "string") {
      setAcceptance(result);
      onChanged();
      close();
      setCommandDialog(undefined);
      return;
    }
    close();
    await refresh();
  };
  const deleteSubmitted = () => {
    close();
    setCommandDialog(undefined);
    onChanged();
    onDeleted?.();
  };
  const governanceActions: RowAction<GovernanceInstance>[] = actions.map((action) => ({
    key: action.key,
    intent: action.intent,
    label: (instance) => {
      if (action.key === "lifecycle") return instance.observedState === "stopped" ? "启动" : "停止";
      if (typeof action.label === "string") return action.label;
      const original = qc.getQueryData<Instance>(["legacy-instance", instance.id]);
      return original ? action.label(original) : "终止保护";
    },
    tooltip: (instance) => {
      const original = qc.getQueryData<Instance>(["legacy-instance", instance.id]);
      if (
        original?.termination_protection &&
        (action.key === "delete" ||
          (action.key === "lifecycle" && instance.observedState === "running"))
      ) {
        return "已开启终止保护，请先关闭后再操作";
      }
      return typeof action.tooltip === "function"
        ? original
          ? action.tooltip(original)
          : undefined
        : action.tooltip;
    },
    widthLabel: action.widthLabel ?? (typeof action.label === "string" ? action.label : "终止保护"),
    disabled: (instance) => {
      if (
        start.isPending ||
        restart.isPending ||
        protection.isPending ||
        loadingLegacy ||
        dialog ||
        commandDialog ||
        instance.observedState === "deleted" ||
        instance.desiredState === "deleted"
      )
        return true;
      // FIXME(governance-instance-actions): 终止保护及各旧操作的限制尚无新字段，保留已知旧状态的判断。
      // TODO(governance-instance-actions): 对齐保护等契约后再移除旧状态与操作条件，不能仅按 observedState 推断。
      const original = qc.getQueryData<Instance>(["legacy-instance", instance.id]);
      if (
        original?.termination_protection &&
        (action.key === "delete" ||
          (action.key === "lifecycle" && instance.observedState === "running"))
      )
        return true;
      if (
        original &&
        !["lifecycle", "delete", "terminal"].includes(action.key) &&
        action.disabled?.(original)
      )
        return true;
      if (action.key === "load-balancer") return true;
      if (action.key === "lifecycle")
        return (
          !["running", "stopped"].includes(instance.observedState) ||
          instance.desiredState !== instance.observedState
        );
      if (action.key === "terminal" || action.key === "restart")
        return instance.observedState !== "running";
      if (action.key === "resize" || action.key === "rollback")
        return instance.observedState !== "stopped";
      return false;
    },
    loading: (instance) => {
      if (action.key === "lifecycle") return start.isPending && start.variables?.id === instance.id;
      const original = qc.getQueryData<Instance>(["legacy-instance", instance.id]);
      return original ? (action.loading?.(original) ?? false) : false;
    },
    onClick: async (instance) => {
      if (action.key === "lifecycle") {
        if (instance.observedState === "stopped") return start.mutateAsync(instance);
        setCommandDialog({ action: "stop", instance });
        return;
      }
      if (action.key === "delete") {
        setCommandDialog({ action: "delete", instance });
        return;
      }
      if (action.key === "terminal") return openInstanceTerminalWindow(instance.id);
      setLoadingLegacy(true);
      try {
        const legacy = await qc.fetchQuery({
          queryKey: ["legacy-instance", instance.id],
          queryFn: () => getLegacyInstance(instance.id),
          staleTime: 0,
          meta: {
            errorNotification: {
              id: withId("legacy-instance", instance.id),
              action: "实例操作信息加载",
            },
          },
        });
        if (action.disabled?.(legacy)) {
          const tooltip =
            typeof action.tooltip === "function" ? action.tooltip(legacy) : action.tooltip;
          showMessage({
            type: "warning",
            content: tooltip || "当前实例状态不支持此操作，请刷新后重试",
          });
          return;
        }
        return await action.onClick(legacy);
      } finally {
        setLoadingLegacy(false);
      }
    },
  }));
  const dialogNode = (
    <>
      {dialog?.action === "stop" && (
        <GpuContainerStopModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "delete" && (
        <GpuContainerDeleteModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={deleteSubmitted}
        />
      )}
      {dialog?.action === "scale" && (
        <GpuContainerScaleModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "update_image" && (
        <GpuContainerUpdateImageModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "resize" && (
        <GpuContainerResizeModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "rollback" && (
        <GpuContainerRollbackModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "attach_volume" && (
        <InstanceAttachVolumeModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "detach_volume" && (
        <InstanceDetachVolumeModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "attach_filesystem" && (
        <GpuContainerAttachFilesystemModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "bind_secret" && (
        <GpuContainerBindSecretModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "change_security_groups" && (
        <GpuContainerChangeSecurityGroupsModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {commandDialog?.action === "stop" && (
        <GpuContainerStopModal
          instance={commandDialog.instance}
          onCancel={() => setCommandDialog(undefined)}
          onSubmitted={submitted}
        />
      )}
      {commandDialog?.action === "delete" && (
        <GpuContainerDeleteModal
          instance={commandDialog.instance}
          onCancel={() => setCommandDialog(undefined)}
          onSubmitted={deleteSubmitted}
        />
      )}
      {acceptance && (
        <InstanceOperationModal
          acceptance={acceptance}
          onCancel={() => {
            setAcceptance(undefined);
          }}
        />
      )}
    </>
  );

  return { dialogNode, actions: governanceActions, legacyActions: actions };
}
