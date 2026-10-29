import { Modal } from "@arco-design/web-react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/request";
import { pauseSandbox, resumeSandbox, deleteSandbox, type Sandbox } from "@/api/sandboxes";
import { unavailableAction, type RowAction } from "@/components/common/DataTable/RowActions";
import { withId } from "@/lib/id";

type SandboxAction = "pause" | "resume" | "delete";
type SandboxActionVariables = { sandbox: Sandbox; action: SandboxAction };
const LABELS: Record<SandboxAction, string> = {
  pause: "暂停沙箱",
  resume: "恢复沙箱",
  delete: "销毁沙箱",
};

export function useSandboxActions(onDeleted?: () => void) {
  const qc = useQueryClient();
  const pending = useIsMutating({ mutationKey: ["sandbox-write"] });
  const mutation = useMutation({
    mutationKey: ["sandbox-write", "lifecycle"],
    retry: false,
    mutationFn: async ({ sandbox, action }: SandboxActionVariables) => {
      await { pause: pauseSandbox, resume: resumeSandbox, delete: deleteSandbox }[action](
        sandbox.id,
        { expected_version: sandbox.version },
      );
    },
    meta: {
      feedback: (variables) => {
        const { action, sandbox } = variables as SandboxActionVariables;
        return {
          channel: "notification",
          id: withId(`sandbox-${action}`, sandbox.id),
          action: LABELS[action],
          successText: `${LABELS[action]}已提交`,
        };
      },
    },
    onSuccess: async (_, { action, sandbox }) => {
      // TODO(sandbox-task): 创建、删除操作跟踪暂缓，只刷新服务端资源状态。
      if (action === "delete") {
        await qc.invalidateQueries({ queryKey: ["sandboxes", sandbox.id], refetchType: "none" });
        onDeleted?.();
        await qc.invalidateQueries({ queryKey: ["sandboxes", "list"] });
      } else await qc.invalidateQueries({ queryKey: ["sandboxes"] });
    },
    onError: async (error, { sandbox }) => {
      if (error instanceof ApiError && error.status === 409)
        await Promise.all([
          qc.invalidateQueries({ queryKey: ["sandboxes", sandbox.id] }),
          qc.invalidateQueries({ queryKey: ["sandboxes", "list"] }),
        ]);
    },
  });
  const closed = (sandbox: Sandbox) =>
    sandbox.desired_state === "deleted" || sandbox.observed_state === "deleted";
  const unavailable = (sandbox: Sandbox) => pending > 0 || closed(sandbox);
  const confirm = (sandbox: Sandbox, action: SandboxAction) => {
    const dialog = Modal.confirm({
      title: LABELS[action],
      content:
        action === "delete"
          ? `确认销毁「${sandbox.snapshot?.name || sandbox.id}」？运行环境和工作区数据将被删除，无法恢复。`
          : action === "pause"
            ? `确认暂停「${sandbox.snapshot?.name || sandbox.id}」？工作区文件保留，内存和运行中的进程不会保留。`
            : `确认恢复「${sandbox.snapshot?.name || sandbox.id}」？将使用原工作区重新启动运行环境。`,
      okButtonProps: { status: action === "delete" ? "danger" : "default" },
      onOk: async () => {
        try {
          await mutation.mutateAsync({ sandbox, action });
        } catch (error) {
          // 冲突后关闭持有旧版本的确认框，基于刷新结果重新确认。
          if (error instanceof ApiError && error.status === 409) dialog.close();
          throw error;
        }
      },
    });
  };
  const actions: RowAction<Sandbox>[] = [
    {
      key: "lifecycle",
      label: (sandbox) => (sandbox.desired_state === "paused" ? "恢复" : "暂停"),
      widthLabel: "暂停",
      disabled: unavailable,
      onClick: (sandbox) =>
        confirm(sandbox, sandbox.desired_state === "paused" ? "resume" : "pause"),
    },
    // TODO(sandbox-legacy): 独立 Sandbox 尚无续期、终端契约，保留禁用入口和旧实现，不向旧接口传新 ID。
    unavailableAction("extend", "延长会话"),
    unavailableAction("touch-idle", "活跃续期"),
    unavailableAction("terminal", "远程终端"),
    {
      key: "delete",
      label: "销毁",
      intent: "danger",
      disabled: unavailable,
      onClick: (sandbox) => confirm(sandbox, "delete"),
    },
  ];
  return { actions };
}
