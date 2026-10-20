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
} from "@/api/instances";
import { withId } from "@/lib/id";
import type { RowAction } from "@/components/common";
import { copyToClipboard } from "@/lib/clipboard";
import { openInstanceTerminalWindow } from "@/lib/instances";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ContainerAttachFilesystemModal from "@/components/containers/ContainerAttachFilesystemModal";
import InstanceAttachVolumeModal from "@/components/instances/InstanceAttachVolumeModal";
import ContainerBindSecretModal from "@/components/containers/ContainerBindSecretModal";
import ContainerChangeSecurityGroupsModal from "@/components/containers/ContainerChangeSecurityGroupsModal";
import ContainerDeleteModal from "@/components/containers/ContainerDeleteModal";
import InstanceDetachVolumeModal from "@/components/instances/InstanceDetachVolumeModal";
import ContainerResizeModal from "@/components/containers/ContainerResizeModal";
import ContainerRollbackModal from "@/components/containers/ContainerRollbackModal";
import ContainerScaleModal from "@/components/containers/ContainerScaleModal";
import ContainerStopModal from "@/components/containers/ContainerStopModal";
import ContainerUpdateImageModal from "@/components/containers/ContainerUpdateImageModal";

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

export function useContainerActions(onChanged: () => void, onDeleted?: () => void) {
  const qc = useQueryClient();
  const [commandDialog, setCommandDialog] = useState<{
    action: "stop" | "delete";
    instance: GovernanceInstance;
  }>();
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
        id: "container-start",
        action: "启动",
        successText: "启动已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async (instance: { id: string; version?: string }) =>
      startInstance(instance.id, {
        expected_version: instance.version ?? (await getInstance(instance.id)).version,
      }),
    // TODO(container-task): 启动任务跟踪后续统一接入，当前仅提示已提交并刷新资源。
    onSuccess: refresh,
  });
  const restart = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "container-restart",
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
        id: "container-protection",
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
  const canStart = (instance: Instance) =>
    instance.state === "stopped" || instance.state === "failed";
  const stable = (instance: Instance) => running(instance) || instance.state === "stopped";
  const protectedInstance = (instance: Instance) => instance.termination_protection === true;

  const actions: Array<RowAction<InstanceRecord>> = [
    {
      key: "lifecycle",
      label: (row) => (canStart(row) ? "启动" : "停止"),
      widthLabel: "启动",
      disabled: (row) => {
        const instance = row;
        return canStart(instance)
          ? busy(instance)
          : !running(instance) || busy(instance) || protectedInstance(instance);
      },
      loading: (row) => start.isPending && start.variables?.id === row.id,
      tooltip: (row) =>
        protectedInstance(row) && running(row) ? "已开启终止保护，请先关闭后再停止" : undefined,
      onClick: (row) => {
        const instance = row;
        if (canStart(instance)) return start.mutateAsync(instance);
        setDialog({ action: "stop", instance });
      },
    },
    {
      key: "restart",
      label: "重启",
      disabled: (row) => !running(row) || busy(row),
      onClick: (row) => restart.mutateAsync(row),
    },
    ...(
      [
        "scale",
        "update_image",
        "resize",
        "rollback",
        "attach_volume",
        "detach_volume",
        "attach_filesystem",
        "bind_secret",
        "change_security_groups",
      ] as const
    ).map((action): RowAction<InstanceRecord> => ({
      key: action,
      label: {
        scale: "扩缩容",
        update_image: "更新镜像",
        resize: "变配",
        rollback: "回滚发布",
        attach_volume: "挂载云盘",
        detach_volume: "卸载云盘",
        attach_filesystem: "挂载 NFS",
        bind_secret: "绑定密钥",
        change_security_groups: "更换安全组",
      }[action],
      disabled: (row) => {
        const instance = row;
        if (action === "resize" || action === "rollback") {
          const rollbackAvailable = (instance.container?.history ?? []).some(
            (entry) => entry.revision !== instance.container?.revision,
          );
          return (
            instance.state !== "stopped" ||
            busy(instance) ||
            (action === "rollback" && !rollbackAvailable)
          );
        }
        if (action === "detach_volume") {
          return (
            !stable(instance) ||
            busy(instance) ||
            !(instance.volumes ?? []).some(
              (volume) => volume.kind !== "root_disk" && Boolean(volume.source_ref?.trim()),
            )
          );
        }
        return !stable(instance) || busy(instance);
      },
      onClick: (row) => setDialog({ action, instance: row }),
    })),
    {
      key: "load-balancer",
      label: "挂到负载均衡",
      disabled: () => true,
      tooltip: "当前 Core API 暂未提供负载均衡后端绑定能力",
      onClick: () => undefined,
    },
    {
      key: "copy-endpoint",
      label: "复制访问地址",
      disabled: (row) => !row.endpoint,
      onClick: (row) => copyToClipboard(row.endpoint ?? "", "访问地址"),
    },
    {
      key: "protection",
      label: (row) => (protectedInstance(row) ? "关闭终止保护" : "开启终止保护"),
      widthLabel: "关闭终止保护",
      disabled: (row) => busy(row),
      onClick: (row) => {
        const instance = row;
        return protection.mutateAsync({ instance, enabled: !protectedInstance(instance) });
      },
    },
    {
      key: "terminal",
      label: "远程终端",
      disabled: (row) => !running(row) || row.access?.exec_available === false,
      onClick: (row) => openInstanceTerminalWindow(row.id),
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: (row) => busy(row) || protectedInstance(row),
      onClick: (row) => setDialog({ action: "delete", instance: row }),
    },
  ];

  const close = () => setDialog(undefined);
  const submitted = async () => {
    close();
    await refresh();
  };
  // TODO(container-task): 停止任务跟踪后续统一接入；提交弹窗负责刷新资源，此处只关闭并通知页面。
  const stopSubmitted = () => {
    close();
    setCommandDialog(undefined);
    onChanged();
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
        <ContainerStopModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={stopSubmitted}
        />
      )}
      {dialog?.action === "delete" && (
        <ContainerDeleteModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={deleteSubmitted}
        />
      )}
      {dialog?.action === "scale" && (
        <ContainerScaleModal instance={dialog.instance} onCancel={close} onSubmitted={submitted} />
      )}
      {dialog?.action === "update_image" && (
        <ContainerUpdateImageModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "resize" && (
        <ContainerResizeModal instance={dialog.instance} onCancel={close} onSubmitted={submitted} />
      )}
      {dialog?.action === "rollback" && (
        <ContainerRollbackModal
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
        <ContainerAttachFilesystemModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "bind_secret" && (
        <ContainerBindSecretModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "change_security_groups" && (
        <ContainerChangeSecurityGroupsModal
          instance={dialog.instance}
          onCancel={close}
          onSubmitted={submitted}
        />
      )}
      {commandDialog?.action === "stop" && (
        <ContainerStopModal
          instance={commandDialog.instance}
          onCancel={() => setCommandDialog(undefined)}
          onSubmitted={stopSubmitted}
        />
      )}
      {commandDialog?.action === "delete" && (
        <ContainerDeleteModal
          instance={commandDialog.instance}
          onCancel={() => setCommandDialog(undefined)}
          onSubmitted={deleteSubmitted}
        />
      )}
    </>
  );

  return { dialogNode, actions: governanceActions, legacyActions: actions };
}
