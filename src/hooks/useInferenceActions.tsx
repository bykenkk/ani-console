import { Modal } from "@arco-design/web-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  applyInferenceCommand,
  deleteInferenceService,
  type InferenceCommand,
  type InferenceService,
} from "@/api/inference";
import type { RowAction } from "@/components/common";

type InferenceCommandVariables = { item: InferenceService; command: InferenceCommand };
const commandLabels = { start: "启动", stop: "停止", restart: "重启" };

export function useInferenceActions(onDeleted?: () => void) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<InferenceService>();
  const refresh = async (id: string) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["governance-inference-service", id] }),
      qc.invalidateQueries({ queryKey: ["governance-inference-services"] }),
    ]);
  };
  const lifecycle = useMutation({
    mutationFn: ({ item, command }: InferenceCommandVariables) =>
      applyInferenceCommand(item.id, command, { expected_generation: item.generation }),
    meta: {
      feedback: (variables) => {
        const { command } = variables as InferenceCommandVariables;
        const label = `${commandLabels[command]}推理服务`;
        return {
          channel: "notification",
          id: `inference-${command}`,
          action: label,
          successText: `${label}已提交`,
          errorFallback: `${label}失败`,
        };
      },
    },
    onSuccess: (_, { item }) => refresh(item.id),
  });
  const remove = useMutation({
    // TODO(inference-delete): 删除入口暂时禁用；待后端确认 CPU/GPU 删除传参差异及 expected_generation 是否必填后再调整接入。
    mutationFn: (item: InferenceService) =>
      deleteInferenceService(item.id, item.gpu ? {} : { expected_generation: item.generation }),
    meta: {
      feedback: {
        channel: "notification",
        id: "inference-delete",
        action: "删除推理服务",
        successText: "删除推理服务已提交",
        errorFallback: "删除失败",
      },
    },
    onSuccess: async (_, item) => {
      // TODO(inference-task): 后续统一接入删除任务跟踪；当前受理后刷新列表并返回。
      await qc.invalidateQueries({
        queryKey: ["governance-inference-service", item.id],
        refetchType: "none",
      });
      await qc.invalidateQueries({ queryKey: ["governance-inference-services"] });
      onDeleted?.();
    },
  });
  const pending = () => remove.isPending || lifecycle.isPending || Boolean(editing);
  const unavailable = (item: InferenceService) => pending() || !(Number(item.generation) > 0);
  const actions: RowAction<InferenceService>[] = [
    {
      key: "update",
      label: "更新配置",
      disabled: unavailable,
      onClick: (item) => setEditing(item),
    },
    ...(["start", "stop", "restart"] as const).map((command) => ({
      key: command,
      label: commandLabels[command],
      disabled: unavailable,
      onClick: (item: InferenceService) => {
        if (command === "start") {
          lifecycle.mutate({ item, command });
          return;
        }
        Modal.confirm({
          title: `${commandLabels[command]}推理服务`,
          content: `确定${commandLabels[command]}「${item.name}」？这可能中断正在处理的调用。`,
          onOk: () => lifecycle.mutateAsync({ item, command }),
        });
      },
    })),
    {
      key: "scale",
      label: "调整副本",
      // TODO(governance-migration): 当前更新契约冻结副本及拓扑；开放独立扩缩容接口后接入，不调用 legacy。
      disabled: () => true,
      tooltip: "当前后端尚未开放此操作",
      onClick: () => undefined,
    },
    {
      key: "delete",
      label: "删除",
      intent: "danger",
      // TODO(inference-delete): 待后端确认删除参数并完成接入调整后再开放。
      disabled: () => true,
      tooltip: "删除功能暂不可用",
      onClick: (item) => {
        Modal.confirm({
          title: "删除推理服务",
          content: `确定删除「${item.name}」？服务将异步停止并清理。`,
          okButtonProps: { status: "danger" },
          onOk: () => remove.mutateAsync(item),
        });
      },
    },
  ];
  return {
    actions,
    editing,
    closeEditor: () => setEditing(undefined),
    onUpdated: async () => {
      if (editing) await refresh(editing.id);
      setEditing(undefined);
    },
  };
}
