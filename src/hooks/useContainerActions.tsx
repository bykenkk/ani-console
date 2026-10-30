import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { instanceIntentUnavailable } from "@/hooks/useInstanceCommandMutation";
import InstanceRestartModal from "@/components/instances/InstanceRestartModal";
import InstanceAttachPvcModal from "@/components/instances/InstanceAttachPvcModal";
import InstanceDetachPvcModal from "@/components/instances/InstanceDetachPvcModal";
import ContainerChangeSecurityGroupsModal from "@/components/instances/ContainerChangeSecurityGroupsModal";
import { useState } from "react";
import { getInstance, startInstance, type InstanceRecord } from "@/api/instances";
import { unavailableAction, type RowAction } from "@/components/common/DataTable/RowActions";
import { openInstanceTerminalWindow } from "@/lib/instances";
import ContainerStopModal from "@/components/containers/ContainerStopModal";
import ContainerDeleteModal from "@/components/containers/ContainerDeleteModal";

const UNAVAILABLE_ACTIONS = [
  { key: "scale", label: "扩缩容" },
  { key: "update_image", label: "更新镜像" },
  { key: "resize", label: "变配" },
  { key: "rollback", label: "回滚发布" },
  // TODO(feature-visibility): 待文件存储支持后恢复 NFS 挂载入口。
  // { key: "attach_filesystem", label: "挂载 NFS" },
  { key: "bind_secret", label: "绑定密钥" },
  { key: "load-balancer", label: "挂到负载均衡" },
  { key: "copy-endpoint", label: "复制访问地址" },
  { key: "protection", label: "终止保护" },
];

export function useContainerActions(onChanged: () => void, onDeleted?: () => void) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{
    action: "stop" | "delete" | "restart" | "attach" | "detach" | "security-groups";
    instance: InstanceRecord;
  }>();
  const submitting = useIsMutating({ mutationKey: ["instance-command"] }) > 0;
  const start = useMutation({
    mutationFn: async (instance: InstanceRecord) =>
      startInstance(instance.id, {
        expected_version: instance.version ?? (await getInstance(instance.id)).version,
      }),
    meta: {
      feedback: {
        channel: "notification",
        id: "container-start",
        action: "启动",
        successText: "启动已提交",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    // TODO(container-task): 后续统一接入任务跟踪，目前只刷新资源并提示已提交。
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["governance-instances"] }),
        qc.invalidateQueries({ queryKey: ["governance-instance"] }),
        qc.invalidateQueries({ queryKey: ["governance-instance-runtime"] }),
      ]);
      onChanged();
    },
  });
  const unavailable = (instance: InstanceRecord) =>
    submitting ||
    Boolean(instance.activeOperationId) ||
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
        if (instance.observedState === "stopped") return start.mutateAsync(instance);
        setDialog({ action: "stop", instance });
      },
    },
    {
      key: "restart",
      label: "重启",
      disabled: (instance) =>
        unavailable(instance) ||
        instanceIntentUnavailable(instance) ||
        instance.observedState !== "running",
      onClick: (instance) => setDialog({ action: "restart", instance }),
    },
    {
      key: "attach_volume",
      label: "挂载云盘",
      disabled: (instance) => unavailable(instance) || instanceIntentUnavailable(instance),
      onClick: (instance) => setDialog({ action: "attach", instance }),
    },
    {
      key: "detach_volume",
      label: "卸载云盘",
      disabled: (instance) => unavailable(instance) || instanceIntentUnavailable(instance),
      onClick: (instance) => setDialog({ action: "detach", instance }),
    },
    {
      key: "change_security_groups",
      label: "更换安全组",
      disabled: unavailable,
      onClick: (instance) => setDialog({ action: "security-groups", instance }),
    },
    // TODO(container-actions): 当前缺少对应正式契约，入口保持禁用；后端开放后逐项接入，不使用其他实例契约补齐。
    ...UNAVAILABLE_ACTIONS.map(({ key, label }) => unavailableAction<InstanceRecord>(key, label)),
    {
      key: "terminal",
      label: "远程终端",
      disabled: (instance) => unavailable(instance) || instance.observedState !== "running",
      onClick: (instance) => openInstanceTerminalWindow(instance.id),
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      disabled: unavailable,
      onClick: (instance) => setDialog({ action: "delete", instance }),
    },
  ];
  const submitted = () => {
    setDialog(undefined);
    onChanged();
  };
  const dialogNode = (
    <>
      {dialog?.action === "restart" && (
        <InstanceRestartModal
          instance={dialog.instance}
          onCancel={() => setDialog(undefined)}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "attach" && (
        <InstanceAttachPvcModal
          instance={dialog.instance}
          onCancel={() => setDialog(undefined)}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "detach" && (
        <InstanceDetachPvcModal
          instance={dialog.instance}
          onCancel={() => setDialog(undefined)}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "security-groups" && (
        <ContainerChangeSecurityGroupsModal
          instance={dialog.instance}
          onCancel={() => setDialog(undefined)}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "stop" && (
        <ContainerStopModal
          instance={dialog.instance}
          onCancel={() => setDialog(undefined)}
          onSubmitted={submitted}
        />
      )}
      {dialog?.action === "delete" && (
        <ContainerDeleteModal
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
