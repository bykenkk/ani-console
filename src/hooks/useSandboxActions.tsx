import { Modal } from "@arco-design/web-react";
import { applyInstanceLifecycle, type InstanceRecord } from "@/api/instances/legacy";
import type { RowAction } from "@/components/common";
import SandboxExtendModal from "@/components/sandboxes/SandboxExtendModal";
import { openInstanceTerminalWindow } from "@/lib/instances";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

type Instance = InstanceRecord;
type LifecycleAction = "pause" | "resume" | "extend" | "touch_idle" | "delete";
type LifecycleVariables = { instance: Instance; action: LifecycleAction; duration?: string };
const lifecycleLabels = {
  pause: "暂停沙箱",
  resume: "恢复沙箱",
  extend: "延长会话",
  touch_idle: "活跃续期",
  delete: "销毁沙箱",
};

const TERMINAL_STATES = new Set(["expired", "deleted", "deleting"]);
const BUSY_STATES = new Set<Instance["state"]>([
  "pending",
  "provisioning",
  "starting",
  "stopping",
  "deleting",
]);

function sessionState(instance: Instance) {
  return instance.sandbox?.session_state ?? instance.state;
}

export function useSandboxActions(onChanged: () => void, onDeleted?: () => void) {
  const [extendTarget, setExtendTarget] = useState<Instance>();
  const lifecycle = useMutation({
    meta: {
      feedback: (variables) => {
        const { action } = variables as LifecycleVariables;
        const label = lifecycleLabels[action];
        return {
          channel: "notification",
          id: "sandbox-lifecycle",
          action: label,
          successText:
            action === "extend" || action === "touch_idle" ? `${label}成功` : `${label}已提交`,
          errorFallback: `${label}失败，请稍后重试`,
        };
      },
    },
    mutationFn: async ({ instance, action, duration }: LifecycleVariables) => {
      await applyInstanceLifecycle(instance.id, { action, duration });
    },
    onSuccess: (_, { action }) => {
      if (action === "delete" && onDeleted) onDeleted();
      else onChanged();
    },
  });

  const pending = (instance: Instance) =>
    lifecycle.isPending && lifecycle.variables?.instance.id === instance.id;
  const busy = (instance: Instance) => pending(instance) || BUSY_STATES.has(instance.state);
  const running = (instance: Instance) => sessionState(instance) === "running";
  const resumable = (instance: Instance) =>
    sessionState(instance) === "paused" || sessionState(instance) === "stopped";

  const actions: Array<RowAction<Instance>> = [
    {
      key: "lifecycle",
      label: (instance) => (running(instance) ? "暂停" : "恢复"),
      widthLabel: "暂停",
      disabled: (instance) => busy(instance) || (!running(instance) && !resumable(instance)),
      loading: pending,
      onClick: (instance) =>
        lifecycle.mutateAsync({ instance, action: running(instance) ? "pause" : "resume" }),
    },
    {
      key: "extend",
      label: "延长会话",
      disabled: (instance) => busy(instance) || TERMINAL_STATES.has(sessionState(instance)),
      onClick: setExtendTarget,
    },
    {
      key: "touch-idle",
      label: "活跃续期",
      disabled: (instance) => busy(instance) || !running(instance),
      onClick: (instance) => lifecycle.mutateAsync({ instance, action: "touch_idle" }),
    },
    {
      key: "terminal",
      label: "远程终端",
      disabled: (instance) => !running(instance) || instance.access?.exec_available === false,
      onClick: (instance) => openInstanceTerminalWindow(instance.id),
    },
    {
      key: "delete",
      label: "销毁",
      intent: "danger",
      disabled: (instance) => busy(instance) || sessionState(instance) === "deleted",
      onClick: (instance) => {
        Modal.confirm({
          title: "销毁沙箱",
          content: `确认销毁「${instance.name || instance.id}」？工作区和未保存数据将不可恢复。`,
          okButtonProps: { status: "danger" },
          onOk: () => lifecycle.mutateAsync({ instance, action: "delete" }),
        });
      },
    },
  ];

  const dialogNode = extendTarget ? (
    <SandboxExtendModal
      instance={extendTarget}
      onCancel={() => setExtendTarget(undefined)}
      onSubmitted={() => {
        setExtendTarget(undefined);
        onChanged();
      }}
    />
  ) : null;

  return { dialogNode, actions };
}
