import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@arco-design/web-react";
import {
  getModelDevExecution,
  stopModelDevExecution,
  type ModelDevExecution,
} from "@/api/modeldev";
import type { RowAction } from "@/components/common/DataTable";
import { withId } from "@/lib/id";

export function useTrainingTaskActions(): RowAction<ModelDevExecution>[] {
  const qc = useQueryClient();
  const refresh = async (executionId: string) => {
    const queryKey = ["training-execution", executionId];
    // 中止操作前尚未完成的读请求，确保随后获取的是操作后的原执行快照。
    await qc.cancelQueries({ queryKey, exact: true });
    await qc.invalidateQueries({ queryKey, exact: true, refetchType: "none" });
    // 列表入口可能尚无详情缓存；查询失败由 QueryCache 通知，不改变写入结果。
    await Promise.allSettled([
      qc.fetchQuery({
        queryKey,
        queryFn: ({ signal }) => getModelDevExecution(executionId, signal),
        meta: {
          errorNotification: {
            id: withId("training-execution", executionId),
            action: "训练任务详情加载",
            fallback: "请稍后重试",
          },
        },
      }),
      qc.invalidateQueries({ queryKey: ["training-executions"] }),
    ]);
  };
  const stop = useMutation({
    mutationFn: (executionId: string) => stopModelDevExecution(executionId),
    retry: false,
    meta: {
      feedback: (variables) => ({
        channel: "notification",
        id: withId("training-stop", variables as string),
        action: "停止训练",
        successText: "停止训练已提交",
        errorFallback: "停止失败，请稍后重试",
      }),
    },
    onSettled: (_, __, executionId) => refresh(executionId),
  });
  return [
    { key: "refresh", label: "刷新状态", onClick: (task) => refresh(task.execution_id) },
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
