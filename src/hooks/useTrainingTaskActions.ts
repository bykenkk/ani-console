// FIXME(modeldev-integration): 停止受理后只失效并刷新一次缓存，尚未跟踪 stop_requested 到 CLOSED 的最终关闭结果。
// TODO(modeldev-integration): 与详情状态刷新统一观察停止进展，保留“停止已提交”语义，不将 202 当作资源已关闭。
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@arco-design/web-react";
import { stopModelDevExecution, type ModelDevExecution } from "@/api/modeldev";
import type { RowAction } from "@/components/common/DataTable";
import { withId } from "@/lib/id";

export function useTrainingTaskActions(): RowAction<ModelDevExecution>[] {
  const qc = useQueryClient();
  const stop = useMutation({
    mutationFn: (executionId: string) => stopModelDevExecution(executionId),
    meta: {
      feedback: (variables) => ({
        channel: "notification",
        id: withId("training-stop", variables as string),
        action: "停止训练",
        successText: "停止训练已提交",
        errorFallback: "停止失败，请稍后重试",
      }),
    },
    onSuccess: async (_, executionId) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["training-execution", executionId] }),
        qc.invalidateQueries({ queryKey: ["training-executions"] }),
      ]);
    },
  });
  return [
    {
      key: "stop",
      label: "停止训练",
      intent: "danger",
      loading: (task) => stop.isPending && stop.variables === task.execution_id,
      disabled: (task) =>
        task.close_state === "CLOSED" || Boolean(task.stop_requested) || stop.isPending,
      onClick: (task) => {
        Modal.confirm({
          title: "停止训练任务",
          content: `确认停止“${task.name || task.execution_id}”？`,
          okText: "停止",
          okButtonProps: { status: "danger" },
          onOk: () => stop.mutateAsync(task.execution_id),
        });
      },
    },
  ];
}
